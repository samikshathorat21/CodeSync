package com.codesync.controller;

import com.codesync.dto.editor.CodeVersionDto;
import com.codesync.dto.editor.CreateVersionReq;
import com.codesync.dto.room.RoomDto;
import com.codesync.security.UserPrincipal;
import com.codesync.service.CodeVersionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms/{id}/versions")
@RequiredArgsConstructor
public class CodeVersionController {

    private final CodeVersionService codeVersionService;

    @GetMapping
    public ResponseEntity<List<CodeVersionDto>> getVersions(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(codeVersionService.getVersions(id, principal.getId()));
    }

    @PostMapping
    public ResponseEntity<CodeVersionDto> createVersion(
            @PathVariable String id,
            @Valid @RequestBody CreateVersionReq req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(codeVersionService.createVersion(id, req.getCode(), req.getLanguage(), principal.getId(), principal.getDisplayUsername()));
    }

    @PostMapping("/{versionId}/restore")
    public ResponseEntity<RoomDto> restoreVersion(
            @PathVariable String id,
            @PathVariable String versionId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(codeVersionService.restoreVersion(id, versionId, principal.getId()));
    }
}
