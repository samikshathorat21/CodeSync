package com.codesync.service;

import com.codesync.dto.invite.AcceptInviteResponse;
import com.codesync.dto.invite.InviteDto;
import com.codesync.entity.InviteToken;
import com.codesync.entity.RoomParticipant;
import com.codesync.entity.UserRoleType;
import com.codesync.exception.NotFoundException;
import com.codesync.repository.InviteTokenRepository;
import com.codesync.repository.RoomParticipantRepository;
import com.codesync.security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class InviteService {

    private final InviteTokenRepository inviteTokenRepository;
    private final RoomParticipantRepository participantRepository;
    private final AuthorizationService authorizationService;
    private final ParticipantService participantService;
    private final RoomService roomService;
    private final EmailService emailService;
    private final RateLimitService rateLimitService;

    @Value("${app.cors.allowed-origins}")
    private String frontendDomain; // Simplified for this logic

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public InviteDto createInvite(String roomId, String role, String userId) {
        authorizationService.requireHost(roomId, userId);

        // Rate Limit Check
        var probe = rateLimitService.tryConsume("invite", userId);
        if (!probe.isConsumed()) {
            throw new com.codesync.exception.ApiException("Rate limit exceeded for invites. Try again later.");
        }

        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        InviteToken inviteToken = InviteToken.builder()
                .roomId(roomId)
                .token(token)
                .role(role.equalsIgnoreCase("host") ? UserRoleType.HOST : UserRoleType.PARTICIPANT)
                .createdBy(userId)
                .isUsed(false)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        inviteToken = inviteTokenRepository.save(inviteToken);

        String inviteUrl = "https://codesync-dev.lovable.app/join?token=" + token;

        return InviteDto.builder()
                .token(token)
                .inviteUrl(inviteUrl)
                .expiresAt(inviteToken.getExpiresAt())
                .roomId(roomId)
                .role(inviteToken.getRole().name())
                .build();
    }

    @Transactional
    public AcceptInviteResponse acceptInvite(String token, String userId, String username) {
        InviteToken inviteToken = inviteTokenRepository.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Invite token not found"));

        if (inviteToken.getIsUsed()) {
            throw new com.codesync.exception.ApiException("Invite token already used");
        }

        if (inviteToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new com.codesync.exception.ApiException("Invite token expired");
        }

        inviteToken.setIsUsed(true);
        inviteToken.setUsedBy(userId);
        inviteToken.setUsedAt(LocalDateTime.now());
        inviteTokenRepository.save(inviteToken);

        var participantDto = participantService.joinRoom(inviteToken.getRoomId(), userId, username);
        
        // If invite role was host, promote them
        if (inviteToken.getRole() == UserRoleType.HOST) {
            RoomParticipant p = participantRepository.findByRoomIdAndUserId(inviteToken.getRoomId(), userId)
                    .orElseThrow();
            p.setIsHost(true);
            participantRepository.save(p);
            participantDto.setIsHost(true);
        }

        return AcceptInviteResponse.builder()
                .room(roomService.getRoom(inviteToken.getRoomId(), userId))
                .participant(participantDto)
                .build();
    }

    public void sendEmailInvite(String token, String recipientEmail, String recipientName, String userId) {
        InviteToken inviteToken = inviteTokenRepository.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Invite token not found"));

        // Validate token belongs to caller's room as host
        authorizationService.requireHost(inviteToken.getRoomId(), userId);

        // Rate Limit Check
        var probe = rateLimitService.tryConsume("invite-email", userId);
        if (!probe.isConsumed()) {
            throw new com.codesync.exception.ApiException("Rate limit exceeded for emails. Try again later.");
        }

        String inviteUrl = "https://codesync-dev.lovable.app/join?token=" + token;
        var room = roomService.getRoom(inviteToken.getRoomId(), userId);
        
        emailService.sendInviteEmail(recipientEmail, recipientName, inviteUrl, room.getName(), room.getHostId());
    }
}
