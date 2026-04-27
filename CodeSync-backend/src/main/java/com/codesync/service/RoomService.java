package com.codesync.service;

import com.codesync.dto.room.ParticipantDto;
import com.codesync.dto.room.PermissionsDto;
import com.codesync.dto.room.RoomDto;
import com.codesync.entity.Room;
import com.codesync.entity.RoomParticipant;
import com.codesync.entity.RoomPermissions;
import com.codesync.exception.NotFoundException;
import com.codesync.repository.RoomParticipantRepository;
import com.codesync.repository.RoomPermissionsRepository;
import com.codesync.repository.RoomRepository;
import com.codesync.security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomParticipantRepository participantRepository;
    private final RoomPermissionsRepository permissionsRepository;
    private final AuthorizationService authorizationService;
    private final SimpMessagingTemplate messagingTemplate;

    private static final List<String> COLOR_PALETTE = List.of(
            "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"
    );

    @Transactional
    public RoomDto createRoom(String name, String language, String userId, String username) {
        Room room = Room.builder()
                .name(name)
                .language(language)
                .code("")
                .hostId(userId)
                .isActive(true)
                .build();
        room = roomRepository.save(room);

        // Create default permissions
        RoomPermissions permissions = RoomPermissions.builder()
                .roomId(room.getId())
                .canEdit(true)
                .canExecute(true)
                .canChat(true)
                .canVideo(true)
                .canAudio(true)
                .build();
        permissionsRepository.save(permissions);

        // Create host participant
        RoomParticipant host = RoomParticipant.builder()
                .roomId(room.getId())
                .userId(userId)
                .username(username)
                .cursorColor(COLOR_PALETTE.get(0))
                .isHost(true)
                .build();
        participantRepository.save(host);

        return getRoom(room.getId(), userId);
    }

    public RoomDto getRoom(String roomId, String userId) {
        authorizationService.requireMember(roomId, userId);
        
        Room room = roomRepository.findByIdAndIsActiveTrue(roomId)
                .orElseThrow(() -> new NotFoundException("Room not found or inactive"));

        List<RoomParticipant> participants = participantRepository.findByRoomId(roomId);
        RoomPermissions permissions = permissionsRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RuntimeException("Permissions not found for room"));

        return mapToRoomDto(room, participants, permissions);
    }

    public Map<String, Object> lookupRoom(String roomId) {
        return roomRepository.findByIdAndIsActiveTrue(roomId)
                .map(room -> Map.of(
                        "found", true,
                        "room", Map.of(
                                "id", room.getId(),
                                "name", room.getName(),
                                "language", room.getLanguage(),
                                "hostId", room.getHostId(),
                                "isActive", room.getIsActive()
                        )
                ))
                .orElse(Map.of("found", false));
    }

    @Transactional
    public RoomDto updateRoom(String roomId, String name, String language, String code, String userId) {
        authorizationService.requireHost(roomId, userId);

        Room room = roomRepository.findByIdAndIsActiveTrue(roomId)
                .orElseThrow(() -> new NotFoundException("Room not found"));

        if (name != null) room.setName(name);
        if (language != null && !language.equals(room.getLanguage())) {
            room.setLanguage(language);
            room.setCode(""); // Reset code on language switch
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/host", Map.of(
                    "type", "lang-change",
                    "language", language
            ));
        }
        if (code != null) room.setCode(code);

        room.setUpdatedAt(LocalDateTime.now());
        room = roomRepository.save(room);

        return getRoom(roomId, userId);
    }

    @Transactional
    public void deleteRoom(String roomId, String userId) {
        authorizationService.requireHost(roomId, userId);

        Room room = roomRepository.findByIdAndIsActiveTrue(roomId)
                .orElseThrow(() -> new NotFoundException("Room not found"));

        room.setIsActive(false);
        roomRepository.save(room);
    }

    public void muteUser(String roomId, String targetUserId, String currentUserId) {
        authorizationService.requireHost(roomId, currentUserId);
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/host", Map.of(
                "type", "mute",
                "userId", targetUserId
        ));
    }

    public void muteAll(String roomId, String currentUserId) {
        authorizationService.requireHost(roomId, currentUserId);
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/host", Map.of(
                "type", "mute-all"
        ));
    }

    public String getNextAvailableColor(String roomId) {
        List<String> usedColors = participantRepository.findByRoomId(roomId).stream()
                .map(RoomParticipant::getCursorColor)
                .collect(Collectors.toList());

        for (String color : COLOR_PALETTE) {
            if (!usedColors.contains(color)) {
                return color;
            }
        }
        return COLOR_PALETTE.get(usedColors.size() % COLOR_PALETTE.size());
    }

    private RoomDto mapToRoomDto(Room room, List<RoomParticipant> participants, RoomPermissions permissions) {
        return RoomDto.builder()
                .id(room.getId())
                .name(room.getName())
                .language(room.getLanguage())
                .code(room.getCode())
                .hostId(room.getHostId())
                .isActive(room.getIsActive())
                .createdAt(room.getCreatedAt())
                .participants(participants.stream().map(this::mapToParticipantDto).collect(Collectors.toList()))
                .permissions(mapToPermissionsDto(permissions))
                .build();
    }

    private ParticipantDto mapToParticipantDto(RoomParticipant p) {
        return ParticipantDto.builder()
                .id(p.getId())
                .roomId(p.getRoomId())
                .userId(p.getUserId())
                .username(p.getUsername())
                .cursorColor(p.getCursorColor())
                .isHost(p.getIsHost())
                .joinedAt(p.getJoinedAt())
                .build();
    }

    private PermissionsDto mapToPermissionsDto(RoomPermissions p) {
        return PermissionsDto.builder()
                .roomId(p.getRoomId())
                .canEdit(p.getCanEdit())
                .canExecute(p.getCanExecute())
                .canChat(p.getCanChat())
                .canVideo(p.getCanVideo())
                .canAudio(p.getCanAudio())
                .build();
    }
}
