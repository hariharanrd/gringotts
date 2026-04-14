package com.luna.Gringotts.services;

import com.luna.Gringotts.records.*;
import com.luna.Gringotts.repository.*;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;


@Service
public class BudgetService {

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private SavingRepository savingRepository;

    @Autowired
    private RevolvingRepository revolvingRepository;

    @Autowired
    private IAMService iamService;

    // ── Read ──────────────────────────────────────────────────────────────────

    public Budget getMasterBudget() {
        return budgetRepository.findByIsMasterTrueAndUser(iamService.getCurrentUser())
                .orElseThrow(() -> new IllegalStateException("No master budget found"));
    }

    public List<Budget> getMonthlyBudgets() {
        return budgetRepository.findAllByIsMasterFalseAndUserOrderByYearDescMonthDesc(iamService.getCurrentUser());
    }

    public List<Budget> getAllBudgets() {
        List<Budget> all = new ArrayList<>();
        budgetRepository.findByIsMasterTrueAndUser(iamService.getCurrentUser()).ifPresent(all::add);
        all.addAll(getMonthlyBudgets());
        return all;
    }

    public Budget getBudgetById(Long id) {
        return budgetRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Budget not found: " + id));
    }

    /** Returns the monthly budget for the current month/year.
     *  Falls back to the master budget if no monthly version exists. */
    public Budget getActiveBudget() {
        User user = iamService.getCurrentUser();
        LocalDateTime now = LocalDateTime.now();
        return budgetRepository.findByMonthAndYearAndUser(now.getMonthValue(), now.getYear(), user)
                .orElseGet(() -> budgetRepository.findByIsMasterTrueAndUser(user).orElse(null));
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public Budget createBudget(Budget budget) {
        User user = iamService.getCurrentUser();
        budget.setUser(user);

        if (Boolean.TRUE.equals(budget.getIsMaster())) {
            if (budgetRepository.findByIsMasterTrueAndUser(user).isPresent()) {
                throw new IllegalStateException("A master budget already exists");
            }
        } else {
            if (budget.getMonth() == null || budget.getYear() == null) {
                throw new IllegalArgumentException("Non-master budgets must specify month and year");
            }
        }

        double totalAllocated = 0.0;
        double savingsAllocated = 0.0;

        // Wire allocations back to budget before saving
        for (BudgetCategoryAllocation alloc : budget.getAllocations()) {
            alloc.setBudget(budget);
            if (alloc.getCategory() != null && alloc.getCategory().getId() != null) {
                Category cat = categoryRepository.findById(alloc.getCategory().getId())
                        .orElseThrow(() -> new IllegalArgumentException("Category not found: " + alloc.getCategory().getId()));
                alloc.setCategory(cat);
                
                totalAllocated += alloc.getAllocatedAmount();
                if ("SAVING".equals(cat.getType())) {
                    savingsAllocated += alloc.getAllocatedAmount();
                }
            }
        }
        
        if (totalAllocated > budget.getTotalAmount()) {
            throw new IllegalArgumentException("Total allocations (₹" + totalAllocated + ") exceed the monthly cap (₹" + budget.getTotalAmount() + ")");
        }
        
        budget.setEstimatedSavings(savingsAllocated);
        return budgetRepository.save(budget);
    }

    /** Clones the source budget's header + all allocations into a new monthly version. */
    @Transactional
    public Budget createMonthlyVersion(Long sourceBudgetId, int month, int year) {
        User user = iamService.getCurrentUser();
        if (budgetRepository.findByMonthAndYearAndUser(month, year, user).isPresent()) {
            throw new IllegalStateException("A budget for " + month + "/" + year + " already exists");
        }
        Budget source = getBudgetById(sourceBudgetId);

        Budget copy = new Budget();
        copy.setUser(user);
        copy.setName(source.getName() + " — " + month + "/" + year);
        copy.setMonth(month);
        copy.setYear(year);
        copy.setIsMaster(false);
        copy.setTotalAmount(source.getTotalAmount());
        copy.setEstimatedSavings(source.getEstimatedSavings());
        copy.setNotes(source.getNotes());

        for (BudgetCategoryAllocation srcAlloc : source.getAllocations()) {
            BudgetCategoryAllocation newAlloc = new BudgetCategoryAllocation();
            newAlloc.setBudget(copy);
            newAlloc.setCategory(srcAlloc.getCategory());
            newAlloc.setAllocatedAmount(srcAlloc.getAllocatedAmount());
            copy.getAllocations().add(newAlloc);
        }
        return budgetRepository.save(copy);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Transactional
    public Budget updateBudget(Long id, Budget incoming) {
        Budget existing = getBudgetById(id);

        existing.setName(incoming.getName());
        existing.setTotalAmount(incoming.getTotalAmount());
        existing.setEstimatedSavings(incoming.getEstimatedSavings());
        existing.setNotes(incoming.getNotes());

        if (!Boolean.TRUE.equals(existing.getIsMaster())) {
            existing.setMonth(incoming.getMonth());
            existing.setYear(incoming.getYear());
        }

        double totalAllocated = 0.0;
        double savingsAllocated = 0.0;
        
        Map<Long, BudgetCategoryAllocation> existingAllocMap = new HashMap<>();
        for (BudgetCategoryAllocation a : existing.getAllocations()) {
            if (a.getCategory() != null && a.getCategory().getId() != null) {
                existingAllocMap.put(a.getCategory().getId(), a);
            }
        }
        
        List<BudgetCategoryAllocation> updatedAllocations = new ArrayList<>();
        
        for (BudgetCategoryAllocation incomingAlloc : incoming.getAllocations()) {
            if (incomingAlloc.getCategory() == null || incomingAlloc.getCategory().getId() == null) continue;
            
            Long categoryId = incomingAlloc.getCategory().getId();
            double allocatedAmount = incomingAlloc.getAllocatedAmount();
            
            BudgetCategoryAllocation targetAlloc = existingAllocMap.get(categoryId);
            if (targetAlloc == null) {
                targetAlloc = new BudgetCategoryAllocation();
                targetAlloc.setBudget(existing);
                Category cat = categoryRepository.findById(categoryId)
                        .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId));
                targetAlloc.setCategory(cat);
            } else {
                existingAllocMap.remove(categoryId);
            }
            
            targetAlloc.setAllocatedAmount(allocatedAmount);
            updatedAllocations.add(targetAlloc);
            
            totalAllocated += allocatedAmount;
            if ("SAVING".equals(targetAlloc.getCategory().getType())) {
                savingsAllocated += allocatedAmount;
            }
        }
        
        existing.getAllocations().clear();
        existing.getAllocations().addAll(updatedAllocations);
        
        if (totalAllocated > existing.getTotalAmount()) {
            throw new IllegalArgumentException("Total allocations (₹" + totalAllocated + ") exceed the monthly cap (₹" + existing.getTotalAmount() + ")");
        }
        
        existing.setEstimatedSavings(savingsAllocated);
        return budgetRepository.save(existing);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteBudget(Long id) {
        Budget budget = getBudgetById(id);
        if (Boolean.TRUE.equals(budget.getIsMaster())) {
            throw new IllegalStateException("Cannot delete the master budget");
        }
        budgetRepository.deleteById(id);
    }

    // ── Utilization ───────────────────────────────────────────────────────────

    public Map<String, Object> getActiveBudgetUtilization() {
        Budget active = getActiveBudget();
        if (active == null) {
            return null;
        }
        return computeUtilization(active);
    }

    public Map<String, Object> getBudgetUtilization(Long budgetId) {
        Budget budget = getBudgetById(budgetId);
        return computeUtilization(budget);
    }

    private Map<String, Object> computeUtilization(Budget budget) {
        // Determine time window
        LocalDateTime start, end;
        int targetMonth, targetYear;

        if (Boolean.TRUE.equals(budget.getIsMaster()) || budget.getMonth() == null) {
            // For master, use the current month
            LocalDateTime now = LocalDateTime.now();
            targetMonth = now.getMonthValue();
            targetYear = now.getYear();
        } else {
            targetMonth = budget.getMonth();
            targetYear = budget.getYear();
        }

        YearMonth ym = YearMonth.of(targetYear, targetMonth);
        start = ym.atDay(1).atStartOfDay();
        end = ym.atEndOfMonth().atTime(23, 59, 59);

        // Fetch transactions for the period
        User user = iamService.getCurrentUser();
        List<Expense> expenses = expenseRepository.findByUserAndTransactionTimeBetween(user, start, end);
        List<Saving> savings = savingRepository.findByUserAndTransactionTimeBetween(user, start, end);
        List<Revolving> revolvings = revolvingRepository.findByUserAndTransactionTimeBetween(user, start, end);

        // Aggregate spent amounts by category (use category id as key)
        Map<Long, Double> spentByCategory = new HashMap<>();
        Double unCategorizedSpend = 0.0;
        for (Expense e : expenses) {
            if (e.getCategory() != null) {
                spentByCategory.merge(e.getCategory().getId(), e.getValue(), Double::sum);
            } else {
                unCategorizedSpend += e.getValue();
            }
        }
        for (Saving s : savings) {
            if (s.getCategory() != null) {
                spentByCategory.merge(s.getCategory().getId(), Math.abs(s.getValue()), Double::sum);
            } else{
                unCategorizedSpend += Math.abs(s.getValue());
            }
        }
        for (Revolving r : revolvings) {
            if (r.getCategory() != null) {
                spentByCategory.merge(r.getCategory().getId(), r.getValue(), Double::sum);
            } else {
                unCategorizedSpend += r.getValue();
            }
        }

        double totalAllocated = budget.getTotalAmount();
        double totalSpent = spentByCategory.values().stream().mapToDouble(Double::doubleValue).sum() + unCategorizedSpend;
        double totalRemaining = totalAllocated - totalSpent;
        double overallPercent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

        // Build per-category utilization
        List<Map<String, Object>> categoryUtils = new ArrayList<>();
        Set<Long> allocatedCategoryIds = new HashSet<>();
        
        for (BudgetCategoryAllocation alloc : budget.getAllocations()) {
            Long catId = alloc.getCategory().getId();
            allocatedCategoryIds.add(catId);
            
            double allocated = alloc.getAllocatedAmount();
            double spent = spentByCategory.getOrDefault(catId, 0.0);
            double remaining = allocated - spent;
            double percent = allocated > 0 ? (spent / allocated) * 100 : (spent > 0 ? 100 : 0);

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("category", alloc.getCategory());
            entry.put("allocated", allocated);
            entry.put("spent", spent);
            entry.put("remaining", remaining);
            entry.put("percent_used", Math.round(percent * 10.0) / 10.0);
            categoryUtils.add(entry);
        }
        
        // Add categories with spending but no allocation
        for (Map.Entry<Long, Double> entry : spentByCategory.entrySet()) {
            Long catId = entry.getKey();
            if (!allocatedCategoryIds.contains(catId) && entry.getValue() > 0) {
                Category cat = categoryRepository.findById(catId).orElse(null);
                if (cat != null && !cat.getType().equals("INCOME")) {
                    double spent = entry.getValue();
                    Map<String, Object> unallocatedEntry = new LinkedHashMap<>();
                    unallocatedEntry.put("category", cat);
                    unallocatedEntry.put("allocated", 0.0);
                    unallocatedEntry.put("spent", spent);
                    unallocatedEntry.put("remaining", -spent);
                    unallocatedEntry.put("percent_used", 100.0); // Flag as 100% used so client logic highlights it
                    categoryUtils.add(unallocatedEntry);
                }
            }
        }

        //UNCATEGORIZED SPENDING
        if(unCategorizedSpend > 0) {
            Map<String, Object> unallocatedEntry = getUnCategorizedEntryDetails(unCategorizedSpend);
            categoryUtils.add(unallocatedEntry);
        }

        // Sort by percent_used descending
        categoryUtils.sort(Comparator.comparingDouble(
                e -> -((Number) e.get("percent_used")).doubleValue()));

        Map<String, Object> overall = new LinkedHashMap<>();
        overall.put("allocated", totalAllocated);
        overall.put("spent", totalSpent);
        overall.put("remaining", totalRemaining);
        overall.put("percent_used", Math.round(overallPercent * 10.0) / 10.0);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("budget", budget);
        result.put("overall", overall);
        result.put("categories", categoryUtils);
        result.put("period_month", targetMonth);
        result.put("period_year", targetYear);
        return result;
    }

    private static @NonNull Map<String, Object> getUnCategorizedEntryDetails(Double unCategorizedSpend) {
        Map<String, Object> unallocatedEntry = new LinkedHashMap<>();
        Category category = new Category();
        category.setName("Uncategorized");
        category.setType("EXPENSE");
        unallocatedEntry.put("category", category);
        unallocatedEntry.put("allocated", 0.0);
        unallocatedEntry.put("spent", unCategorizedSpend);
        unallocatedEntry.put("remaining", -unCategorizedSpend);
        unallocatedEntry.put("percent_used", 100.0); // Flag as 100% used so client logic highlights it
        return unallocatedEntry;
    }
}