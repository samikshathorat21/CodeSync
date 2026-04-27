package com.codesync.repository;

import com.codesync.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {
    List<ChatMessage> findByRoomIdAndCreatedAtBefore(String roomId, LocalDateTime before, Pageable pageable);
    List<ChatMessage> findByRoomId(String roomId, Pageable pageable);
}
