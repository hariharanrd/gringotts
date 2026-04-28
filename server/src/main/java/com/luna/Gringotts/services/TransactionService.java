package com.luna.Gringotts.services;

import com.luna.Gringotts.records.*;
import com.luna.Gringotts.repository.ExpenseRepository;
import com.luna.Gringotts.repository.IncomeRepository;
import com.luna.Gringotts.repository.SavingRepository;
import com.luna.Gringotts.repository.RevolvingRepository;
import com.luna.Gringotts.repository.CategoryRepository;
import com.luna.Gringotts.repository.CreditCardRepository;
import com.luna.Gringotts.repository.SubCategoryRepository;
import com.luna.Gringotts.repository.ItemRepository;
import com.luna.Gringotts.repository.TransactionRepository;
import com.luna.Gringotts.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;
import com.luna.Gringotts.repository.TransactionSpecification;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    @PersistenceContext
    private EntityManager entityManager;

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

    @Autowired
    SubCategoryRepository subCategoryRepository;

    @Autowired
    ItemRepository itemRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    CreditCardRepository creditCardRepository;

    @Autowired
    IAMService iamService;

    @Autowired
    InvestmentGoalService investmentGoalService;

    @Autowired
    CreditCardService creditCardService;

    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id).orElse(null);
    }

    public Expense getExpenseById(Long id) {
        return expenseRepository.findById(id).orElse(null);
    }

    public Income getIncomeById(Long id) {
        return incomeRepository.findById(id).orElse(null);
    }

    public Saving getSavingById(Long id) {
        return savingRepository.findById(id).orElse(null);
    }

    public Revolving getRevolvingById(Long id) {
        return revolvingRepository.findById(id).orElse(null);
    }

    public void saveExpense(Expense e) {
        if (e.getPaymentMode() == null) {
            e.setPaymentMode(Expense.ExpenseMode.OTHERS.name());
        }
        try {
            Expense.ExpenseMode.valueOf(e.getPaymentMode());
        } catch (IllegalArgumentException ex) {
            e.setPaymentMode(Expense.ExpenseMode.OTHERS.name());
        }
        e.setUser(iamService.getCurrentUser());
        expenseRepository.save(e);
        
        if ("CREDIT_CARD".equals(e.getPaymentMode()) && e.getCreditCard() != null) {
            creditCardService.addExpenseToBill(e);
        }
    }

    public void saveIncome(Income i) {
        i.setUser(iamService.getCurrentUser());
        incomeRepository.save(i);
    }

    public void saveSaving(Saving s) {
        s.setUser(iamService.getCurrentUser());
        savingRepository.save(s);
        // Auto-credit linked investment goals.
        double delta = Boolean.TRUE.equals(s.getIsIn()) ? s.getValue() : -s.getValue();
        investmentGoalService.adjustGoalsForSaving(s, delta);
    }

    public void saveRevolving(Revolving r) {
        r.setUser(iamService.getCurrentUser());
        revolvingRepository.save(r);
    }

    public void saveTransactions(List<Transaction> transactions) {
        User user = iamService.getCurrentUser();
        transactions.forEach(t -> t.setUser(user));
        transactionRepository.saveAll(transactions);
    }

    public Page<Transaction> getTransactions(List<SearchCriteria> filters, Pageable pageable) {
        User user = iamService.getCurrentUser();
        Specification<Transaction> spec = TransactionSpecification.forUser(user, filters);
        return transactionRepository.findAll(spec, pageable);
    }

    public Page<Expense> getExpenses(List<SearchCriteria> filters, Pageable pageable) {
        User user = iamService.getCurrentUser();
        Specification<Expense> spec = TransactionSpecification.forUser(user, filters);
        return expenseRepository.findAll(spec, pageable);
    }

    public Page<Income> getIncomes(List<SearchCriteria> filters, Pageable pageable) {
        User user = iamService.getCurrentUser();
        Specification<Income> spec = TransactionSpecification.forUser(user, filters);
        return incomeRepository.findAll(spec, pageable);
    }

    public Page<Saving> getSavings(List<SearchCriteria> filters, Pageable pageable) {
        User user = iamService.getCurrentUser();
        Specification<Saving> spec = TransactionSpecification.forUser(user, filters);
        return savingRepository.findAll(spec, pageable);
    }

    public Page<Revolving> getRevolvings(List<SearchCriteria> filters, Pageable pageable) {
        User user = iamService.getCurrentUser();
        Specification<Revolving> spec = TransactionSpecification.forUser(user, filters);
        return revolvingRepository.findAll(spec, pageable);
    }

    public void deleteTransaction(Long id) {
        Transaction t = transactionRepository.findById(id).get();
        if (t instanceof Expense) {
            deleteExpense(id);
        } else if (t instanceof Income) {
            deleteIncome(id);
        } else if (t instanceof Saving) {
            deleteSaving(id);
        } else if (t instanceof Revolving) {
            deleteRevolving(id);
        }
    }

    @Transactional
    public void bulkDelete(List<Long> transactionIds) {
        User user = iamService.getCurrentUser();
        List<Transaction> transactions = transactionRepository.findAllById(transactionIds);
        for (Transaction t : transactions) {
            if (t.getUser() != null && t.getUser().getId().equals(user.getId())) {
                deleteTransaction(t.getId());
            }
        }
    }

    public void deleteExpense(Long id) {
        expenseRepository.findById(id).ifPresent(existing -> {
            if ("CREDIT_CARD".equals(existing.getPaymentMode()) && existing.getCreditCard() != null) {
                creditCardService.removeExpenseFromBill(existing);
            }
        });
        expenseRepository.deleteById(id);
    }

    public void deleteIncome(Long id) {
        incomeRepository.deleteById(id);
    }

    public void deleteSaving(Long id) {
        // Reverse the goal credit before deleting
        Saving existing = savingRepository.findById(id).orElse(null);
        if (existing != null) {
            double reversal = Boolean.TRUE.equals(existing.getIsIn()) ? -existing.getValue() : existing.getValue();
            investmentGoalService.adjustGoalsForSaving(existing, reversal);
        }
        savingRepository.deleteById(id);
    }

    public void deleteRevolving(Long id) {
        revolvingRepository.deleteById(id);
    }

    public void updateExpense(Expense e) {
        expenseRepository.save(e);
    }

    public void updateIncome(Income i) {
        incomeRepository.save(i);
    }

    public void updateSaving(Saving s) {
        savingRepository.save(s);
    }

    public void updateRevolving(Revolving r) {
        revolvingRepository.save(r);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Copy common base-table fields from source onto target. */
    private void applyBaseFields(Transaction target, Transaction source) {
        target.setValue(source.getValue());
        target.setDescription(source.getDescription());
        target.setNotes(source.getNotes());
        target.setTransactionTime(source.getTransactionTime());
        target.setCategory(source.getCategory());
        target.setSubCategory(source.getSubCategory());
        target.setItem(source.getItem());
        target.setPaymentMode(source.getPaymentMode());
        target.setCreditCard(source.getCreditCard());
    }

    private void deleteFromOldTable(Long id, Transaction t) {
        if (t instanceof Expense) expenseRepository.deleteExpenseRecord(id);
        else if (t instanceof Income) incomeRepository.deleteIncomeRecord(id);
        else if (t instanceof Saving) savingRepository.deleteSavingRecord(id);
        else if (t instanceof Revolving) revolvingRepository.deleteRevolvingRecord(id);
    }

    // ── Cross-type-safe update methods ───────────────────────────────────────

    @Transactional
    public Expense updateToExpense(Long id, Expense incoming) {
        Transaction existing = transactionRepository.findById(id).orElseThrow();
        if (existing instanceof Expense current) {
            if ("CREDIT_CARD".equals(current.getPaymentMode()) && current.getCreditCard() != null) {
                creditCardService.removeExpenseFromBill(current);
            }
            applyBaseFields(current, incoming);
            current.setPaymentMode(incoming.getPaymentMode());
            current.setCreditCard(incoming.getCreditCard());
            Expense saved = expenseRepository.save(current);
            if ("CREDIT_CARD".equals(saved.getPaymentMode()) && saved.getCreditCard() != null) {
                creditCardService.addExpenseToBill(saved);
            }
            return saved;
        }

        // Cross-type swap
        deleteFromOldTable(id, existing);
        expenseRepository.insertExpense(id);
        entityManager.flush();
        entityManager.clear();

        Expense saved = expenseRepository.findById(id).orElseThrow();
        applyBaseFields(saved, incoming);
        saved = expenseRepository.save(saved);

        if ("CREDIT_CARD".equals(saved.getPaymentMode()) && saved.getCreditCard() != null) {
            creditCardService.addExpenseToBill(saved);
        }
        return saved;
    }

    @Transactional
    public Income updateToIncome(Long id, Income incoming) {
        Transaction existing = transactionRepository.findById(id).orElseThrow();
        if (existing instanceof Income current) {
            applyBaseFields(current, incoming);
            current.setSource(incoming.getSource());
            return incomeRepository.save(current);
        }

        deleteFromOldTable(id, existing);
        incomeRepository.insertIncome(id, incoming.getSource());
        entityManager.flush();
        entityManager.clear();

        Income saved = incomeRepository.findById(id).orElseThrow();
        applyBaseFields(saved, incoming);
        return incomeRepository.save(saved);
    }

    @Transactional
    public Saving updateToSaving(Long id, Saving incoming) {
        Transaction existing = transactionRepository.findById(id).orElseThrow();
        if (existing instanceof Saving current) {
            // Reverse old contribution then apply new one
            double oldDelta = Boolean.TRUE.equals(current.getIsIn()) ? current.getValue() : -current.getValue();
            investmentGoalService.adjustGoalsForSaving(current, -oldDelta);

            applyBaseFields(current, incoming);
            current.setIsIn(incoming.getIsIn());
            Saving saved = savingRepository.save(current);

            double newDelta = Boolean.TRUE.equals(saved.getIsIn()) ? saved.getValue() : -saved.getValue();
            investmentGoalService.adjustGoalsForSaving(saved, newDelta);
            return saved;
        }

        deleteFromOldTable(id, existing);
        savingRepository.insertSaving(id, Boolean.TRUE.equals(incoming.getIsIn()));
        entityManager.flush();
        entityManager.clear();

        Saving saved = savingRepository.findById(id).orElseThrow();
        applyBaseFields(saved, incoming);
        saved = savingRepository.save(saved);

        double newDelta = Boolean.TRUE.equals(saved.getIsIn()) ? saved.getValue() : -saved.getValue();
        investmentGoalService.adjustGoalsForSaving(saved, newDelta);
        return saved;
    }

    @Transactional
    public Revolving updateToRevolving(Long id, Revolving incoming) {
        Transaction existing = transactionRepository.findById(id).orElseThrow();
        if (existing instanceof Revolving current) {
            applyBaseFields(current, incoming);
            current.setIsGive(incoming.getIsGive());
            current.setClosed(incoming.getClosed());
            return revolvingRepository.save(current);
        }

        deleteFromOldTable(id, existing);
        revolvingRepository.insertRevolving(id, Boolean.TRUE.equals(incoming.getIsGive()), Boolean.TRUE.equals(incoming.getClosed()));
        entityManager.flush();
        entityManager.clear();

        Revolving saved = revolvingRepository.findById(id).orElseThrow();
        applyBaseFields(saved, incoming);
        return revolvingRepository.save(saved);
    }

    public List<Expense> getExpense(Example<Expense> example) {
        return expenseRepository.findAll(example);
    }

    public List<Income> getIncome(Example<Income> example) {
        return incomeRepository.findAll(example);
    }

    public List<Saving> getSaving(Example<Saving> example) {
        return savingRepository.findAll(example);
    }

    public List<Revolving> getRevolving(Example<Revolving> example) {
        return revolvingRepository.findAll(example);
    }

    public Map<String, Object> getSummary(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        User user = iamService.getCurrentUser();

        List<Expense> expenses = expenseRepository.findByUserAndTransactionTimeAfter(user, since);
        List<Income> incomes = incomeRepository.findByUserAndTransactionTimeAfter(user, since);
        List<Saving> savings = savingRepository.findByUserAndTransactionTimeAfter(user, since);

        double totalExpenses = expenses.stream().mapToDouble(Transaction::getValue).sum();
        double totalIncomes = incomes.stream().mapToDouble(Transaction::getValue).sum();
        double totalSavings = savings.stream()
                .mapToDouble(s -> (s.getIsIn() != null && s.getIsIn()) ? s.getValue() : -s.getValue())
                .sum();

        // Category breakdown for expenses
        Map<String, Double> categoryBreakdown = expenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory() != null ? e.getCategory().getName() : "Uncategorized",
                        Collectors.summingDouble(Transaction::getValue)));

        // Category breakdown for savings
        Map<String, Double> savingsBreakdown = savings.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getCategory() != null ? s.getCategory().getName() : "Uncategorized",
                        Collectors.summingDouble(
                                s -> (s.getIsIn() != null && s.getIsIn()) ? s.getValue() : -s.getValue())));

        // Recent transactions (all types, sorted by date desc, limit 10)
        List<Transaction> allTransactions = new ArrayList<>();
        allTransactions.addAll(expenses);
        allTransactions.addAll(incomes);
        allTransactions.addAll(savings);

        List<Revolving> revolvings = revolvingRepository.findByUserAndTransactionTimeAfter(user, since);
        allTransactions.addAll(revolvings);

        // Open Revolvings Summary (All-time balance)
        List<Revolving> openRevolvings = revolvingRepository.findByUserAndClosedFalse(user);
        double totalIOwe = openRevolvings.stream()
                .filter(r -> Boolean.FALSE.equals(r.getIsGive()))
                .mapToDouble(Transaction::getValue)
                .sum();
        double totalOthersOweMe = openRevolvings.stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsGive()))
                .mapToDouble(Transaction::getValue)
                .sum();

        allTransactions.sort(Comparator.comparing(Transaction::getTransactionTime).reversed());
        List<Transaction> recentTransactions = allTransactions.stream().limit(10).collect(Collectors.toList());

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("days", days);
        summary.put("total_expenses", totalExpenses);
        summary.put("total_incomes", totalIncomes);
        summary.put("total_savings", totalSavings);
        summary.put("total_i_owe", totalIOwe);
        summary.put("total_others_owe_me", totalOthersOweMe);
        summary.put("net_balance", totalIncomes - totalExpenses);
        summary.put("expense_count", expenses.size());
        summary.put("income_count", incomes.size());
        summary.put("saving_count", savings.size());
        summary.put("category_breakdown", categoryBreakdown);
        summary.put("savings_breakdown", savingsBreakdown);
        summary.put("recent_transactions", recentTransactions);

        return summary;
    }

    @Transactional
    public void bulkUpdateFields(List<Long> transactionIds, Map<String, Object> fields) {
        User user = iamService.getCurrentUser();
        List<Transaction> transactions = transactionRepository.findAllById(transactionIds);
        // Only operate on transactions belonging to the current user
        transactions = transactions.stream()
                .filter(t -> t.getUser() != null && t.getUser().getId().equals(user.getId()))
                .collect(Collectors.toList());

        // Pre-fetch relational entities if referenced
        Category category = null;
        SubCategory subCategory = null;
        Item item = null;
        CreditCard creditCard = null;

        if (fields.containsKey("category_id")) {
            Long id = toLong(fields.get("category_id"));
            category = categoryRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        }
        if (fields.containsKey("subcategory_id")) {
            Long id = toLong(fields.get("subcategory_id"));
            subCategory = subCategoryRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("SubCategory not found: " + id));
            category = subCategory.getCategory();
        }
        if (fields.containsKey("item_id")) {
            Long id = toLong(fields.get("item_id"));
            item = itemRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Item not found: " + id));
            subCategory = item.getSubCategory();
            category = subCategory.getCategory();
        }
        if (fields.containsKey("credit_card_id") || fields.containsKey("credit_card")) {
            Object ccVal = fields.get("credit_card");
            if (ccVal == null) ccVal = fields.get("credit_card_id");

            Long id;
            if (ccVal instanceof Map<?, ?> ccMap) {
                id = toLong(ccMap.get("id"));
            } else {
                id = toLong(ccVal);
            }

            creditCard = creditCardRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Credit Card not found: " + id));
        }

        final Category finalCategory = category;
        final SubCategory finalSubCategory = subCategory;
        final Item finalItem = item;
        final CreditCard finalCreditCard = creditCard;

        for (Transaction t : transactions) {
            if (finalCategory != null)
                t.setCategory(finalCategory);
            if (finalSubCategory != null)
                t.setSubCategory(finalSubCategory);
            if (finalItem != null)
                t.setItem(finalItem);
            if (fields.containsKey("notes"))
                t.setNotes((String) fields.get("notes"));

            // Type-specific fields
            if (t instanceof Expense e) {
                if ("CREDIT_CARD".equals(e.getPaymentMode()) && e.getCreditCard() != null) {
                    creditCardService.removeExpenseFromBill(e);
                }

                if (fields.containsKey("payment_mode")) {
                    e.setPaymentMode((String) fields.get("payment_mode"));
                }
                
                if (fields.containsKey("credit_card_id") || fields.containsKey("credit_card")) {
                    e.setCreditCard(finalCreditCard);
                    e.setPaymentMode("CREDIT_CARD"); // Force payment mode if card is explicitly set
                }

                if ("CREDIT_CARD".equals(e.getPaymentMode()) && e.getCreditCard() != null) {
                    creditCardService.addExpenseToBill(e);
                }
            }
            if (t instanceof Income i && fields.containsKey("source")) {
                i.setSource((String) fields.get("source"));
            }
            if (t instanceof Saving s && fields.containsKey("is_in")) {
                s.setIsIn(toBoolean(fields.get("is_in")));
            }
            if (t instanceof Revolving r) {
                if (fields.containsKey("is_give"))
                    r.setIsGive(toBoolean(fields.get("is_give")));
                if (fields.containsKey("closed"))
                    r.setClosed(toBoolean(fields.get("closed")));
            }
        }
        transactionRepository.saveAll(transactions);
    }

    private Long toLong(Object val) {
        if (val instanceof Number n)
            return n.longValue();
        return Long.parseLong(val.toString());
    }

    private Boolean toBoolean(Object val) {
        if (val instanceof Boolean b)
            return b;
        return Boolean.parseBoolean(val.toString());
    }

}