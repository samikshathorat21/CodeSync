package com.codesync.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class RateLimitConfig {

    @Bean
    public Map<String, Bucket> bucketCache() {
        return new ConcurrentHashMap<>();
    }

    public static Bucket createExecuteBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(10, Refill.greedy(10, Duration.ofMinutes(1))))
                .build();
    }

    public static Bucket createInviteBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(30, Refill.greedy(30, Duration.ofHours(1))))
                .build();
    }

    public static Bucket createInviteEmailBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(20, Refill.greedy(20, Duration.ofHours(1))))
                .build();
    }

    public static Bucket createWebRtcBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(50, Refill.greedy(50, Duration.ofSeconds(1))))
                .build();
    }
}
