package com.codesync.dto.room;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoomReq {
    @NotBlank(message = "Room name is required")
    private String name;
    
    @NotBlank(message = "Language is required")
    private String language;
}
