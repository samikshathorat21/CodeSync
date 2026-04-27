package com.codesync.controller;

import com.codesync.dto.auth.*;
import com.codesync.dto.room.ProfileDto;
import com.codesync.security.UserPrincipal;
import com.codesync.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/auth/signup")
    public ResponseEntity<AuthResponse> signUp(@Valid @RequestBody SignUpReq req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signUp(req));
    }

    @PostMapping("/auth/signin")
    public ResponseEntity<AuthResponse> signIn(@Valid @RequestBody SignInReq req) {
        return ResponseEntity.ok(authService.signIn(req));
    }

    @PostMapping("/auth/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshReq req) {
        String newAccessToken = authService.refresh(req.getRefreshToken());
        return ResponseEntity.ok().body(new java.util.HashMap<String, String>() {{
            put("accessToken", newAccessToken);
        }});
    }

    @PostMapping("/auth/signout")
    public ResponseEntity<Void> signOut() {
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/auth/me")
    public ResponseEntity<UserProfileDto> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(authService.me(principal.getId()));
    }

    @PatchMapping("/profiles/me")
    public ResponseEntity<ProfileDto> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateProfileReq req) {
        return ResponseEntity.ok(authService.updateProfile(principal.getId(), req));
    }
}
