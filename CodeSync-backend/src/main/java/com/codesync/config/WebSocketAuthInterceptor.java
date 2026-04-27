package com.codesync.config;

import com.codesync.security.CustomUserDetailsService;
import com.codesync.security.UserPrincipal;
import com.codesync.security.AuthorizationService;
import com.codesync.service.JwtService;
import com.codesync.service.RateLimitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final AuthorizationService authorizationService;
    private final RateLimitService rateLimitService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor == null) return message;

        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            handleConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            handleSubscribe(accessor);
        } else if (StompCommand.SEND.equals(command)) {
            handleSend(accessor);
        }

        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null) {
            authHeader = accessor.getFirstNativeHeader("token");
        }

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new MessageDeliveryException("Unauthorized: Missing token");
        }

        String token = authHeader.substring(7);
        if (jwtService.isTokenValid(token)) {
            String userId = jwtService.extractUserId(token);
            UserPrincipal principal = userDetailsService.loadUserById(userId);
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    principal, null, principal.getAuthorities()
            );
            accessor.setUser(auth);
        } else {
            throw new MessageDeliveryException("Unauthorized: Invalid token");
        }
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null) return;

        String roomId = extractRoomId(destination);
        if (roomId != null) {
            UserPrincipal principal = getPrincipal(accessor);
            if (!authorizationService.isMember(roomId, principal.getId())) {
                throw new MessageDeliveryException("Forbidden: Not a member of this room");
            }
        }
    }

    private void handleSend(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null) return;

        UserPrincipal principal = getPrincipal(accessor);
        String roomId = extractRoomId(destination);

        // Membership check for all room-specific destinations
        if (roomId != null) {
            if (!authorizationService.isMember(roomId, principal.getId())) {
                throw new MessageDeliveryException("Forbidden: Not a member of this room");
            }
        }

        // Rate limiting for WebRTC signaling
        if (destination.contains("/webrtc/signal")) {
            var probe = rateLimitService.tryConsume("webrtc", principal.getId());
            if (!probe.isConsumed()) {
                throw new MessageDeliveryException("rate limit exceeded");
            }
        }
    }

    private String extractRoomId(String destination) {
        // Pattern: /app/room/{roomId}/* or /topic/room/{roomId}/*
        String[] parts = destination.split("/");
        if (parts.length >= 4 && parts[2].equals("room")) {
            return parts[3];
        }
        return null;
    }

    private UserPrincipal getPrincipal(StompHeaderAccessor accessor) {
        UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) accessor.getUser();
        if (auth == null) throw new MessageDeliveryException("Unauthorized");
        return (UserPrincipal) auth.getPrincipal();
    }
}
