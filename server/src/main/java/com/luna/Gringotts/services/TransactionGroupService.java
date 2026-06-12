package com.luna.Gringotts.services;

import com.luna.Gringotts.records.Saving;
import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.records.TransactionGroup;
import com.luna.Gringotts.records.User;
import com.luna.Gringotts.repository.TransactionGroupRepository;
import com.luna.Gringotts.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class TransactionGroupService {

    @Autowired
    private TransactionGroupRepository transactionGroupRepository;

    @Autowired
    private TransactionRepository<Transaction> transactionRepository;

    @Autowired
    private IAMService iamService;

    public List<TransactionGroup> getAllGroups() {
        User user = iamService.getCurrentUser();
        return transactionGroupRepository.findAllByUserOrderByCreatedAtDesc(user);
    }

    public Optional<TransactionGroup> getGroupById(Long id) {
        User user = iamService.getCurrentUser();
        return transactionGroupRepository.findByIdAndUser(id, user);
    }

    private void validateGroupAllowedTypes(TransactionGroup group) {
        if (!group.isAllowsExpense() && !group.isAllowsIncome() && 
            !group.isAllowsSaving() && !group.isAllowsRevolving()) {
            throw new IllegalArgumentException("A transaction group must allow at least one type of transaction.");
        }
    }

    public TransactionGroup createGroup(TransactionGroup group) {
        User user = iamService.getCurrentUser();
        group.setUser(user);
        if (group.getStatus() == null) {
            group.setStatus("ACTIVE");
        }
        if (group.getType() == null) {
            group.setType("CUSTOM");
        }
        validateGroupAllowedTypes(group);
        return transactionGroupRepository.save(group);
    }

    public TransactionGroup updateGroup(Long id, TransactionGroup incoming) {
        User user = iamService.getCurrentUser();
        TransactionGroup existing = transactionGroupRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Group not found or access denied"));

        existing.setName(incoming.getName());
        existing.setDescription(incoming.getDescription());
        if (incoming.getType() != null) {
            existing.setType(incoming.getType());
        }
        existing.setIcon(incoming.getIcon());
        existing.setColor(incoming.getColor());
        if (incoming.getStatus() != null) {
            existing.setStatus(incoming.getStatus());
        }
        existing.setAllowsExpense(incoming.isAllowsExpense());
        existing.setAllowsIncome(incoming.isAllowsIncome());
        existing.setAllowsSaving(incoming.isAllowsSaving());
        existing.setAllowsRevolving(incoming.isAllowsRevolving());
        existing.setThumbnail(incoming.getThumbnail());

        validateGroupAllowedTypes(existing);
        return transactionGroupRepository.save(existing);
    }

    @Transactional
    public void deleteGroup(Long id) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = transactionGroupRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Group not found or access denied"));

        // Nullify group reference on all transactions associated with this group
        transactionRepository.nullifyGroupByGroupIdAndUser(id, user);

        // Delete the group
        transactionGroupRepository.delete(group);
    }

    public List<Transaction> getGroupTransactions(Long groupId) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = transactionGroupRepository.findByIdAndUser(groupId, user)
                .orElseThrow(() -> new IllegalArgumentException("Group not found or access denied"));
        return transactionRepository.findByGroupAndUser(group, user);
    }

    public Map<String, Object> getGroupStatistics(Long groupId) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = transactionGroupRepository.findByIdAndUser(groupId, user)
                .orElseThrow(() -> new IllegalArgumentException("Group not found or access denied"));

        List<Transaction> transactions = transactionRepository.findByGroupAndUser(group, user);

        double totalExpenses = 0.0;
        double totalIncomes = 0.0;
        double totalSavings = 0.0;

        Map<String, Double> categoryBreakdown = new HashMap<>();

        for (Transaction t : transactions) {
            double val = t.getValue();
            String categoryName = t.getCategory() != null ? t.getCategory().getName() : "Uncategorized";

            if ("EXPENSE".equals(t.getType())) {
                totalExpenses += val;
                categoryBreakdown.put(categoryName, categoryBreakdown.getOrDefault(categoryName, 0.0) + val);
            } else if ("INCOME".equals(t.getType())) {
                totalIncomes += val;
            } else if ("SAVING".equals(t.getType())) {
                if (t instanceof Saving s) {
                    boolean isIn = Boolean.TRUE.equals(s.getIsIn());
                    totalSavings += isIn ? val : -val;
                } else {
                    totalSavings += val;
                }
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("total_expenses", totalExpenses);
        stats.put("total_incomes", totalIncomes);
        stats.put("total_savings", totalSavings);
        stats.put("category_breakdown", categoryBreakdown);

        return stats;
    }
}
