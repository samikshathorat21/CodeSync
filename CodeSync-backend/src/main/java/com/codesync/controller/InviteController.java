package com.codesync.controller;

import com.codesync.dto.invite.AcceptInviteReq;
import com.codesync.dto.invite.AcceptInviteResponse;
import com.codesync.dto.invite.CreateInviteReq;
import com.codesync.dto.invite.InviteDto;
import com.codesync.dto.invite.SendEmailInviteReq;
import com.codesync.security.UserPrincipal;
import com.codesync.service.InviteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invites")
@RequiredArgsConstructor
public class InviteController {

    private final InviteService inviteService;

    @PostMapping
    public ResponseEntity<InviteDto> createInvite(
            @Valid @RequestBody CreateInviteReq req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inviteService.createInvite(req.getRoomId(), req.getRole(), principal.getId()));
    }

    @PostMapping("/accept")
    public ResponseEntity<AcceptInviteResponse> acceptInvite(
            @Valid @RequestBody AcceptInviteReq req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(inviteService.acceptInvite(req.getToken(), principal.getId(), principal.getDisplayUsername()));
    }

    @PostMapping("/email")
    public ResponseEntity<Void> sendEmailInvite(
            @Valid @RequestBody SendEmailInviteReq req,
            @AuthenticationPrincipal UserPrincipal principal) {
        inviteService.sendEmailInvite(req.getToken(), req.getRecipientEmail(), req.getRecipientName(), principal.getId());
        return ResponseEntity.noContent().build();
    }
}
