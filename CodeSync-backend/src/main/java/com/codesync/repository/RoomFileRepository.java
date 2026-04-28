package com.codesync.repository;

import com.codesync.entity.RoomFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomFileRepository extends JpaRepository<RoomFile, String> {
    List<RoomFile> findByRoomId(String roomId);
    void deleteByRoomId(String roomId);
}
