package com.codesync.repository;

import com.codesync.entity.CodeComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CodeCommentRepository extends JpaRepository<CodeComment, String> {
    List<CodeComment> findByFileIdOrderByCreatedAtAsc(String fileId);
    List<CodeComment> findByRoomId(String roomId);
    void deleteByFileId(String fileId);
    void deleteByRoomId(String roomId);
}
