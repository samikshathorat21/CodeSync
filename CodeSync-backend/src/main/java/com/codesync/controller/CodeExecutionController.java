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

    @PostMapping
    public ResponseEntity<?> execute(
            @Valid @RequestBody ExecuteReq req,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Execute endpoint called: language='{}', codeLength={}, stdinLength={}, roomId={}, userId={}", 
                 req.getLanguage(), req.getCode().length(), req.getStdin() != null ? req.getStdin().length() : 0, req.getRoomId(), principal.getId());
        log.debug("Execute request stdin value: '{}', isEmpty: {}", 
                  req.getStdin(), req.getStdin() == null || req.getStdin().isEmpty());
        
        // 1. Authorization check if roomId is present
        if (req.getRoomId() != null && !req.getRoomId().isBlank()) {
            authorizationService.requireMember(req.getRoomId(), principal.getId());
            
            RoomPermissions permissions = permissionsRepository.findByRoomId(req.getRoomId())
                    .orElseThrow(() -> new com.codesync.exception.NotFoundException("Room permissions not found"));
            
            if (!permissions.getCanExecute()) {
                log.warn("Code execution denied for user {} - disabled in room {}", principal.getId(), req.getRoomId());
                throw new ForbiddenException("Code execution is disabled for this room");
            }
        }

        // 2. Rate limiting
        ConsumptionProbe probe = rateLimitService.tryConsume("execute", principal.getId());
        if (!probe.isConsumed()) {
            long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000L;
            log.warn("Rate limit exceeded for user {}: wait {} seconds", principal.getId(), waitForRefill);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("X-RateLimit-Limit", "10")
                    .header("X-RateLimit-Remaining", "0")
                    .header("X-RateLimit-Reset", String.valueOf(System.currentTimeMillis() / 1000 + waitForRefill))
                    .body(Map.of(
                            "error", "Too many requests",
                            "retryAfter", waitForRefill
                    ));
        }

        // 3. Execution
        ExecuteResponse response = codeExecutionService.execute(req);
        log.info("Code execution completed: language='{}', status='{}', userId={}", 
                 req.getLanguage(), response.getStatus(), principal.getId());
        return ResponseEntity.ok(response);
    }
}
