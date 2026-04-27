package com.codesync.service;

import com.codesync.exception.ApiException;
import com.codesync.exception.ForbiddenException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final OkHttpClient okHttpClient;
    private final ObjectMapper objectMapper;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.resend-api-key}")
    private String resendApiKey;

    private static final List<String> ALLOWED_HOSTS = List.of(
            "localhost", "127.0.0.1", "lovable.dev", "lovableproject.com", "codesync.yourdomain.com"
    );

    public void sendInviteEmail(String toEmail, String toName, String inviteUrl, String roomName, String senderName) {
        validateInviteUrl(inviteUrl);

        String subject = senderName + " invited you to collaborate on CodeSync";
        String htmlBody = buildInviteHtml(toName, roomName, senderName, inviteUrl);

        Map<String, Object> bodyMap = Map.of(
                "from", fromEmail,
                "to", List.of(toEmail),
                "subject", subject,
                "html", htmlBody
        );

        try {
            String jsonBody = objectMapper.writeValueAsString(bodyMap);
            RequestBody body = RequestBody.create(jsonBody, MediaType.get("application/json"));
            Request request = new Request.Builder()
                    .url("https://api.resend.com/emails")
                    .addHeader("Authorization", "Bearer " + resendApiKey)
                    .post(body)
                    .build();

            try (Response response = okHttpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    String error = response.body() != null ? response.body().string() : "Unknown error";
                    log.error("Resend API error: {}", error);
                    throw new ApiException("Failed to send email");
                }
                log.info("Invite email sent successfully to {}", toEmail);
            }
        } catch (IOException e) {
            log.error("Failed to send invite email", e);
            throw new ApiException("Failed to send email: " + e.getMessage());
        }
    }

    private void validateInviteUrl(String inviteUrl) {
        try {
            java.net.URI uri = new java.net.URI(inviteUrl);
            String host = uri.getHost();
            if (host == null || ALLOWED_HOSTS.stream().noneMatch(host::endsWith)) {
                throw new ForbiddenException("Invite URL host not allowed: " + host);
            }
        } catch (Exception e) {
            throw new ApiException("Invalid invite URL: " + inviteUrl);
        }
    }

    private String buildInviteHtml(String toName, String roomName, String senderName, String inviteUrl) {
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { background-color: #1a1a2e; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background-color: #16213e; border-radius: 12px; padding: 40px; text-align: center; }
                h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; }
                p { color: #b0b0b0; font-size: 16px; line-height: 1.6; }
                .btn { display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 30px; }
                .footer { margin-top: 40px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>You're invited to collaborate!</h1>
                <p>Hi %s,</p>
                <p><strong>%s</strong> has invited you to join the room '<strong>%s</strong>' on CodeSync.</p>
                <a href="%s" class="btn">Join Room Now</a>
                <div class="footer">
                    This invite expires in 24 hours. If you didn't expect this email, you can ignore it.
                </div>
            </div>
        </body>
        </html>
        """.formatted(toName, senderName, roomName, inviteUrl);
    }
}
