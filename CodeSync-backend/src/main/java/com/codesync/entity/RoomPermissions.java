package com.codesync.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "room_permissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomPermissions {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "room_id", nullable = false, unique = true, length = 36)
    private String roomId;

    @Column(name = "can_edit")
    private Boolean canEdit = true;

    @Column(name = "can_execute")
    private Boolean canExecute = true;

    @Column(name = "can_chat")
    private Boolean canChat = true;

    @Column(name = "can_video")
    private Boolean canVideo = true;

    @Column(name = "can_audio")
    private Boolean canAudio = true;

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
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }
}
