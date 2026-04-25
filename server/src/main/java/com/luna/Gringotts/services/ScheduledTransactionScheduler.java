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

    // Run at 2 AM and 2 PM every day
    @Scheduled(cron = "0 0 2,14 * * *")
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
