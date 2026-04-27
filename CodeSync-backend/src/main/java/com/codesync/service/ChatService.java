package com.codesync.service;

import com.codesync.dto.chat.ChatMessageDto;
import com.codesync.entity.ChatMessage;
import com.codesync.entity.RoomPermissions;
import com.codesync.exception.ForbiddenException;
import com.codesync.exception.NotFoundException;
import com.codesync.repository.ChatMessageRepository;
import com.codesync.repository.RoomPermissionsRepository;
import com.codesync.security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final RoomPermissionsRepository permissionsRepository;
    private final AuthorizationService authorizationService;
    private final SimpMessagingTemplate messagingTemplate;

    public List<ChatMessageDto> getMessages(String roomId, LocalDateTime before, Integer limit, String userId) {
        authorizationService.requireMember(roomId, userId);
        
        // Check if user has chat permission (optional for read? usually members can read history)
        // But prompt says "Auth: room member + canChat permission" for GET.
        checkCanChat(roomId, userId);

        int pageSize = limit != null ? Math.min(limit, 100) : 50;
        Pageable pageable = PageRequest.of(0, pageSize, Sort.by("createdAt").ascending());

        List<ChatMessage> messages;
        if (before != null) {
            messages = chatMessageRepository.findByRoomIdAndCreatedAtBefore(roomId, before, pageable);
        } else {
            messages = chatMessageRepository.findByRoomId(roomId, pageable);
        }

        return messages.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageDto sendMessage(String roomId, String content, String userId, String username) {
        authorizationService.requireMember(roomId, userId);
        checkCanChat(roomId, userId);

        if (content.length() > 2000) {
            throw new com.codesync.exception.ApiException("Message too long (max 2000 chars)");
        }

        ChatMessage message = ChatMessage.builder()
                .roomId(roomId)
                .userId(userId)
                .username(username)
                .content(content)
                .build();

        message = chatMessageRepository.save(message);
        ChatMessageDto dto = mapToDto(message);

        // Broadcast chat message
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/chat", dto);

        return dto;
    }

    private void checkCanChat(String roomId, String userId) {
        RoomPermissions permissions = permissionsRepository.findByRoomId(roomId)
                .orElseThrow(() -> new NotFoundException("Permissions not found"));
        
        boolean isHost = authorizationService.isHost(roomId, userId);
        if (!isHost && !permissions.getCanChat()) {
            throw new ForbiddenException("Chatting is currently disabled in this room");
        }
    }

    private ChatMessageDto mapToDto(ChatMessage m) {
        return ChatMessageDto.builder()
                .id(m.getId())
                .roomId(m.getRoomId())
                .userId(m.getUserId())
                .username(m.getUsername())
                .content(m.getContent())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
