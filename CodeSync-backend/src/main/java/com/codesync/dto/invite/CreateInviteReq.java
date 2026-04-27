package com.codesync.dto.invite;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInviteReq {
    @NotBlank(message = "RoomId is required")
    private String roomId;
    
    @NotBlank(message = "Role is required")
    private String role; // "host" or "participant"
    
    private String recipientEmail;
    private String recipientName;
}
