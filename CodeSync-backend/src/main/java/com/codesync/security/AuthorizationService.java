package com.codesync.security;

import com.codesync.entity.RoomParticipant;
import com.codesync.exception.ForbiddenException;
import com.codesync.repository.RoomParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthorizationService {

    private final RoomParticipantRepository roomParticipantRepository;

    public boolean isHost(String roomId, String userId) {
        return roomParticipantRepository.findByRoomIdAndUserId(roomId, userId)
                .map(RoomParticipant::getIsHost)
                .orElse(false);
    }

    public boolean isMember(String roomId, String userId) {
        return roomParticipantRepository.existsByRoomIdAndUserId(roomId, userId);
    }

    public void requireHost(String roomId, String userId) {
        if (!isHost(roomId, userId)) {
            throw new ForbiddenException("You must be the host to perform this action");
        }
    }

    public void requireMember(String roomId, String userId) {
        if (!isMember(roomId, userId)) {
            throw new ForbiddenException("You must be a member of this room to perform this action");
        }
    }
}
