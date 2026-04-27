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
@Table(name = "code_versions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeVersion {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "room_id", nullable = false, length = 36)
    private String roomId;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String code;

    @Column(nullable = false, length = 20)
    private String language;

    @Column(name = "saved_by", nullable = false, length = 36)
    private String savedBy;

    @Column(name = "saved_by_username", nullable = false, length = 30)
    private String savedByUsername;

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
