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
        Map<String, Double> subcategoryBreakdown = new HashMap<>();
        Map<String, Double> itemBreakdown = new HashMap<>();
        boolean hasSubcategoryData = false;
        boolean hasItemData = false;

        for (Transaction t : transactions) {
            double val = t.getValue();

            if (t.getCategory() != null) {
                String categoryName = t.getCategory().getName();
                categoryBreakdown.put(categoryName, categoryBreakdown.getOrDefault(categoryName, 0.0) + val);
            }

            if ("EXPENSE".equals(t.getType())) {
                totalExpenses += val;
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

            // Subcategory & Item breakdowns span all transaction types
            if (t.getSubCategory() != null) {
                hasSubcategoryData = true;
                String subCategoryName = t.getSubCategory().getName();
                subcategoryBreakdown.put(subCategoryName, subcategoryBreakdown.getOrDefault(subCategoryName, 0.0) + val);
            }

            if (t.getItem() != null) {
                hasItemData = true;
                String itemName = t.getItem().getName();
                itemBreakdown.put(itemName, itemBreakdown.getOrDefault(itemName, 0.0) + val);
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("total_expenses", totalExpenses);
        stats.put("total_incomes", totalIncomes);
        stats.put("total_savings", totalSavings);
        stats.put("category_breakdown", categoryBreakdown);
        stats.put("subcategory_breakdown", subcategoryBreakdown);
        stats.put("item_breakdown", itemBreakdown);
        stats.put("has_subcategory_data", hasSubcategoryData);
        stats.put("has_item_data", hasItemData);

        return stats;
    }
}
