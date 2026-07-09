package com.luna.Gringotts.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

@Service
public class ScheduledTransactionScheduler {

    @Autowired
    ScheduledTransactionService scheduledTransactionService;

    @Autowired
    com.luna.Gringotts.repository.ScheduledTransactionRepository scheduledTransactionRepository;

    private static final Logger LOGGER = Logger.getLogger(ScheduledTransactionScheduler.class.getName());

    @Scheduled(fixedRate = 1 * 60 * 60 * 1000, initialDelay = 5 * 60 * 1000) // Run every 1 hour after an initial delay
                                                                             // of 5 minutes
    public void runDueSchedules() {
        LocalDate today = LocalDate.now();
        List<com.luna.Gringotts.records.ScheduledTransaction> due = scheduledTransactionRepository
                .findByIsActiveTrueAndNextRunDateLessThanEqual(today);
        for (com.luna.Gringotts.records.ScheduledTransaction s : due) {
            try {
                scheduledTransactionService.executeSchedule(s.getId(), false);
            } catch (Exception e) {
                LOGGER.log(Level.SEVERE, "Failed to execute schedule: " + s.getId(), e);
            }
        }
    }
}
