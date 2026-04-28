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
public class CodeCommentDto {
    private String id;
    private String fileId;
    private String roomId;
    private Integer line;
    private String userId;
    private String userName;
    private String content;
    private LocalDateTime createdAt;
}
