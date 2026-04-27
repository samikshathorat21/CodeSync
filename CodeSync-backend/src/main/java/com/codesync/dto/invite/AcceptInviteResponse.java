package com.codesync.dto.invite;

import com.codesync.dto.room.ParticipantDto;
import com.codesync.dto.room.RoomDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcceptInviteResponse {
    private RoomDto room;
    private ParticipantDto participant;
}
