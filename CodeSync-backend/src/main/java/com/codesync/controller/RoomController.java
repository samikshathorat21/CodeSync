package com.codesync.controller;

import com.codesync.dto.room.CreateRoomReq;
import com.codesync.dto.room.RoomDto;
import com.codesync.dto.room.UpdateRoomReq;
import com.codesync.security.UserPrincipal;
import com.codesync.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import com.codesync.repository.ProfileRepository;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final ProfileRepository profileRepository;

    @PostMapping
    public ResponseEntity<RoomDto> createRoom(
            @Valid @RequestBody CreateRoomReq req,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        String username = profileRepository.findById(principal.getId())
                .map(p -> p.getUsername())
                .orElse(principal.getDisplayUsername());
                
        if (username.length() > 30) username = username.substring(0, 30);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(roomService.createRoom(req.getName(), req.getLanguage(), principal.getId(), username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomDto> getRoom(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(roomService.getRoom(id, principal.getId()));
    }

    @GetMapping("/lookup")
    public ResponseEntity<Map<String, Object>> lookupRoom(@RequestParam String roomId) {
        return ResponseEntity.ok(roomService.lookupRoom(roomId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<RoomDto> updateRoom(
            @PathVariable String id,
            @RequestBody UpdateRoomReq req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(roomService.updateRoom(id, req.getName(), req.getLanguage(), req.getCode(), principal.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        roomService.deleteRoom(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/host/mute")
    public ResponseEntity<Void> muteUser(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        roomService.muteUser(id, body.get("targetUserId"), principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/host/mute-all")
    public ResponseEntity<Void> muteAll(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        roomService.muteAll(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
