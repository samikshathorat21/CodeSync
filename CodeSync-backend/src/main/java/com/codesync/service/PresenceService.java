package com.codesync.service;

import com.codesync.dto.room.ParticipantDto;
import com.codesync.repository.RoomParticipantRepository;
import com.codesync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PresenceService {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomParticipantRepository participantRepository;

    // In-memory presence: roomId -> { userId -> expiryInstant }
    private final Map<String, Map<String, Instant>> roomPresence = new ConcurrentHashMap<>();
    // sessionId -> set of roomIds
    private final Map<String, Set<String>> sessionRooms = new ConcurrentHashMap<>();
    // userId lookup by sessionId
    private final Map<String, String> sessionUsers = new ConcurrentHashMap<>();

    private static final long PRESENCE_TTL_SECONDS = 60;

    public void join(String roomId, String userId, String username, String sessionId) {
        Map<String, Instant> users = roomPresence.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>());
        users.put(userId, Instant.now().plusSeconds(PRESENCE_TTL_SECONDS));

        if (sessionId != null) {
            sessionRooms.computeIfAbsent(sessionId, k -> ConcurrentHashMap.newKeySet())
                    .add(roomId);
            sessionUsers.put(sessionId, userId);
        }

        broadcastPresence(roomId, "join", userId, username);
    }

    public void heartbeat(String roomId, String userId) {
        boolean wasMissing = false;
        Map<String, Instant> users = roomPresence.computeIfAbsent(roomId, k -> {
            return new ConcurrentHashMap<>();
        });
        
        if (!users.containsKey(userId)) {
            wasMissing = true;
        }
        
        users.put(userId, Instant.now().plusSeconds(PRESENCE_TTL_SECONDS));
        
        // If they were timed out but are still here, broadcast so they reappear for others
        if (wasMissing) {
            log.info("User {} restored to room {} via heartbeat", userId, roomId);
            broadcastPresence(roomId, "join", userId, null);
        }
    }

    public void leave(String roomId, String userId) {
        Map<String, Instant> users = roomPresence.get(roomId);
        if (users != null) {
            users.remove(userId);
            if (users.isEmpty()) {
                roomPresence.remove(roomId);
            }
        }
        broadcastPresence(roomId, "leave", userId, null);
    }

    public List<ParticipantDto> getAllPresent(String roomId) {
        Map<String, Instant> users = roomPresence.get(roomId);
        if (users == null || users.isEmpty()) return List.of();

        Instant now = Instant.now();
        List<String> activeUserIds = users.entrySet().stream()
                .filter(e -> e.getValue().isAfter(now))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        if (activeUserIds.isEmpty()) return List.of();

        return participantRepository.findByRoomIdAndUserIdIn(roomId, activeUserIds).stream()
                .map(p -> ParticipantDto.builder()
                        .id(p.getId())
                        .roomId(p.getRoomId())
                        .userId(p.getUserId())
                        .username(p.getUsername())
                        .cursorColor(p.getCursorColor())
                        .isHost(p.getIsHost())
                        .joinedAt(p.getJoinedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private void broadcastPresence(String roomId, String type, String userId, String username) {
        List<ParticipantDto> participants = getAllPresent(roomId);
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/presence", Map.of(
                "type", type,
                "userId", userId,
                "username", username != null ? username : "",
                "participants", participants
        ));
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        UsernamePasswordAuthenticationToken user = (UsernamePasswordAuthenticationToken) headerAccessor.getUser();
        
        if (user != null) {
            String userId = ((UserPrincipal) user.getPrincipal()).getId();
            String sessionId = headerAccessor.getSessionId();
            
            log.info("WebSocket Session Disconnected: {} for user: {}", sessionId, userId);
            
            Set<String> roomIds = sessionRooms.remove(sessionId);
            sessionUsers.remove(sessionId);
            if (roomIds != null) {
                for (String roomId : roomIds) {
                    leave(roomId, userId);
                }
            }
        }
    }

    @Scheduled(fixedDelay = 10000)
    public void cleanupExpiredPresence() {
        Instant now = Instant.now();
        for (Map.Entry<String, Map<String, Instant>> roomEntry : roomPresence.entrySet()) {
            String roomId = roomEntry.getKey();
            Map<String, Instant> users = roomEntry.getValue();
            boolean changed = users.entrySet().removeIf(e -> e.getValue().isBefore(now));
            if (changed) {
                broadcastPresence(roomId, "cleanup", "", null);
            }
            if (users.isEmpty()) {
                roomPresence.remove(roomId);
            }
        }
    }
}
