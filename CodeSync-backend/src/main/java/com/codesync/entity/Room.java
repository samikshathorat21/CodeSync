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
@Table(name = "rooms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Room {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "LONGTEXT")
    private String code = "";

    @Column(nullable = false, length = 20)
    private String language = "java";

    @Column(name = "host_id", nullable = false, length = 36)
    private String hostId;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = generateShortId();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    private String generateShortId() {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        java.util.Random rnd = new java.security.SecureRandom();
        return String.format("%s-%s-%s",
            generateRandomString(chars, rnd, 3),
            generateRandomString(chars, rnd, 3),
            generateRandomString(chars, rnd, 3));
    }

    private String generateRandomString(String chars, java.util.Random rnd, int length) {
        StringBuilder sb = new StringBuilder(length);
        for(int i = 0; i < length; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
}

