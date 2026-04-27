package com.codesync.dto.room;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantDto {
    private String id;
    private String roomId;
    private String userId;
    private String username;
    private String cursorColor;
    private Boolean isHost;
    private LocalDateTime joinedAt;
}
