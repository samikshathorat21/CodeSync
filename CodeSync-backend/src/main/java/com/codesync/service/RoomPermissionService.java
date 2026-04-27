package com.codesync.service;

import com.codesync.dto.room.PermissionsDto;
import com.codesync.dto.webrtc.HostEventMsg;
import com.codesync.entity.RoomPermissions;
import com.codesync.exception.NotFoundException;
import com.codesync.repository.RoomPermissionsRepository;
import com.codesync.security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RoomPermissionService {

    private final RoomPermissionsRepository permissionsRepository;
    private final AuthorizationService authorizationService;
    private final SimpMessagingTemplate messagingTemplate;

    public PermissionsDto getPermissions(String roomId, String userId) {
        authorizationService.requireMember(roomId, userId);
        return permissionsRepository.findByRoomId(roomId)
                .map(this::mapToPermissionsDto)
                .orElseThrow(() -> new NotFoundException("Permissions not found for room"));
    }

    @Transactional
    public PermissionsDto updatePermissions(String roomId, PermissionsDto updates, String userId) {
        authorizationService.requireHost(roomId, userId);

        RoomPermissions permissions = permissionsRepository.findByRoomId(roomId)
                .orElseThrow(() -> new NotFoundException("Permissions not found for room"));

        if (updates.getCanEdit() != null) permissions.setCanEdit(updates.getCanEdit());
        if (updates.getCanExecute() != null) permissions.setCanExecute(updates.getCanExecute());
        
        if (updates.getCanChat() != null) permissions.setCanChat(updates.getCanChat());
        
        if (updates.getCanVideo() != null) {
            permissions.setCanVideo(updates.getCanVideo());
            if (!updates.getCanVideo()) {
                broadcastPermissionChange(roomId, "canVideo", false);
            }
        }
        
        if (updates.getCanAudio() != null) {
            permissions.setCanAudio(updates.getCanAudio());
            if (!updates.getCanAudio()) {
                broadcastPermissionChange(roomId, "canAudio", false);
            }
        }

        permissions.setUpdatedAt(LocalDateTime.now());
        permissions = permissionsRepository.save(permissions);

        PermissionsDto dto = mapToPermissionsDto(permissions);
        
        // Broadcast full permissions update
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/permissions", dto);

        return dto;
    }

    private void broadcastPermissionChange(String roomId, String permission, Object value) {
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/host", HostEventMsg.builder()
                .type("permission-change")
                .permission(permission)
                .value(value)
                .build());
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
