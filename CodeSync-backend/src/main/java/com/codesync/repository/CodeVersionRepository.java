package com.codesync.repository;

import com.codesync.entity.CodeVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CodeVersionRepository extends JpaRepository<CodeVersion, String> {
    List<CodeVersion> findByRoomIdOrderByCreatedAtDesc(String roomId);
}
