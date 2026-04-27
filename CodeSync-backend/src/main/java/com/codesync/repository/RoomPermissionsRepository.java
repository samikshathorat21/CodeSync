package com.codesync.repository;

import com.codesync.entity.RoomPermissions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoomPermissionsRepository extends JpaRepository<RoomPermissions, String> {
    Optional<RoomPermissions> findByRoomId(String roomId);
}
