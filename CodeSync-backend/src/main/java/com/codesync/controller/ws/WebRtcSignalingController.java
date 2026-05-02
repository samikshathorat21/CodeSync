package com.codesync.controller.ws;

import com.codesync.dto.webrtc.MediaStateMsg;
import com.codesync.dto.webrtc.SignalMsg;
import com.codesync.security.UserPrincipal;
import com.codesync.service.WebRtcSignalingService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class WebRtcSignalingController {

    private final WebRtcSignalingService signalingService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/webrtc/signal")
    public void handleSignal(SignalMsg msg, UsernamePasswordAuthenticationToken auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        signalingService.relaySignal(msg, principal);
    }

    @MessageMapping("/webrtc/state")
    public void handleMediaState(MediaStateMsg msg, UsernamePasswordAuthenticationToken auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        signalingService.broadcastMediaState(msg.getRoomId(), msg, principal.getId());
    }

    @MessageMapping("/room/{roomId}/webrtc/join")
    public void handleJoin(
            @DestinationVariable String roomId,
            Map<String, String> payload,
            UsernamePasswordAuthenticationToken auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/webrtc/join",
                Map.of("userId", principal.getId()));
    }
}
