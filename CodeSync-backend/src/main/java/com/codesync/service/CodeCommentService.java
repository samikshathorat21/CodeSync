package com.codesync.service;

import com.codesync.dto.room.CodeCommentDto;
import com.codesync.entity.CodeComment;
import com.codesync.repository.CodeCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CodeCommentService {

    private final CodeCommentRepository commentRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<CodeCommentDto> getCommentsByFile(String fileId) {
        return commentRepository.findByFileIdOrderByCreatedAtAsc(fileId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CodeCommentDto addComment(String roomId, String fileId, String userId, String userName, Integer line, String content) {
        CodeComment comment = CodeComment.builder()
                .roomId(roomId)
                .fileId(fileId)
                .userId(userId)
                .userName(userName)
                .line(line)
                .content(content)
                .build();
        
        CodeComment saved = commentRepository.save(comment);
        CodeCommentDto dto = mapToDto(saved);
        
        // Broadcast new comment to the room
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/comments", Map.of(
            "type", "ADD",
            "comment", dto
        ));
        
        return dto;
    }

    @Transactional
    public void deleteComment(String roomId, String commentId) {
        commentRepository.deleteById(commentId);
        
        // Broadcast deletion
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/comments", Map.of(
            "type", "DELETE",
            "commentId", commentId
        ));
    }

    private CodeCommentDto mapToDto(CodeComment comment) {
        return CodeCommentDto.builder()
                .id(comment.getId())
                .roomId(comment.getRoomId())
                .fileId(comment.getFileId())
                .line(comment.getLine())
                .userId(comment.getUserId())
                .userName(comment.getUserName())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
