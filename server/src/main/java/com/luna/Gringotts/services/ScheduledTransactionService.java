package com.luna.Gringotts.services;

import com.luna.Gringotts.records.*;
import com.luna.Gringotts.repository.ScheduledTransactionRepository;
import com.luna.Gringotts.repository.TransactionRepository;
import com.luna.Gringotts.repository.ExpenseRepository;
import com.luna.Gringotts.repository.IncomeRepository;
import com.luna.Gringotts.repository.SavingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class ScheduledTransactionService {

    @Autowired
    ScheduledTransactionRepository scheduledTransactionRepository;

    @Autowired
    IAMService iamService;

    @Autowired
    TransactionRepository<Transaction> transactionRepository;

    @Autowired
    ExpenseRepository expenseRepository;

    @Autowired
    IncomeRepository incomeRepository;

    @Autowired
    SavingRepository savingRepository;

    @Autowired
    InvestmentGoalService investmentGoalService;

    public ScheduledTransaction create(ScheduledTransaction s) {
        if (s.getStartDate() != null && s.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Schedule Start Date cannot be in the past");
        }
        s.setUser(iamService.getCurrentUser());
        if (s.getNextRunDate() == null) {
            s.setNextRunDate(s.getStartDate());
        }
        return scheduledTransactionRepository.save(s);
    }

    public ScheduledTransaction update(Long id, ScheduledTransaction incoming) {
        ScheduledTransaction existing = scheduledTransactionRepository.findById(id).orElseThrow();
        
        // If start date is changing, ensure it's not in the past
        if (incoming.getStartDate() != null && !incoming.getStartDate().equals(existing.getStartDate())) {
            if (incoming.getStartDate().isBefore(LocalDate.now())) {
                throw new IllegalArgumentException("Schedule Start Date cannot be in the past");
            }
            existing.setNextRunDate(incoming.getStartDate());
        }
        
        existing.setName(incoming.getName());
        existing.setTransactionType(incoming.getTransactionType());
        existing.setAmount(incoming.getAmount());
        existing.setDescription(incoming.getDescription());
        existing.setCategory(incoming.getCategory());
        existing.setSubCategory(incoming.getSubCategory());
        existing.setItem(incoming.getItem());
        existing.setPaymentMode(incoming.getPaymentMode());
        existing.setIsIn(incoming.getIsIn());
        existing.setFrequency(incoming.getFrequency());
        existing.setStartDate(incoming.getStartDate());
        existing.setEndDate(incoming.getEndDate());
        existing.setIsActive(incoming.getIsActive());
        
        return scheduledTransactionRepository.save(existing);
    }

    public void delete(Long id) {
        // Soft delete
        ScheduledTransaction s = scheduledTransactionRepository.findById(id).orElseThrow();
        s.setIsActive(false);
        scheduledTransactionRepository.save(s);
    }

    public ScheduledTransaction getById(Long id) {
        return scheduledTransactionRepository.findById(id).orElse(null);
    }

    public List<ScheduledTransaction> getAllForUser() {
        User user = iamService.getCurrentUser();
        return scheduledTransactionRepository.findByUser(user);
    }

    public Page<Transaction> getHistory(Long scheduleId, Pageable pageable) {
        User user = iamService.getCurrentUser();
        Specification<Transaction> spec = com.luna.Gringotts.repository.TransactionSpecification.userFilter(user)
                .and((root, query, builder) -> builder.equal(root.get("scheduleId"), scheduleId));
        return transactionRepository.findAll(spec, pageable);
    }

    @Transactional
    public Transaction executeSchedule(Long scheduleId, boolean isManual) {
        ScheduledTransaction s = scheduledTransactionRepository.findById(scheduleId).orElseThrow();
        if (!isManual && !Boolean.TRUE.equals(s.getIsActive())) return null;

        LocalDate runDate = isManual ? LocalDate.now() : (s.getNextRunDate() != null ? s.getNextRunDate() : s.getStartDate());
        LocalDateTime txTime = runDate.atStartOfDay();

        Transaction created = null;
        User owner = s.getUser();

        switch (s.getTransactionType()) {
            case "EXPENSE": {
                Expense e = new Expense();
                e.setValue(s.getAmount());
                e.setDescription(s.getDescription());
                e.setTransactionTime(txTime);
                e.setCategory(s.getCategory());
                e.setSubCategory(s.getSubCategory());
                e.setItem(s.getItem());
                e.setPaymentMode(s.getPaymentMode());
                e.setImported(false);
                e.setUser(owner);
                e.setCreatedBy("SCHEDULE");
                e.setScheduleId(s.getId());
                created = expenseRepository.save(e);
                break;
            }
            case "INCOME": {
                Income i = new Income();
                i.setValue(s.getAmount());
                i.setDescription(s.getDescription());
                i.setTransactionTime(txTime);
                i.setCategory(s.getCategory());
                i.setSubCategory(s.getSubCategory());
                i.setItem(s.getItem());
                i.setUser(owner);
                i.setCreatedBy("SCHEDULE");
                i.setScheduleId(s.getId());
                created = incomeRepository.save(i);
                break;
            }
            case "SAVING": {
                Saving sv = new Saving();
                sv.setValue(s.getAmount());
                sv.setDescription(s.getDescription());
                sv.setTransactionTime(txTime);
                sv.setCategory(s.getCategory());
                sv.setSubCategory(s.getSubCategory());
                sv.setItem(s.getItem());
                sv.setIsIn(s.getIsIn() != null ? s.getIsIn() : Boolean.TRUE);
                sv.setUser(owner);
                sv.setCreatedBy("SCHEDULE");
                sv.setScheduleId(s.getId());
                created = savingRepository.save(sv);
                // adjust goals similar to TransactionService.saveSaving
                double delta = Boolean.TRUE.equals(sv.getIsIn()) ? sv.getValue() : -sv.getValue();
                investmentGoalService.adjustGoalsForSaving(sv, delta);
                break;
            }
            default:
                throw new IllegalArgumentException("Unsupported transaction type: " + s.getTransactionType());
        }

        if (isManual) {
            return created;
        }

        // Update schedule run dates for automated runs
        s.setLastRunDate(runDate);
        LocalDate next = calculateNextRunDate(s);
        s.setNextRunDate(next);
        if (s.getFrequency().equals("ONE_TIME")) {
            s.setIsActive(false);
        }
        if (s.getEndDate() != null && next != null && next.isAfter(s.getEndDate())) {
            s.setIsActive(false);
        }
        scheduledTransactionRepository.save(s);

        return created;
    }

    public LocalDate calculateNextRunDate(ScheduledTransaction s) {
        LocalDate current = s.getNextRunDate() != null ? s.getNextRunDate() : s.getStartDate();
        if (current == null) return null;
        switch (s.getFrequency()) {
            case "ONE_TIME":
                return null;
            case "DAILY":
                return current.plusDays(1);
            case "MONTHLY":
                // preserve day-of-month when possible, fallback to last day
                int day = current.getDayOfMonth();
                LocalDate nextMonth = current.plusMonths(1);
                int lastDay = nextMonth.with(TemporalAdjusters.lastDayOfMonth()).getDayOfMonth();
                int useDay = Math.min(day, lastDay);
                return LocalDate.of(nextMonth.getYear(), nextMonth.getMonth(), useDay);
            case "YEARLY":
                return current.plusYears(1);
            default:
                return null;
        }
    }

}
