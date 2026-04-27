package com.codesync.dto.invite;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendEmailInviteReq {
    @NotBlank(message = "Token is required")
    private String token;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String recipientEmail;
    
    @NotBlank(message = "Recipient name is required")
    private String recipientName;
}
