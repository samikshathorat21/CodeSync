package com.codesync.repository;

import com.codesync.entity.RoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, String> {
    Optional<RoomParticipant> findByRoomIdAndUserId(String roomId, String userId);
    boolean existsByRoomIdAndUserId(String roomId, String userId);
    List<RoomParticipant> findByRoomId(String roomId);
    List<RoomParticipant> findByRoomIdAndUserIdIn(String roomId, List<String> userIds);
}
