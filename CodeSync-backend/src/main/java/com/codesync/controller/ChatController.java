package com.codesync.controller;

import com.codesync.dto.chat.ChatMessageDto;
import com.codesync.dto.chat.SendMessageReq;
import com.codesync.security.UserPrincipal;
import com.codesync.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/rooms/{id}/messages")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ResponseEntity<List<ChatMessageDto>> getMessages(
            @PathVariable String id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime before,
            @RequestParam(required = false) Integer limit,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(chatService.getMessages(id, before, limit, principal.getId()));
    }

    @PostMapping
    public ResponseEntity<ChatMessageDto> sendMessage(
            @PathVariable String id,
            @Valid @RequestBody SendMessageReq req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.sendMessage(id, req.getContent(), principal.getId(), principal.getDisplayUsername()));
    }
}
