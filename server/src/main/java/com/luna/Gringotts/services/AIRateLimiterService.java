package com.luna.Gringotts.services;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
public class AIRateLimiterService {

    private static final int MAX_REQUESTS_PER_MINUTE = 5;
    private static final int MAX_REQUESTS_PER_DAY = 100;

    private static class UserRequestTimestamps {
        final ConcurrentLinkedQueue<Long> minuteWindow = new ConcurrentLinkedQueue<>();
        final ConcurrentLinkedQueue<Long> dayWindow = new ConcurrentLinkedQueue<>();
    }

    private final Map<Long, UserRequestTimestamps> userRequests = new ConcurrentHashMap<>();

    public boolean isAllowed(Long userId) {
        if (userId == null) {
            return false;
        }

        long now = Instant.now().getEpochSecond();
        long minuteAgo = now - 60;
        long dayAgo = now - 86400;

        UserRequestTimestamps timestamps = userRequests.computeIfAbsent(userId, k -> new UserRequestTimestamps());

        // Remove timestamps older than 1 minute
        while (!timestamps.minuteWindow.isEmpty() && timestamps.minuteWindow.peek() < minuteAgo) {
            timestamps.minuteWindow.poll();
        }

        // Remove timestamps older than 1 day
        while (!timestamps.dayWindow.isEmpty() && timestamps.dayWindow.peek() < dayAgo) {
            timestamps.dayWindow.poll();
        }

        if (timestamps.minuteWindow.size() >= MAX_REQUESTS_PER_MINUTE) {
            return false;
        }

        if (timestamps.dayWindow.size() >= MAX_REQUESTS_PER_DAY) {
            return false;
        }

        timestamps.minuteWindow.add(now);
        timestamps.dayWindow.add(now);
        return true;
    }
}
