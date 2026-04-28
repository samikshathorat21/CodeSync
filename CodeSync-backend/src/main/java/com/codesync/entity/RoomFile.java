package com.codesync.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "room_files")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomFile {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "room_id", nullable = false, length = 36)
    private String roomId;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "LONGTEXT")
    private String content = "";

    @Column(nullable = false, length = 20)
    private String language;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
