package com.codesync.dto.invite;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteDto {
    private String token;
    private String inviteUrl;
    private LocalDateTime expiresAt;
    private String roomId;
    private String role;
}
