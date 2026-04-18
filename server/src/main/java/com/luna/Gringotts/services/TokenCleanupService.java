package com.luna.Gringotts.services;

import com.luna.Gringotts.repository.TrustedBrowserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class TokenCleanupService {
    private static final Logger logger = LoggerFactory.getLogger(TokenCleanupService.class);
    private final TrustedBrowserRepository trustedBrowserRepository;

    public TokenCleanupService(TrustedBrowserRepository trustedBrowserRepository) {
        this.trustedBrowserRepository = trustedBrowserRepository;
    }

    /**
     * Cleans up expired trusted browser tokens once a day at 1 AM.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void cleanupExpiredTokens() {
        logger.info("Starting cleanup of expired trusted browser tokens...");
        try {
            trustedBrowserRepository.deleteByExpiresAtBefore(LocalDateTime.now());
            logger.info("Successfully cleaned up expired tokens.");
        } catch (Exception e) {
            logger.error("Failed to clean up expired tokens: {}", e.getMessage(), e);
        }
    }
}
