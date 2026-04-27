package com.codesync.dto.exec;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecuteReq {
    @NotBlank(message = "Code is required")
    private String code;
    
    @NotBlank(message = "Language is required")
    @Pattern(regexp = "^(python|java)$", 
             message = "Language must be one of: python, java (all lowercase)")
    private String language;
    
    private String stdin = "";
    private String roomId;
    
    // Note: Version is automatically determined by the backend based on language.
    // The server maintains a mapping of language -> version.
    // Example mapping: javascript -> 18.15.0, python -> 3.10.0, java -> 15.0.2, etc.
}
