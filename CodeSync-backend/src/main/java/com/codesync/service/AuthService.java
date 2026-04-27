package com.codesync.service;

import com.codesync.dto.auth.*;
import com.codesync.dto.room.ProfileDto;
import com.codesync.entity.Profile;
import com.codesync.entity.User;
import com.codesync.entity.UserRole;
import com.codesync.entity.UserRoleType;
import com.codesync.exception.ApiException;
import com.codesync.exception.ForbiddenException;
import com.codesync.repository.ProfileRepository;
import com.codesync.repository.UserRepository;
import com.codesync.repository.UserRoleRepository;
import com.codesync.security.CustomUserDetailsService;
import com.codesync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{2,30}$");

    @Transactional
    public AuthResponse signUp(SignUpReq req) {
        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ApiException("Email already in use"); // I'll use 409 later in error handler
        }

        String username = req.getUsername();
        if (username == null || username.isBlank()) {
            username = email.split("@")[0];
        }
        
        // Sanitize and validate username
        username = sanitizeUsername(username);
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            throw new ApiException("Invalid username format. Must be 2-30 characters (alphanumeric, _ or -)");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .emailVerified(false)
                .build();
        user = userRepository.save(user);

        Profile profile = Profile.builder()
                .id(user.getId())
                .username(username)
                .build();
        profile = profileRepository.save(profile);

        // Assign default PARTICIPANT role
        UserRole userRole = UserRole.builder()
                .userId(user.getId())
                .role(UserRoleType.PARTICIPANT)
                .build();
        userRoleRepository.save(userRole);

        UserPrincipal principal = userDetailsService.loadUserById(user.getId());
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .profile(mapToProfileDto(profile))
                .build();
    }

    public AuthResponse signIn(SignInReq req) {
        User user = userRepository.findByEmail(req.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new ApiException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new ApiException("Invalid email or password");
        }

        Profile profile = profileRepository.findById(user.getId())
                .orElseThrow(() -> new ApiException("Profile not found"));

        UserPrincipal principal = userDetailsService.loadUserById(user.getId());
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .profile(mapToProfileDto(profile))
                .build();
    }

    public String refresh(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken)) {
            throw new ForbiddenException("Invalid refresh token");
        }
        String userId = jwtService.extractUserId(refreshToken);
        UserPrincipal principal = userDetailsService.loadUserById(userId);
        return jwtService.generateAccessToken(principal);
    }

    public UserProfileDto me(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found"));
        Profile profile = profileRepository.findById(user.getId())
                .orElseThrow(() -> new ApiException("Profile not found"));
        List<String> roles = userRoleRepository.findByUserId(user.getId()).stream()
                .map(role -> role.getRole().name())
                .collect(Collectors.toList());

        return UserProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .profile(mapToProfileDto(profile))
                .roles(roles)
                .build();
    }

    @Transactional
    public ProfileDto updateProfile(String userId, UpdateProfileReq req) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ApiException("Profile not found"));

        if (req.getUsername() != null && !req.getUsername().isBlank()) {
            String username = sanitizeUsername(req.getUsername());
            if (!USERNAME_PATTERN.matcher(username).matches()) {
                throw new ApiException("Invalid username format");
            }
            profile.setUsername(username);
        }

        if (req.getAvatarUrl() != null) {
            profile.setAvatarUrl(req.getAvatarUrl());
        }

        profile.setUpdatedAt(java.time.LocalDateTime.now());
        return mapToProfileDto(profileRepository.save(profile));
    }

    private String sanitizeUsername(String username) {
        return username.replaceAll("[^a-zA-Z0-9_-]", "");
    }

    private ProfileDto mapToProfileDto(Profile profile) {
        return ProfileDto.builder()
                .id(profile.getId())
                .username(profile.getUsername())
                .avatarUrl(profile.getAvatarUrl())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
