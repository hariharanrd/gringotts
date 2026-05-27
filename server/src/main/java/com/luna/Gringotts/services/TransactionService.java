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
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
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

    @Autowired
    PersonalizationService personalizationService;

    @Autowired
    private LoanLinkingService loanLinkingService;

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

    /**
     * Handles goal funding logic when saving a transaction.
     * 1. Validates no cyclic dependency (transaction's CSI is not tagged to the funding goal)
     * 2. Auto-sets include_in_budget = false
     * 3. Validates that transaction value doesn't exceed the goal's current_amount
     * 4. For PERSISTENT goals, deducts from goal's current_amount
     */
    private void handleGoalFunding(Transaction t) {
        if (t.getFundingGoal() == null) return;
        if (t instanceof Income) {
            throw new IllegalArgumentException("Income transactions cannot be funded from a goal");
        }

        Long goalId = t.getFundingGoal().getId();
        InvestmentGoal fullGoal = investmentGoalService.requireGoal(goalId);

        // Cyclic dependency check
        if (investmentGoalService.isTransactionTaggedToGoal(t, goalId)) {
            throw new IllegalArgumentException(
                "Cannot fund from a goal that this transaction contributes to via tags");
        }

        t.setFundingGoal(fullGoal);
        t.setIncludeInBudget(false);
        investmentGoalService.deductFromGoal(goalId, t.getValue(), t.getId());
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
        handleGoalFunding(e);
        expenseRepository.save(e);
        handleCreditCardDebit(e);

        if (e.getLoan() != null && e.getLoan().getId() != null) {
            loanLinkingService.linkExpenseToLoan(e);
        }
    }

    public void saveIncome(Income i) {
        i.setIncludeInBudget(true);
        i.setFundingGoal(null); // Ensure income cannot be goal funded
        i.setUser(iamService.getCurrentUser());
        incomeRepository.save(i);
        handleCreditCardDebit(i);
    }

    public void saveSaving(Saving s) {
        if (Boolean.FALSE.equals(s.getIsIn())) {
            s.setIncludeInBudget(true);
        }
        s.setUser(iamService.getCurrentUser());
        handleGoalFunding(s);
        savingRepository.save(s);
        // Auto-credit linked investment goals.
        double delta = Boolean.TRUE.equals(s.getIsIn()) ? s.getValue() : -s.getValue();
        investmentGoalService.adjustGoalsForSaving(s, delta);
        handleCreditCardDebit(s);
    }

    public void saveRevolving(Revolving r) {
        if (Boolean.FALSE.equals(r.getIsGive())) {
            r.setIncludeInBudget(true);
        }
        r.setUser(iamService.getCurrentUser());
        handleGoalFunding(r);
        revolvingRepository.save(r);

        handleCreditCardDebit(r);
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
            handleCreditCardCredit(existing);
            if (existing.getFundingGoal() != null) {
                investmentGoalService.restoreToGoal(existing.getFundingGoal().getId(), existing.getValue());
            }
            if (existing.getLoan() != null) {
                loanLinkingService.unlinkExpenseFromLoan(existing);
            }
        });
        expenseRepository.deleteById(id);
    }

    public void deleteIncome(Long id) {
        incomeRepository.findById(id).ifPresent(existing -> {
            handleCreditCardCredit(existing);
        });
        incomeRepository.deleteById(id);
    }

    public void deleteSaving(Long id) {
        Saving existing = savingRepository.findById(id).orElse(null);
        if (existing != null) {
            double reversal = Boolean.TRUE.equals(existing.getIsIn()) ? -existing.getValue() : existing.getValue();
            investmentGoalService.adjustGoalsForSaving(existing, reversal);
            handleCreditCardCredit(existing);
            if (existing.getFundingGoal() != null) {
                investmentGoalService.restoreToGoal(existing.getFundingGoal().getId(), existing.getValue());
            }
        }
        savingRepository.deleteById(id);
    }

    public void deleteRevolving(Long id) {
        revolvingRepository.findById(id).ifPresent(existing -> {
            handleCreditCardCredit(existing);
            if (existing.getFundingGoal() != null) {
                investmentGoalService.restoreToGoal(existing.getFundingGoal().getId(), existing.getValue());
            }
        });
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
        target.setIncludeInBudget(source.getIncludeInBudget());
        if (source.getFundingGoal() != null) {
            target.setFundingGoal(investmentGoalService.requireGoal(source.getFundingGoal().getId()));
        } else {
            target.setFundingGoal(null);
        }
        target.setLoan(source.getLoan());
        target.setLoanPaymentType(source.getLoanPaymentType());
    }

    private void handleCreditCardDebit(Transaction t) {
        if (t != null && "CREDIT_CARD".equals(t.getPaymentMode()) && t.getCreditCard() != null) {
            creditCardService.addTransactionToBill(t);
        }
    }

    private void handleCreditCardCredit(Transaction t) {
        if (t != null && "CREDIT_CARD".equals(t.getPaymentMode()) && t.getCreditCard() != null) {
            creditCardService.removeTransactionFromBill(t);
        }
    }

    private void deleteFromOldTable(Long id, Transaction t) {
        if (t instanceof Expense)
            expenseRepository.deleteExpenseRecord(id);
        else if (t instanceof Income)
            incomeRepository.deleteIncomeRecord(id);
        else if (t instanceof Saving)
            savingRepository.deleteSavingRecord(id);
        else if (t instanceof Revolving)
            revolvingRepository.deleteRevolvingRecord(id);
    }

    // ── Cross-type-safe update methods ───────────────────────────────────────

    @Transactional
    public Expense updateToExpense(Long id, Expense incoming) {
        Transaction existing = transactionRepository.findById(id).orElseThrow();
        handleCreditCardCredit(existing);

        // Reverse old goal first
        if (existing.getFundingGoal() != null) {
            investmentGoalService.restoreToGoal(existing.getFundingGoal().getId(), existing.getValue());
        }

        // Reverse old loan payment if linked
        if (existing.getLoan() != null && existing instanceof Expense) {
            loanLinkingService.unlinkExpenseFromLoan((Expense) existing);
            existing.setLoan(null);
            existing.setLoanPaymentType(null);
        }

        if (existing instanceof Expense current) {
            applyBaseFields(current, incoming);
            current.setPaymentMode(incoming.getPaymentMode());
            current.setCreditCard(incoming.getCreditCard());

            // Apply new goal funding
            if (current.getFundingGoal() != null) {
                if (investmentGoalService.isTransactionTaggedToGoal(current, current.getFundingGoal().getId())) {
                    throw new IllegalArgumentException("Cyclic dependency: transaction tagged to funding goal");
                }
                current.setIncludeInBudget(false);
                investmentGoalService.deductFromGoal(current.getFundingGoal().getId(), current.getValue(), current.getId());
            }

            Expense saved = expenseRepository.save(current);
            handleCreditCardDebit(saved);

            if (saved.getLoan() != null && saved.getLoan().getId() != null) {
                loanLinkingService.linkExpenseToLoan(saved);
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

        // Apply new goal funding
        if (saved.getFundingGoal() != null) {
            if (investmentGoalService.isTransactionTaggedToGoal(saved, saved.getFundingGoal().getId())) {
                throw new IllegalArgumentException("Cyclic dependency: transaction tagged to funding goal");
            }
            saved.setIncludeInBudget(false);
            investmentGoalService.deductFromGoal(saved.getFundingGoal().getId(), saved.getValue(), saved.getId());
        }

        saved = expenseRepository.save(saved);
        handleCreditCardDebit(saved);

        if (saved.getLoan() != null && saved.getLoan().getId() != null) {
            loanLinkingService.linkExpenseToLoan(saved);
        }
        return saved;
    }

    @Transactional
    public Income updateToIncome(Long id, Income incoming) {
        incoming.setIncludeInBudget(true);
        incoming.setFundingGoal(null); // Ensure income cannot be goal funded
        Transaction existing = transactionRepository.findById(id).orElseThrow();
        handleCreditCardCredit(existing);

        // Reverse old goal first
        if (existing.getFundingGoal() != null) {
            investmentGoalService.restoreToGoal(existing.getFundingGoal().getId(), existing.getValue());
        }

        // Reverse old loan payment if linked
        if (existing.getLoan() != null && existing instanceof Expense) {
            loanLinkingService.unlinkExpenseFromLoan((Expense) existing);
            existing.setLoan(null);
            existing.setLoanPaymentType(null);
        }

        if (existing instanceof Income current) {
            applyBaseFields(current, incoming);
            current.setSource(incoming.getSource());
            Income saved = incomeRepository.save(current);
            handleCreditCardDebit(saved);
            return saved;
        }

        deleteFromOldTable(id, existing);
        incomeRepository.insertIncome(id, incoming.getSource());
        entityManager.flush();
        entityManager.clear();

        Income saved = incomeRepository.findById(id).orElseThrow();
        applyBaseFields(saved, incoming);
        saved = incomeRepository.save(saved);
        handleCreditCardDebit(saved);
        return saved;
    }

    @Transactional
    public Saving updateToSaving(Long id, Saving incoming) {
        if (Boolean.FALSE.equals(incoming.getIsIn())) {
            incoming.setIncludeInBudget(true);
        }
        Transaction existing = transactionRepository.findById(id).orElseThrow();
        handleCreditCardCredit(existing);

        // Reverse old goal first
        if (existing.getFundingGoal() != null) {
            investmentGoalService.restoreToGoal(existing.getFundingGoal().getId(), existing.getValue());
        }

        // Reverse old loan payment if linked
        if (existing.getLoan() != null && existing instanceof Expense) {
            loanLinkingService.unlinkExpenseFromLoan((Expense) existing);
            existing.setLoan(null);
            existing.setLoanPaymentType(null);
        }

        if (existing instanceof Saving current) {
            // Reverse old contribution then apply new one
            double oldDelta = Boolean.TRUE.equals(current.getIsIn()) ? current.getValue() : -current.getValue();
            investmentGoalService.adjustGoalsForSaving(current, -oldDelta);

            applyBaseFields(current, incoming);
            current.setIsIn(incoming.getIsIn());

            // Apply new goal funding
            if (current.getFundingGoal() != null) {
                if (investmentGoalService.isTransactionTaggedToGoal(current, current.getFundingGoal().getId())) {
                    throw new IllegalArgumentException("Cyclic dependency: transaction tagged to funding goal");
                }
                current.setIncludeInBudget(false);
                investmentGoalService.deductFromGoal(current.getFundingGoal().getId(), current.getValue(), current.getId());
            }

            Saving saved = savingRepository.save(current);

            double newDelta = Boolean.TRUE.equals(saved.getIsIn()) ? saved.getValue() : -saved.getValue();
            investmentGoalService.adjustGoalsForSaving(saved, newDelta);
            handleCreditCardDebit(saved);
            return saved;
        }

        deleteFromOldTable(id, existing);
        savingRepository.insertSaving(id, Boolean.TRUE.equals(incoming.getIsIn()));
        entityManager.flush();
        entityManager.clear();

        Saving saved = savingRepository.findById(id).orElseThrow();
        applyBaseFields(saved, incoming);

        // Apply new goal funding
        if (saved.getFundingGoal() != null) {
            if (investmentGoalService.isTransactionTaggedToGoal(saved, saved.getFundingGoal().getId())) {
                throw new IllegalArgumentException("Cyclic dependency: transaction tagged to funding goal");
            }
            saved.setIncludeInBudget(false);
            investmentGoalService.deductFromGoal(saved.getFundingGoal().getId(), saved.getValue(), saved.getId());
        }

        saved = savingRepository.save(saved);

        double newDelta = Boolean.TRUE.equals(saved.getIsIn()) ? saved.getValue() : -saved.getValue();
        investmentGoalService.adjustGoalsForSaving(saved, newDelta);
        handleCreditCardDebit(saved);
        return saved;
    }

    @Transactional
    public Revolving updateToRevolving(Long id, Revolving incoming) {
        if (Boolean.FALSE.equals(incoming.getIsGive())) {
            incoming.setIncludeInBudget(true);
        }
        Transaction existing = transactionRepository.findById(id).orElseThrow();
        handleCreditCardCredit(existing);

        // Reverse old goal first
        if (existing.getFundingGoal() != null) {
            investmentGoalService.restoreToGoal(existing.getFundingGoal().getId(), existing.getValue());
        }

        // Reverse old loan payment if linked
        if (existing.getLoan() != null && existing instanceof Expense) {
            loanLinkingService.unlinkExpenseFromLoan((Expense) existing);
            existing.setLoan(null);
            existing.setLoanPaymentType(null);
        }

        if (existing instanceof Revolving current) {
            applyBaseFields(current, incoming);
            current.setIsGive(incoming.getIsGive());
            current.setClosed(incoming.getClosed());

            // Apply new goal funding
            if (current.getFundingGoal() != null) {
                if (investmentGoalService.isTransactionTaggedToGoal(current, current.getFundingGoal().getId())) {
                    throw new IllegalArgumentException("Cyclic dependency: transaction tagged to funding goal");
                }
                current.setIncludeInBudget(false);
                investmentGoalService.deductFromGoal(current.getFundingGoal().getId(), current.getValue(), current.getId());
            }

            Revolving saved = revolvingRepository.save(current);
            handleCreditCardDebit(saved);
            return saved;
        }

        deleteFromOldTable(id, existing);
        revolvingRepository.insertRevolving(id, Boolean.TRUE.equals(incoming.getIsGive()),
                Boolean.TRUE.equals(incoming.getClosed()));
        entityManager.flush();
        entityManager.clear();

        Revolving saved = revolvingRepository.findById(id).orElseThrow();
        applyBaseFields(saved, incoming);

        // Apply new goal funding
        if (saved.getFundingGoal() != null) {
            if (investmentGoalService.isTransactionTaggedToGoal(saved, saved.getFundingGoal().getId())) {
                throw new IllegalArgumentException("Cyclic dependency: transaction tagged to funding goal");
            }
            saved.setIncludeInBudget(false);
            investmentGoalService.deductFromGoal(saved.getFundingGoal().getId(), saved.getValue(), saved.getId());
        }

        saved = revolvingRepository.save(saved);
        handleCreditCardDebit(saved);
        return saved;
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

    private ZoneId getUserZoneId() {
        try {
            return personalizationService.getPersonalization("UI", "TIMEZONE")
                    .map(p -> ZoneId.of(p.getConfigValue()))
                    .orElse(ZoneId.of("UTC"));
        } catch (Exception e) {
            return ZoneId.of("UTC");
        }
    }

    public Map<String, Object> getSummary(TimeRange range) {
        ZoneId zoneId = getUserZoneId();
        LocalDateTime start = range.getFrom(zoneId);
        LocalDateTime end = range.getTo(zoneId);
        User user = iamService.getCurrentUser();

        List<Expense> expenses = expenseRepository.findByUserAndTransactionTimeBetween(user, start, end);
        List<Income> incomes = incomeRepository.findByUserAndTransactionTimeBetween(user, start, end);
        List<Saving> savings = savingRepository.findByUserAndTransactionTimeBetween(user, start, end);

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

        List<Revolving> revolvings = revolvingRepository.findByUserAndTransactionTimeBetween(user, start, end);
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
        summary.put("range", range.name());
        summary.put("start_date", start);
        summary.put("end_date", end);
        summary.put("total_expenses", totalExpenses);
        summary.put("total_incomes", totalIncomes);
        summary.put("total_savings", totalSavings);
        summary.put("total_i_owe", totalIOwe);
        summary.put("total_others_owe_me", totalOthersOweMe);
        summary.put("net_balance", totalIncomes - totalExpenses - totalSavings);
        summary.put("expense_count", expenses.size());
        summary.put("income_count", incomes.size());
        summary.put("saving_count", savings.size());
        summary.put("category_breakdown", categoryBreakdown);
        summary.put("savings_breakdown", savingsBreakdown);
        summary.put("recent_transactions", recentTransactions);
        summary.put("credit_card_bills", creditCardService.getBillSummary());

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
            if (ccVal == null)
                ccVal = fields.get("credit_card_id");

            Long id;
            if (ccVal instanceof Map<?, ?> ccMap) {
                id = toLong(ccMap.get("id"));
            } else {
                id = toLong(ccVal);
            }

            creditCard = creditCardRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Credit Card not found: " + id));
        }

        InvestmentGoal bulkFundingGoal = null;
        boolean updateFundingGoal = fields.containsKey("funding_goal_id");
        if (updateFundingGoal) {
            Object fgVal = fields.get("funding_goal_id");
            if (fgVal != null) {
                Long goalId = toLong(fgVal);
                bulkFundingGoal = investmentGoalService.requireGoal(goalId);
            }
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

            handleCreditCardCredit(t);

            if (fields.containsKey("payment_mode")) {
                t.setPaymentMode((String) fields.get("payment_mode"));
            }

            if (updateFundingGoal) {
                if (!(t instanceof Income)) {
                    InvestmentGoal oldGoal = t.getFundingGoal();
                    if (oldGoal != null) {
                        investmentGoalService.restoreToGoal(oldGoal.getId(), t.getValue());
                    }
                    t.setFundingGoal(bulkFundingGoal);
                    if (bulkFundingGoal != null) {
                        if (investmentGoalService.isTransactionTaggedToGoal(t, bulkFundingGoal.getId())) {
                            throw new IllegalArgumentException("Cyclic dependency: transaction tagged to funding goal");
                        }
                        t.setIncludeInBudget(false);
                        investmentGoalService.deductFromGoal(bulkFundingGoal.getId(), t.getValue(), t.getId());
                    } else {
                        t.setIncludeInBudget(true);
                    }
                }
            }

            if (fields.containsKey("include_in_budget")) {
                boolean val = toBoolean(fields.get("include_in_budget"));
                if (!val) {
                    if (t instanceof Income) {
                        val = true;
                    } else if (t instanceof Saving s && Boolean.FALSE.equals(s.getIsIn())) {
                        val = true;
                    } else if (t instanceof Revolving r && Boolean.FALSE.equals(r.getIsGive())) {
                        val = true;
                    } else if (t.getFundingGoal() != null) {
                        val = false;
                    }
                } else {
                    if (t.getFundingGoal() != null) {
                        val = false;
                    }
                }
                t.setIncludeInBudget(val);
            }

            if (fields.containsKey("credit_card_id") || fields.containsKey("credit_card")) {
                t.setCreditCard(finalCreditCard);
                t.setPaymentMode("CREDIT_CARD"); // Force payment mode if card is explicitly set
            }

            handleCreditCardDebit(t);
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