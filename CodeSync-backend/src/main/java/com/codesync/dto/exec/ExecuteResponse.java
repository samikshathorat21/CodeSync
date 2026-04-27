package com.codesync.dto.exec;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecuteResponse {
    private String output;
    private String error;
    private long executionTime;
    private int memoryUsed;
    private String status;
}
