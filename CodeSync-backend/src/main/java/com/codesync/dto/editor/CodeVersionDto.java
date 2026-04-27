package com.codesync.dto.editor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeVersionDto {
    private String id;
    private String roomId;
    private String code;
    private String language;
    private String savedBy;
    private String savedByUsername;
    private LocalDateTime createdAt;
}
