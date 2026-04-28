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
import com.codesync.service.RoomFileService;
import com.codesync.service.CodeCommentService;
import com.codesync.dto.room.RoomFileDto;
import com.codesync.dto.room.CodeCommentDto;
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
    private final RoomFileService roomFileService;
    private final CodeCommentService codeCommentService;

    @MessageMapping("/room/{roomId}/code")
    public void updateCode(
            @DestinationVariable String roomId,
            Map<String, String> payload,
            UsernamePasswordAuthenticationToken auth) {
        
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        checkCanEdit(roomId, principal.getId());

        String code = payload.get("code");
        String fileId = payload.get("fileId");

        if (fileId != null) {
            roomFileService.updateFileContent(fileId, code);
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/code", Map.of(
                    "code", code,
                    "fileId", fileId,
                    "fromUserId", principal.getId(),
                    "ts", System.currentTimeMillis()
            ));
        } else {
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
    }

    @MessageMapping("/room/{roomId}/file/create")
    public void createFile(
            @DestinationVariable String roomId,
            Map<String, String> payload,
            UsernamePasswordAuthenticationToken auth) {
        
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        checkCanEdit(roomId, principal.getId());

        String name = payload.get("name");
        String language = payload.get("language");
        
        System.out.println("Creating file: " + name + " in room: " + roomId);
        RoomFileDto file = roomFileService.createFile(roomId, name, language);
        System.out.println("File created with ID: " + file.getId());
        
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/files", Map.of(
                "type", "CREATE",
                "file", file
        ));
    }

    @MessageMapping("/room/{roomId}/comment/add")
    public void addComment(
            @DestinationVariable String roomId,
            Map<String, Object> payload,
            UsernamePasswordAuthenticationToken auth) {
        
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        String fileId = (String) payload.get("fileId");
        Integer line = (Integer) payload.get("line");
        String content = (String) payload.get("content");
        
        codeCommentService.addComment(roomId, fileId, principal.getId(), principal.getDisplayUsername(), line, content);
    }

    @MessageMapping("/room/{roomId}/file/delete")
    public void deleteFile(
            @DestinationVariable String roomId,
            Map<String, String> payload,
            UsernamePasswordAuthenticationToken auth) {
        
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        checkCanEdit(roomId, principal.getId());

        String fileId = payload.get("fileId");
        roomFileService.deleteFile(fileId);
        
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/files", Map.of(
                "type", "DELETE",
                "fileId", fileId
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
