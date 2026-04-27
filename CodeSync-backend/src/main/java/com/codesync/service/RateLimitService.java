package com.codesync.service;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import com.codesync.config.RateLimitConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final Map<String, Bucket> bucketCache;

    public ConsumptionProbe tryConsume(String bucketName, String key) {
        Bucket bucket = getOrCreateBucket(bucketName, key);
        return bucket.tryConsumeAndReturnRemaining(1);
    }

    public Bucket getOrCreateBucket(String bucketName, String key) {
        String cacheKey = bucketName + ":" + key;
        return bucketCache.computeIfAbsent(cacheKey, k -> switch (bucketName) {
            case "execute" -> RateLimitConfig.createExecuteBucket();
            case "invite" -> RateLimitConfig.createInviteBucket();
            case "invite-email" -> RateLimitConfig.createInviteEmailBucket();
            case "webrtc" -> RateLimitConfig.createWebRtcBucket();
            default -> throw new IllegalArgumentException("Unknown bucket: " + bucketName);
        });
    }
}
