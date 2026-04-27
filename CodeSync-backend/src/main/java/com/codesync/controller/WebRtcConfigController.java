package com.codesync.controller;

import com.codesync.security.AuthorizationService;
import com.codesync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/webrtc")
@RequiredArgsConstructor
public class WebRtcConfigController {

    private final AuthorizationService authorizationService;

    @GetMapping("/ice-servers")
    public ResponseEntity<Map<String, Object>> getIceServers(
            @RequestParam String roomId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        authorizationService.requireMember(roomId, principal.getId());

        return ResponseEntity.ok(Map.of(
                "iceServers", List.of(
                        Map.of("urls", List.of("stun:stun.l.google.com:19302")),
                        Map.of("urls", List.of("stun:stun1.l.google.com:19302"))
                )
        ));
    }
}
