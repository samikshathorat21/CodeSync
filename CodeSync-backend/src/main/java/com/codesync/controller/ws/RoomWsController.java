package com.codesync.controller.ws;

import com.codesync.dto.editor.CursorPosition;
import com.codesync.dto.editor.ViewportPosition;
import com.codesync.entity.Room;
import com.codesync.entity.RoomParticipant;
import com.codesync.entity.RoomPermissions;
import com.codesync.exception.ForbiddenException;
import com.codesync.exception.NotFoundException;
import com.codesync.repository.RoomParticipantRepository;
import com.codesync.repository.RoomPermissionsRepository;
import com.codesync.repository.RoomRepository;
import com.codesync.security.UserPrincipal;
import com.codesync.service.CodeVersionService;
import com.codesync.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class RoomWsController {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomRepository roomRepository;
    private final RoomParticipantRepository participantRepository;
    private final RoomPermissionsRepository permissionsRepository;
    private final CodeVersionService codeVersionService;
    private final PresenceService presenceService;

    @MessageMapping("/room/{roomId}/code")
    public void updateCode(
            @DestinationVariable String roomId,
            Map<String, String> payload,
            UsernamePasswordAuthenticationToken auth) {
        
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        checkCanEdit(roomId, principal.getId());

        String code = payload.get("code");
        Room room = roomRepository.findById(roomId).orElseThrow();
        room.setCode(code);
        roomRepository.save(room);

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/code", Map.of(
                "code", code,
                "language", room.getLanguage(),
                "fromUserId", principal.getId(),
                "ts", System.currentTimeMillis()
        ));
    }

    @MessageMapping("/room/{roomId}/typing")
    public void updateTyping(
            @DestinationVariable String roomId,
            Map<String, Boolean> payload,
            UsernamePasswordAuthenticationToken auth) {
        
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/typing", Map.of(
                "userId", principal.getId(),
                "userName", principal.getDisplayUsername(),
                "isTyping", payload.get("isTyping")
        ));
    }

    @MessageMapping("/room/{roomId}/viewport")
    public void updateViewport(
            @DestinationVariable String roomId,
            ViewportPosition viewport,
            UsernamePasswordAuthenticationToken auth) {
        
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        RoomParticipant p = participantRepository.findByRoomIdAndUserId(roomId, principal.getId()).orElseThrow();

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/viewport", Map.of(
                "userId", principal.getId(),
                "userName", p.getUsername(),
                "color", p.getCursorColor(),
                "startLine", viewport.getStartLine(),
                "endLine", viewport.getEndLine()
        ));
    }

    @MessageMapping("/room/{roomId}/cursor")
    public void updateCursor(
            @DestinationVariable String roomId,
            CursorPosition cursor,
            UsernamePasswordAuthenticationToken auth) {
        
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        RoomParticipant p = participantRepository.findByRoomIdAndUserId(roomId, principal.getId()).orElseThrow();

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/cursor", Map.of(
                "userId", principal.getId(),
                "userName", p.getUsername(),
                "color", p.getCursorColor(),
                "line", cursor.getLine(),
                "column", cursor.getColumn()
        ));
    }

    @MessageMapping("/room/{roomId}/save")
    public void saveVersion(
            @DestinationVariable String roomId,
            Map<String, String> payload,
            UsernamePasswordAuthenticationToken auth) {
        
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        Room room = roomRepository.findById(roomId).orElseThrow();
        
        codeVersionService.createVersion(
                roomId, 
                room.getCode(), 
                room.getLanguage(), 
                principal.getId(), 
                principal.getDisplayUsername()
        );
    }

    @MessageMapping("/room/{roomId}/presence/sync")
    public void syncPresence(
            @DestinationVariable String roomId,
            SimpMessageHeaderAccessor headerAccessor,
            UsernamePasswordAuthenticationToken auth) {
        
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        presenceService.join(roomId, principal.getId(), principal.getDisplayUsername(), headerAccessor.getSessionId());
    }

    @MessageMapping("/room/{roomId}/presence/heartbeat")
    public void heartbeat(
            @DestinationVariable String roomId,
            UsernamePasswordAuthenticationToken auth) {
        
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        presenceService.heartbeat(roomId, principal.getId());
    }

    private void checkCanEdit(String roomId, String userId) {
        RoomPermissions permissions = permissionsRepository.findByRoomId(roomId)
                .orElseThrow(() -> new NotFoundException("Permissions not found"));
        
        Room room = roomRepository.findById(roomId).orElseThrow();
        if (!room.getHostId().equals(userId) && !permissions.getCanEdit()) {
            throw new ForbiddenException("Editing is disabled");
        }
    }
}
