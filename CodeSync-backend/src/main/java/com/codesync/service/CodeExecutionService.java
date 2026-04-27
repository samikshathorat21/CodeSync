package com.codesync.service;

import java.io.IOException;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.codesync.dto.exec.ExecuteReq;
import com.codesync.dto.exec.ExecuteResponse;
import com.codesync.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeExecutionService {

    private final OkHttpClient okHttpClient;
    private final ObjectMapper objectMapper;

    @Value("${app.piston.url}")
    private String pistonUrl;

    /**
     * Language to Piston API mapping.
     * Maps user-friendly language names to Piston API language identifiers and versions.
     * 
     * Supported languages:
     * - javascript -> javascript (v18.15.0)
     * - typescript -> typescript (v5.0.3)
     * - python -> python (v3.10.0)
     * - java -> java (v15.0.2)
     * - cpp -> c++ (v10.2.0)  [Note: 'cpp' is mapped to 'c++' for Piston API]
     * - c -> c (v10.2.0)
     * 
     * The version is determined by the backend and is NOT sent by the client.
     * Clients should only send the language field (in lowercase).
     */
    private static final Map<String, PistonLang> LANG_MAP = Map.of(
            "javascript", new PistonLang("javascript", "18.15.0", "main.js"),
            "typescript", new PistonLang("typescript", "5.0.3", "main.ts"),
            "python",     new PistonLang("python", "3.10.0", "main.py"),
            "java",       new PistonLang("java", "15.0.2", "Main.java"),
            "cpp",        new PistonLang("c++", "10.2.0", "main.cpp"),
            "c",          new PistonLang("c", "10.2.0", "main.c")
    );

    private record PistonLang(String language, String version, String filename) {}

    public ExecuteResponse execute(ExecuteReq req) {
        String language = req.getLanguage().toLowerCase();
        String stdinValue = req.getStdin() != null ? req.getStdin() : "";
        
        log.info("=== Code Execution Started ===");
        log.info("Language: {} (raw: {})", language, req.getLanguage());
        log.info("Code length: {}", req.getCode().length());
        log.info("Stdin received - length: {}, isEmpty: {}, content: '{}'", 
                stdinValue.length(), stdinValue.isEmpty(), stdinValue);
        
        PistonLang lang = LANG_MAP.get(language);
        if (lang == null) {
            log.error("Unsupported language requested: '{}'. Supported languages: {}", language, LANG_MAP.keySet());
            throw new ApiException("Language '" + language + "' is not supported. Supported languages: python, java");
        }

        // Build Piston API request body matching the expected format
        // Format: { "language": "java", "version": "15.0.2", "files": [{"content": "<code>"}], "stdin": "input here" }
        Map<String, Object> bodyMap = Map.of(
                "language", lang.language(),
                "version", lang.version(),
                "files", new Object[]{Map.of("content", req.getCode())},
                "stdin", stdinValue
        );

        try {
            String jsonBody = objectMapper.writeValueAsString(bodyMap);
            log.info("Piston API URL: {}/api/v2/execute", pistonUrl);
            log.info("Piston request stdin field: '{}'", stdinValue);
            log.debug("Full Piston API request body: {}", jsonBody);
            
            RequestBody body = RequestBody.create(jsonBody, MediaType.get("application/json"));
            Request request = new Request.Builder()
                    .url(pistonUrl + "/api/v2/execute")
                    .post(body)
                    .build();

            try (Response response = okHttpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    String responseBody = response.body() != null ? response.body().string() : "(empty)";
                    log.error("Piston API returned error code: {}, body: {}", response.code(), responseBody);
                    throw new ApiException("Code execution service error: HTTP " + response.code());
                }

                String responseBody = response.body().string();
                log.debug("Piston API response: {}", responseBody);
                
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode run = root.path("run");
                JsonNode compile = root.path("compile");

                String stdout = run.path("stdout").asText();
                String stderr = run.path("stderr").asText();
                String compileStderr = compile.path("stderr").asText();
                
                int runCode = run.path("code").asInt();
                int compileCode = compile.path("code").isMissingNode() ? 0 : compile.path("code").asInt();

                String status = "Accepted";
                String output = stdout;
                String error = stderr;

                if (compileCode != 0) {
                    status = "Compilation Error";
                    error = compileStderr;
                    log.warn("Compilation error for language {}: {}", language, compileStderr);
                } else if (runCode == 124) {
                    status = "Time Limit Exceeded";
                    log.warn("Code execution timed out for language {}", language);
                } else if (runCode != 0) {
                    status = "Runtime Error";
                    log.warn("Runtime error (exit code {}) for language {}: {}", runCode, language, stderr);
                }

                return ExecuteResponse.builder()
                        .output(output)
                        .error(error)
                        .executionTime(run.path("time").asLong())
                        .memoryUsed(0)
                        .status(status)
                        .build();
            }
        } catch (IOException e) {
            log.error("Failed to execute code for language {}: {}", language, e.getMessage(), e);
            throw new ApiException("Code execution failed: " + e.getMessage());
        }
    }
}
