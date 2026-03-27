package com.luna.Gringotts.services;

import com.luna.Gringotts.records.*;
import com.luna.Gringotts.repository.ExpenseRepository;
import com.luna.Gringotts.repository.IncomeRepository;
import com.luna.Gringotts.repository.SavingRepository;
import com.luna.Gringotts.repository.RevolvingRepository;
import com.luna.Gringotts.repository.CategoryRepository;
import com.luna.Gringotts.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.data.jpa.domain.Specification;
import com.luna.Gringotts.repository.TransactionSpecification;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    @Autowired
    ExpenseRepository expenseRepository;

    @Autowired
    IncomeRepository incomeRepository;

    @Autowired
    SavingRepository savingRepository;

    @Autowired
    RevolvingRepository revolvingRepository;

    @Autowired
    TransactionRepository<Transaction> transactionRepository;

    @Autowired
    CategoryRepository categoryRepository;

    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id).orElse(null);
    }

    public Expense getExpenseById(Long id){
        return expenseRepository.findById(id).orElse(null);
    }

    public Income getIncomeById(Long id){
        return incomeRepository.findById(id).orElse(null);
    }

    public Saving getSavingById(Long id){
        return savingRepository.findById(id).orElse(null);
    }

    public Revolving getRevolvingById(Long id){
        return revolvingRepository.findById(id).orElse(null);
    }

    public void saveExpense(Expense e){
        expenseRepository.save(e);
    }

    public void saveIncome(Income i){
        incomeRepository.save(i);
    }

    public void saveSaving(Saving s){
        savingRepository.save(s);
    }

    public void saveRevolving(Revolving r){
        revolvingRepository.save(r);
    }

    public void saveTransactions(List<Transaction> transactions) {
        transactionRepository.saveAll(transactions);
    }

    public Page<Expense> getExpenses(List<SearchCriteria> filters, Pageable pageable){
        if (filters == null || filters.isEmpty()) {
            return expenseRepository.findAll(pageable);
        }
        Specification<Expense> spec = TransactionSpecification.getSpecification(filters);
        return expenseRepository.findAll(spec, pageable);
    }

    public Page<Income> getIncomes(List<SearchCriteria> filters, Pageable pageable){
        if (filters == null || filters.isEmpty()) {
            return incomeRepository.findAll(pageable);
        }
        Specification<Income> spec = TransactionSpecification.getSpecification(filters);
        return incomeRepository.findAll(spec, pageable);
    }

    public Page<Saving> getSavings(List<SearchCriteria> filters, Pageable pageable){
        if (filters == null || filters.isEmpty()) {
            return savingRepository.findAll(pageable);
        }
        Specification<Saving> spec = TransactionSpecification.getSpecification(filters);
        return savingRepository.findAll(spec, pageable);
    }

    public Page<Revolving> getRevolvings(List<SearchCriteria> filters, Pageable pageable){
        if (filters == null || filters.isEmpty()) {
            return revolvingRepository.findAll(pageable);
        }
        Specification<Revolving> spec = TransactionSpecification.getSpecification(filters);
        return revolvingRepository.findAll(spec, pageable);
    }

    public void deleteTransaction(Long id){
        transactionRepository.deleteById(id);
    }

    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }

    public void deleteIncome(Long id) {
        incomeRepository.deleteById(id);
    }

    public void deleteSaving(Long id) {
        savingRepository.deleteById(id);
    }

    public void deleteRevolving(Long id) {
        revolvingRepository.deleteById(id);
    }

    public void updateExpense(Expense e){
        expenseRepository.save(e);
    }

    public void updateIncome(Income i){
        incomeRepository.save(i);
    }


    public void updateSaving(Saving s){
        savingRepository.save(s);
    }

    public void updateRevolving(Revolving r){
        revolvingRepository.save(r);
    }

    public List<Expense> getExpense(Example<Expense> example){
        return expenseRepository.findAll(example);
    }

    public List<Income> getIncome(Example<Income> example){
        return incomeRepository.findAll(example);
    }

    public List<Saving> getSaving(Example<Saving> example){
        return savingRepository.findAll(example);
    }

    public List<Revolving> getRevolving(Example<Revolving> example){
        return revolvingRepository.findAll(example);
    }

    public Map<String, Object> getSummary(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);

        List<Expense> expenses = expenseRepository.findByTransactionTimeAfter(since);
        List<Income> incomes = incomeRepository.findByTransactionTimeAfter(since);
        List<Saving> savings = savingRepository.findByTransactionTimeAfter(since);

        double totalExpenses = expenses.stream().mapToDouble(Transaction::getValue).sum();
        double totalIncomes = incomes.stream().mapToDouble(Transaction::getValue).sum();
        double totalSavings = savings.stream()
                .mapToDouble(s -> (s.getIsIn() != null && s.getIsIn()) ? s.getValue() : -s.getValue())
                .sum();

        // Category breakdown for expenses
        Map<String, Double> categoryBreakdown = expenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory() != null ? e.getCategory().getName() : "Uncategorized",
                        Collectors.summingDouble(Transaction::getValue)
                ));

        // Recent transactions (all types, sorted by date desc, limit 10)
        List<Transaction> allTransactions = new ArrayList<>();
        allTransactions.addAll(expenses);
        allTransactions.addAll(incomes);
        allTransactions.addAll(savings);
        
        List<Revolving> revolvings = revolvingRepository.findByTransactionTimeAfter(since);
        allTransactions.addAll(revolvings);

        allTransactions.sort(Comparator.comparing(Transaction::getTransactionTime).reversed());
        List<Transaction> recentTransactions = allTransactions.stream().limit(10).collect(Collectors.toList());

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("days", days);
        summary.put("total_expenses", totalExpenses);
        summary.put("total_incomes", totalIncomes);
        summary.put("total_savings", totalSavings);
        summary.put("net_balance", totalIncomes - totalExpenses);
        summary.put("expense_count", expenses.size());
        summary.put("income_count", incomes.size());
        summary.put("saving_count", savings.size());
        summary.put("category_breakdown", categoryBreakdown);
        summary.put("recent_transactions", recentTransactions);

        return summary;
    }

    public void bulkUpdateCategory(List<Long> transactionIds, Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId));
        List<Transaction> transactions = transactionRepository.findAllById(transactionIds);
        transactions.forEach(t -> t.setCategory(category));
        transactionRepository.saveAll(transactions);
    }

}
