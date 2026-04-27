package com.codesync.controller;

import com.codesync.dto.room.PermissionsDto;
import com.codesync.security.UserPrincipal;
import com.codesync.service.RoomPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms/{id}/permissions")
@RequiredArgsConstructor
public class RoomPermissionController {

    private final RoomPermissionService permissionService;

    @GetMapping
    public ResponseEntity<PermissionsDto> getPermissions(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(permissionService.getPermissions(id, principal.getId()));
    }

    @PatchMapping
    public ResponseEntity<PermissionsDto> updatePermissions(
            @PathVariable String id,
            @RequestBody PermissionsDto updates,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(permissionService.updatePermissions(id, updates, principal.getId()));
    }
}
