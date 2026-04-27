package com.codesync.dto.webrtc;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostEventMsg {
    private String type; // "kick"|"mute"|"mute-all"|"lang-change"|"permission-change"
    private String userId;
    private String language;
    private String permission;
    private Object value;
}
