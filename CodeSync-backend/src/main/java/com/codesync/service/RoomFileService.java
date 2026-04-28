package com.codesync.service;

import com.codesync.dto.room.RoomFileDto;
import com.codesync.entity.RoomFile;
import com.codesync.repository.RoomFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomFileService {

    private final RoomFileRepository fileRepository;

    public List<RoomFileDto> getFilesByRoom(String roomId) {
        return fileRepository.findByRoomId(roomId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoomFileDto createFile(String roomId, String name, String language) {
        RoomFile file = RoomFile.builder()
                .roomId(roomId)
                .name(name)
                .language(language)
                .content("")
                .build();
        return mapToDto(fileRepository.save(file));
    }

    @Transactional
    public RoomFileDto updateFileContent(String fileId, String content) {
        RoomFile file = fileRepository.findById(fileId).orElseThrow();
        file.setContent(content);
        return mapToDto(fileRepository.save(file));
    }

    @Transactional
    public void deleteFile(String fileId) {
        fileRepository.deleteById(fileId);
    }

    public RoomFileDto mapToDto(RoomFile file) {
        return RoomFileDto.builder()
                .id(file.getId())
                .roomId(file.getRoomId())
                .name(file.getName())
                .content(file.getContent())
                .language(file.getLanguage())
                .updatedAt(file.getUpdatedAt())
                .build();
    }
}
