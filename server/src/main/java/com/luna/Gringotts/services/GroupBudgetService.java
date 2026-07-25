package com.luna.Gringotts.services;

import com.luna.Gringotts.records.*;
import com.luna.Gringotts.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

@Service
public class GroupBudgetService {

    @Autowired
    private GroupBudgetRepository groupBudgetRepository;

    @Autowired
    private GroupBudgetCategoryAllocationRepository allocationRepository;

    @Autowired
    private GroupCategoryRepository groupCategoryRepository;

    @Autowired
    private TransactionGroupService transactionGroupService;

    @Autowired
    private TransactionRepository<Transaction> transactionRepository;

    @Autowired
    private IAMService iamService;

    public Optional<GroupBudget> getGroupBudget(Long groupId, Integer month, Integer year) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = transactionGroupService.getGroupForUser(groupId, user);

        if (month != null && year != null) {
            Optional<GroupBudget> monthly = groupBudgetRepository.findByGroupAndMonthAndYear(group, month, year);
            if (monthly.isPresent()) {
                return monthly;
            }
        }

        return groupBudgetRepository.findMasterByGroup(group)
                .or(() -> groupBudgetRepository.findByGroup(group).stream().findFirst());
    }

    public List<GroupBudget> getAllBudgetsForGroup(Long groupId) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = transactionGroupService.getGroupForUser(groupId, user);
        return groupBudgetRepository.findByGroupOrderByYearDescMonthDesc(group);
    }

    @Transactional
    public GroupBudget saveGroupBudget(Long groupId, GroupBudget incoming) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = transactionGroupService.getGroupForUser(groupId, user);

        if (incoming.getBudgetType() == null) {
            incoming.setBudgetType("OVERALL");
        }

        Optional<GroupBudget> existingOpt;
        if (incoming.getMonth() != null && incoming.getYear() != null) {
            existingOpt = groupBudgetRepository.findByGroupAndMonthAndYear(group, incoming.getMonth(), incoming.getYear());
        } else {
            existingOpt = groupBudgetRepository.findMasterByGroup(group)
                    .or(() -> groupBudgetRepository.findByGroup(group).stream().findFirst());
        }

        GroupBudget budgetToSave;
        if (existingOpt.isPresent()) {
            budgetToSave = existingOpt.get();
        } else {
            budgetToSave = new GroupBudget();
            budgetToSave.setGroup(group);
            budgetToSave.setUser(user);
        }

        budgetToSave.setName(incoming.getName() != null ? incoming.getName() : group.getName() + " Budget");
        budgetToSave.setBudgetType(incoming.getBudgetType());
        budgetToSave.setTotalAmount(incoming.getTotalAmount());
        budgetToSave.setMonth(incoming.getMonth());
        budgetToSave.setYear(incoming.getYear());
        budgetToSave.setNotes(incoming.getNotes());

        double totalAllocated = 0.0;
        Map<Long, GroupBudgetCategoryAllocation> existingAllocMap = new HashMap<>();
        for (GroupBudgetCategoryAllocation a : budgetToSave.getAllocations()) {
            if (a.getGroupCategory() != null && a.getGroupCategory().getId() != null) {
                existingAllocMap.put(a.getGroupCategory().getId(), a);
            }
        }

        List<GroupBudgetCategoryAllocation> updatedAllocations = new ArrayList<>();
        if (incoming.getAllocations() != null) {
            for (GroupBudgetCategoryAllocation incomingAlloc : incoming.getAllocations()) {
                if (incomingAlloc.getGroupCategory() == null || incomingAlloc.getGroupCategory().getId() == null) {
                    continue;
                }

                Long categoryId = incomingAlloc.getGroupCategory().getId();
                double allocatedAmount = incomingAlloc.getAllocatedAmount() != null ? incomingAlloc.getAllocatedAmount() : 0.0;

                GroupCategory groupCategory = groupCategoryRepository.findByIdAndGroup(categoryId, group)
                        .orElseThrow(() -> new IllegalArgumentException("Group category not found or does not belong to group: " + categoryId));

                GroupBudgetCategoryAllocation targetAlloc = existingAllocMap.get(categoryId);
                if (targetAlloc == null) {
                    targetAlloc = new GroupBudgetCategoryAllocation();
                    targetAlloc.setGroupBudget(budgetToSave);
                    targetAlloc.setGroupCategory(groupCategory);
                } else {
                    existingAllocMap.remove(categoryId);
                }

                targetAlloc.setAllocatedAmount(allocatedAmount);
                updatedAllocations.add(targetAlloc);
                totalAllocated += allocatedAmount;
            }
        }

        if (totalAllocated > budgetToSave.getTotalAmount()) {
            throw new IllegalArgumentException("Total allocations (₹" + totalAllocated + ") exceed group budget cap (₹" + budgetToSave.getTotalAmount() + ")");
        }

        budgetToSave.getAllocations().clear();
        budgetToSave.getAllocations().addAll(updatedAllocations);

        return groupBudgetRepository.save(budgetToSave);
    }

    @Transactional
    public void deleteGroupBudget(Long groupId, Long budgetId) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = transactionGroupService.getGroupForUser(groupId, user);

        GroupBudget budget = groupBudgetRepository.findById(budgetId)
                .orElseThrow(() -> new IllegalArgumentException("Group budget not found: " + budgetId));

        if (!budget.getGroup().getId().equals(group.getId())) {
            throw new IllegalArgumentException("Group budget does not belong to specified group");
        }

        groupBudgetRepository.delete(budget);
    }

    public Map<String, Object> getGroupBudgetUtilization(Long groupId, Integer month, Integer year) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = transactionGroupService.getGroupForUser(groupId, user);

        Optional<GroupBudget> budgetOpt = getGroupBudget(groupId, month, year);
        if (budgetOpt.isEmpty()) {
            Map<String, Object> noBudgetMap = new HashMap<>();
            noBudgetMap.put("has_budget", false);
            return noBudgetMap;
        }

        GroupBudget budget = budgetOpt.get();
        boolean isMonthly = "RECURRING_MONTHLY".equalsIgnoreCase(budget.getBudgetType());

        int targetMonth = month != null ? month : (budget.getMonth() != null ? budget.getMonth() : LocalDateTime.now().getMonthValue());
        int targetYear = year != null ? year : (budget.getYear() != null ? budget.getYear() : LocalDateTime.now().getYear());

        List<Transaction> transactions = transactionRepository.findByGroupWithAccess(group, user, group.isShared());

        LocalDateTime start = null;
        LocalDateTime end = null;
        if (isMonthly) {
            YearMonth ym = YearMonth.of(targetYear, targetMonth);
            start = ym.atDay(1).atStartOfDay();
            end = ym.atEndOfMonth().atTime(23, 59, 59);
        }

        double totalSpent = 0.0;
        double uncategorizedSpent = 0.0;
        Map<Long, Double> spentByGroupCategory = new HashMap<>();

        for (Transaction t : transactions) {
            if (t.getGroup() == null || !t.getGroup().getId().equals(group.getId())) {
                continue;
            }

            // Only expense transactions count towards budget spend
            if (t.getType() != null && !"EXPENSE".equalsIgnoreCase(t.getType())) {
                continue;
            }

            if (isMonthly) {
                if (t.getTransactionTime() == null || t.getTransactionTime().isBefore(start) || t.getTransactionTime().isAfter(end)) {
                    continue;
                }
            }

            double amount = t.getValue();
            totalSpent += amount;

            if (t.getGroupCategory() != null && t.getGroupCategory().getId() != null) {
                spentByGroupCategory.merge(t.getGroupCategory().getId(), amount, Double::sum);
            } else {
                uncategorizedSpent += amount;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("has_budget", true);
        result.put("budget", budget);
        result.put("budget_type", budget.getBudgetType());
        result.put("total_budget", budget.getTotalAmount());
        result.put("total_spent", totalSpent);
        result.put("remaining", Math.max(0.0, budget.getTotalAmount() - totalSpent));
        result.put("percentage_used", budget.getTotalAmount() > 0 ? Math.min(100.0, (totalSpent / budget.getTotalAmount()) * 100) : 0.0);
        result.put("uncategorized_spent", uncategorizedSpent);

        if (isMonthly) {
            result.put("target_month", targetMonth);
            result.put("target_year", targetYear);
        }

        List<Map<String, Object>> allocationUtilizationList = new ArrayList<>();
        for (GroupBudgetCategoryAllocation alloc : budget.getAllocations()) {
            Map<String, Object> allocMap = new HashMap<>();
            Long catId = alloc.getGroupCategory() != null ? alloc.getGroupCategory().getId() : null;
            double spent = catId != null ? spentByGroupCategory.getOrDefault(catId, 0.0) : 0.0;
            double allocated = alloc.getAllocatedAmount();

            allocMap.put("allocation_id", alloc.getId());
            allocMap.put("group_category", alloc.getGroupCategory());
            allocMap.put("allocated_amount", allocated);
            allocMap.put("spent_amount", spent);
            allocMap.put("remaining_amount", Math.max(0.0, allocated - spent));
            allocMap.put("percentage_used", allocated > 0 ? Math.min(100.0, (spent / allocated) * 100) : 0.0);

            allocationUtilizationList.add(allocMap);
        }
        result.put("allocations", allocationUtilizationList);

        return result;
    }
}
