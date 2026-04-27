package com.codesync.dto.room;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionsDto {
    private String roomId;
    private Boolean canEdit;
    private Boolean canExecute;
    private Boolean canChat;
    private Boolean canVideo;
    private Boolean canAudio;
}
