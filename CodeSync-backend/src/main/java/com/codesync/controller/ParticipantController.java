package com.codesync.controller;

import com.codesync.dto.room.ParticipantDto;
import com.codesync.security.UserPrincipal;
import com.codesync.service.ParticipantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.codesync.repository.ProfileRepository;

@RestController
@RequestMapping("/api/rooms/{id}/participants")
@RequiredArgsConstructor
public class ParticipantController {

    private final ParticipantService participantService;
    private final ProfileRepository profileRepository;

    @PostMapping("/join")
    public ResponseEntity<ParticipantDto> joinRoom(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        String username = profileRepository.findById(principal.getId())
                .map(p -> p.getUsername())
                .orElse(principal.getDisplayUsername());
                
        if (username.length() > 30) username = username.substring(0, 30);

        return ResponseEntity.ok(participantService.joinRoom(id, principal.getId(), username));
    }

    @GetMapping
    public ResponseEntity<List<ParticipantDto>> getParticipants(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(participantService.getParticipants(id, principal.getId()));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> removeParticipant(
            @PathVariable String id,
            @PathVariable String userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        participantService.removeParticipant(id, userId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
