package com.codesync.dto.webrtc;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaStateMsg {
    private String roomId;
    private String userId;
    private boolean audioEnabled;
    private boolean videoEnabled;
    private boolean speaking;
}
