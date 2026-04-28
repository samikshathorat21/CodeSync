package com.codesync.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codesync.dto.exec.ExecuteReq;
import com.codesync.dto.exec.ExecuteResponse;
import com.codesync.entity.RoomPermissions;
import com.codesync.exception.ForbiddenException;
import com.codesync.repository.RoomPermissionsRepository;
import com.codesync.security.AuthorizationService;
import com.codesync.security.UserPrincipal;
import com.codesync.service.CodeExecutionService;
import com.codesync.service.RateLimitService;

import io.github.bucket4j.ConsumptionProbe;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/execute")
@RequiredArgsConstructor
@Slf4j
public class CodeExecutionController {

    private final CodeExecutionService codeExecutionService;
    private final AuthorizationService authorizationService;
    private final RoomPermissionsRepository permissionsRepository;
    private final RateLimitService rateLimitService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<?> execute(
            @Valid @RequestBody ExecuteReq req,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Execute endpoint called: language='{}', codeLength={}, stdinLength={}, roomId={}, userId={}", 
                 req.getLanguage(), req.getCode().length(), req.getStdin() != null ? req.getStdin().length() : 0, req.getRoomId(), principal.getId());
        
        // 1. Authorization check if roomId is present
        boolean isRoomExecution = req.getRoomId() != null && !req.getRoomId().isBlank();
        if (isRoomExecution) {
            authorizationService.requireMember(req.getRoomId(), principal.getId());
            
            RoomPermissions permissions = permissionsRepository.findByRoomId(req.getRoomId())
                    .orElseThrow(() -> new com.codesync.exception.NotFoundException("Room permissions not found"));
            
            if (!permissions.getCanExecute()) {
                log.warn("Code execution denied for user {} - disabled in room {}", principal.getId(), req.getRoomId());
                throw new ForbiddenException("Code execution is disabled for this room");
            }

            // Broadcast that execution has started
            messagingTemplate.convertAndSend("/topic/room/" + req.getRoomId() + "/execution", Map.of(
                "type", "START",
                "userId", principal.getId(),
                "userName", principal.getDisplayUsername()
            ));
        }

        // 2. Rate limiting
        ConsumptionProbe probe = rateLimitService.tryConsume("execute", principal.getId());
        if (!probe.isConsumed()) {
            long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000L;
            
            if (isRoomExecution) {
                messagingTemplate.convertAndSend("/topic/room/" + req.getRoomId() + "/execution", Map.of(
                    "type", "ERROR",
                    "error", "Rate limit exceeded. Please wait " + waitForRefill + "s"
                ));
            }

            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many requests", "retryAfter", waitForRefill));
        }

        // 3. Execution
        try {
            ExecuteResponse response = codeExecutionService.execute(req);
            
            if (isRoomExecution) {
                messagingTemplate.convertAndSend("/topic/room/" + req.getRoomId() + "/execution", Map.of(
                    "type", "SUCCESS",
                    "result", response,
                    "userId", principal.getId()
                ));
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Execution failed", e);
            if (isRoomExecution) {
                messagingTemplate.convertAndSend("/topic/room/" + req.getRoomId() + "/execution", Map.of(
                    "type", "ERROR",
                    "error", "Internal execution error"
                ));
            }
            throw e;
        }
    }
}
