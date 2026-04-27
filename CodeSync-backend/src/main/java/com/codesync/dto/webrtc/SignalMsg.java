package com.codesync.dto.webrtc;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignalMsg {
    private String type; // "offer" | "answer" | "ice-candidate" | "renegotiate"
    private String fromUserId;
    private String toUserId;
    private String roomId;
    private String sdp;
    private JsonNode candidate;
    private MediaConfig media;
}
