package com.codesync.controller.ws;

import com.codesync.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatWsController {

    private final ChatService chatService;

    @MessageMapping("/room/{roomId}/chat")
    public void sendMessage(
            @DestinationVariable String roomId,
            Map<String, String> payload,
            UsernamePasswordAuthenticationToken auth) {
        
        com.codesync.security.UserPrincipal principal = (com.codesync.security.UserPrincipal) auth.getPrincipal();
        chatService.sendMessage(roomId, payload.get("content"), principal.getId(), principal.getDisplayUsername());
    }
}
