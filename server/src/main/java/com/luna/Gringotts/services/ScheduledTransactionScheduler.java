package com.luna.Gringotts.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ScheduledTransactionScheduler {

    @Autowired
    ScheduledTransactionService scheduledTransactionService;

    @Autowired
    com.luna.Gringotts.repository.ScheduledTransactionRepository scheduledTransactionRepository;

    @Scheduled(fixedRate = 12 * 60 * 60 * 1000, initialDelay = 5 * 60 * 1000) // Run every 12 hours after an initial delay of 5 minutes
    public void runDueSchedules() {
        LocalDate today = LocalDate.now();
        List<com.luna.Gringotts.records.ScheduledTransaction> due = scheduledTransactionRepository
                .findByIsActiveTrueAndNextRunDateLessThanEqual(today);
        for (com.luna.Gringotts.records.ScheduledTransaction s : due) {
            try {
                scheduledTransactionService.executeSchedule(s.getId(), false);
            } catch (Exception e) {
                System.err.println("Failed to execute schedule " + s.getId() + ": " + e.getMessage());
            }
        }
    }
}
