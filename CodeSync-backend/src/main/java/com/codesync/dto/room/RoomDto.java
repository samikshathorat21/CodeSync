package com.codesync.dto.room;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomDto {
    private String id;
    private String name;
    private String language;
    private String code;
    private String hostId;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private List<ParticipantDto> participants;
    private PermissionsDto permissions;
}
