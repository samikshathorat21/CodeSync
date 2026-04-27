package com.codesync.service;

import com.codesync.dto.webrtc.MediaStateMsg;
import com.codesync.dto.webrtc.SignalMsg;
import com.codesync.entity.RoomPermissions;
import com.codesync.exception.ForbiddenException;
import com.codesync.exception.NotFoundException;
import com.codesync.repository.RoomPermissionsRepository;
import com.codesync.security.AuthorizationService;
import com.codesync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebRtcSignalingService {

    private final SimpMessagingTemplate messagingTemplate;
    private final AuthorizationService authorizationService;
    private final RoomPermissionsRepository permissionsRepository;

    // In-memory throttle map: key -> last broadcast timestamp
    private final Map<String, Long> speakingThrottle = new ConcurrentHashMap<>();

    public void relaySignal(SignalMsg msg, UserPrincipal sender) {
        String roomId = msg.getRoomId();
        String fromUserId = sender.getId();
        
        authorizationService.requireMember(roomId, fromUserId);
        
        // Enforce permissions for audio/video if present in media config
        if (msg.getMedia() != null) {
            enforcePeerPermissions(roomId, fromUserId, msg.getMedia().isAudio(), msg.getMedia().isVideo());
        }

        msg.setFromUserId(fromUserId);

        log.debug("Relaying {} signal from {} to {} in room {}", msg.getType(), fromUserId, msg.getToUserId(), roomId);
        
        // Relay to targeted user
        messagingTemplate.convertAndSendToUser(msg.getToUserId(), "/queue/webrtc", msg);
    }

    public void broadcastMediaState(String roomId, MediaStateMsg msg, String userId) {
        authorizationService.requireMember(roomId, userId);
        msg.setUserId(userId);
        msg.setRoomId(roomId);

        // Throttle "speaking" updates (200ms minimum gap)
        String throttleKey = roomId + ":" + userId;
        long now = System.currentTimeMillis();
        Long lastBroadcast = speakingThrottle.get(throttleKey);

        if (lastBroadcast == null || (now - lastBroadcast) >= 200) {
            speakingThrottle.put(throttleKey, now);
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/media", msg);
        }
    }

    public void enforcePeerPermissions(String roomId, String userId, boolean wantsAudio, boolean wantsVideo) {
        RoomPermissions p = permissionsRepository.findByRoomId(roomId)
                .orElseThrow(() -> new NotFoundException("Permissions not found"));

        boolean isHost = authorizationService.isHost(roomId, userId);

        if (wantsAudio && !p.getCanAudio() && !isHost) {
            throw new ForbiddenException("Audio is disabled in this room");
        }
        if (wantsVideo && !p.getCanVideo() && !isHost) {
            throw new ForbiddenException("Video is disabled in this room");
        }
    }
}
