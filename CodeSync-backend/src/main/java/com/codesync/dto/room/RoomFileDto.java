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
public class RoomFileDto {
    private String id;
    private String roomId;
    private String name;
    private String content;
    private String language;
    private LocalDateTime updatedAt;
}
