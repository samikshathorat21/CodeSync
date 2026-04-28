package com.codesync.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "code_comments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeComment {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "file_id", nullable = false, length = 36)
    private String fileId;

    @Column(name = "room_id", nullable = false, length = 36)
    private String roomId;

    @Column(nullable = false)
    private Integer line;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "user_name", nullable = false, length = 100)
    private String userName;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
