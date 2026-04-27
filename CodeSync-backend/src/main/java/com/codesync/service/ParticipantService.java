package com.codesync.service;

import com.codesync.config.SessionStore;
import com.codesync.dto.room.ParticipantDto;
import com.codesync.dto.webrtc.HostEventMsg;
import com.codesync.entity.Room;
import com.codesync.entity.RoomParticipant;
import com.codesync.exception.ForbiddenException;
import com.codesync.exception.NotFoundException;
import com.codesync.repository.RoomParticipantRepository;
import com.codesync.repository.RoomRepository;
import com.codesync.security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.WebSocketSession;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParticipantService {

    private final RoomParticipantRepository participantRepository;
    private final RoomRepository roomRepository;
    private final AuthorizationService authorizationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final PresenceService presenceService;
    private final SimpUserRegistry userRegistry;
    private final SessionStore sessionStore;

    public List<ParticipantDto> getParticipants(String roomId, String userId) {
        authorizationService.requireMember(roomId, userId);
        return participantRepository.findByRoomId(roomId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ParticipantDto joinRoom(String roomId, String userId, String username) {
        Room room = roomRepository.findByIdAndIsActiveTrue(roomId)
                .orElseThrow(() -> new NotFoundException("Room not found"));

        return participantRepository.findByRoomIdAndUserId(roomId, userId)
                .map(this::mapToDto)
                .orElseGet(() -> {
                    String color = getNextAvailableColor(roomId);
                    RoomParticipant participant = RoomParticipant.builder()
                            .roomId(roomId)
                            .userId(userId)
                            .username(username)
                            .isHost(room.getHostId().equals(userId))
                            .cursorColor(color)
                            .joinedAt(LocalDateTime.now())
                            .build();
                    participant = participantRepository.save(participant);
                    
                    ParticipantDto dto = mapToDto(participant);
                    presenceService.join(roomId, userId, username, null); // SessionId handled in sync mapping
                    return dto;
                });
    }

    @Transactional
    public void removeParticipant(String roomId, String targetUserId, String currentUserId) {
        Room room = roomRepository.findById(roomId).orElseThrow();
        boolean isHostAction = currentUserId.equals(room.getHostId());
        
        if (!isHostAction && !currentUserId.equals(targetUserId)) {
            throw new ForbiddenException("Only host can remove participants");
        }

        RoomParticipant p = participantRepository.findByRoomIdAndUserId(roomId, targetUserId)
                .orElseThrow(() -> new NotFoundException("Participant not found"));

        participantRepository.delete(p);

        // If it was a kick (host action), broadcast and force disconnect
        if (isHostAction && !targetUserId.equals(currentUserId)) {
            log.info("Host {} is kicking user {} from room {}", currentUserId, targetUserId, roomId);
            
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/host", HostEventMsg.builder()
                    .type("kick")
                    .userId(targetUserId)
                    .build());

            // Force close WebSocket sessions
            SimpUser user = userRegistry.getUser(targetUserId);
            if (user != null) {
                user.getSessions().forEach(session -> {
                    WebSocketSession wsSession = sessionStore.getSession(session.getId());
                    if (wsSession != null && wsSession.isOpen()) {
                        try {
                            log.info("Closing session {} for kicked user {}", session.getId(), targetUserId);
                            wsSession.close();
                        } catch (Exception e) {
                            log.error("Failed to close session for kicked user", e);
                        }
                    }
                });
            }
        }

        presenceService.leave(roomId, targetUserId);
    }

    private String getNextAvailableColor(String roomId) {
        List<String> usedColors = participantRepository.findByRoomId(roomId).stream()
                .map(RoomParticipant::getCursorColor)
                .collect(Collectors.toList());

        String[] palette = {"#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"};
        for (String color : palette) {
            if (!usedColors.contains(color)) return color;
        }
        return palette[0];
    }

    private ParticipantDto mapToDto(RoomParticipant p) {
        return ParticipantDto.builder()
                .id(p.getId())
                .roomId(p.getRoomId())
                .userId(p.getUserId())
                .username(p.getUsername())
                .isHost(p.getIsHost())
                .cursorColor(p.getCursorColor())
                .joinedAt(p.getJoinedAt())
                .build();
    }
}
