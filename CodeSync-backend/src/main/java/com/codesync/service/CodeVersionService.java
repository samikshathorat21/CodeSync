package com.codesync.service;

import com.codesync.dto.editor.CodeVersionDto;
import com.codesync.dto.room.RoomDto;
import com.codesync.entity.CodeVersion;
import com.codesync.entity.Room;
import com.codesync.entity.RoomPermissions;
import com.codesync.exception.ForbiddenException;
import com.codesync.exception.NotFoundException;
import com.codesync.repository.CodeVersionRepository;
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
public class CodeVersionService {

    private final CodeVersionRepository codeVersionRepository;
    private final RoomRepository roomRepository;
    private final RoomPermissionsRepository permissionsRepository;
    private final AuthorizationService authorizationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;

    public List<CodeVersionDto> getVersions(String roomId, String userId) {
        authorizationService.requireMember(roomId, userId);
        return codeVersionRepository.findByRoomIdOrderByCreatedAtDesc(roomId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CodeVersionDto createVersion(String roomId, String code, String language, String userId, String username) {
        authorizationService.requireMember(roomId, userId);
        checkCanEdit(roomId, userId);

        CodeVersion version = CodeVersion.builder()
                .roomId(roomId)
                .code(code)
                .language(language)
                .savedBy(userId)
                .savedByUsername(username)
                .build();

        version = codeVersionRepository.save(version);
        CodeVersionDto dto = mapToDto(version);

        // Broadcast version creation
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/version", dto);

        return dto;
    }

    @Transactional
    public RoomDto restoreVersion(String roomId, String versionId, String userId) {
        authorizationService.requireHost(roomId, userId);

        CodeVersion version = codeVersionRepository.findById(versionId)
                .orElseThrow(() -> new NotFoundException("Version not found"));
        
        if (!version.getRoomId().equals(roomId)) {
            throw new com.codesync.exception.ApiException("Version does not belong to this room");
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("Room not found"));

        room.setCode(version.getCode());
        room.setLanguage(version.getLanguage());
        room.setUpdatedAt(LocalDateTime.now());
        roomRepository.save(room);

        // Broadcast code change
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/code", Map.of(
                "code", version.getCode(),
                "language", version.getLanguage()
        ));

        return roomService.getRoom(roomId, userId);
    }

    private void checkCanEdit(String roomId, String userId) {
        RoomPermissions permissions = permissionsRepository.findByRoomId(roomId)
                .orElseThrow(() -> new NotFoundException("Permissions not found"));
        
        boolean isHost = authorizationService.isHost(roomId, userId);
        if (!isHost && !permissions.getCanEdit()) {
            throw new ForbiddenException("Editing is currently disabled in this room");
        }
    }

    private CodeVersionDto mapToDto(CodeVersion v) {
        return CodeVersionDto.builder()
                .id(v.getId())
                .roomId(v.getRoomId())
                .code(v.getCode())
                .language(v.getLanguage())
                .savedBy(v.getSavedBy())
                .savedByUsername(v.getSavedByUsername())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
