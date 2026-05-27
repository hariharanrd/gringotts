package com.luna.Gringotts.services;

import com.luna.Gringotts.records.Category;
import com.luna.Gringotts.records.SubCategory;
import com.luna.Gringotts.records.Item;
import com.luna.Gringotts.records.Expense;
import com.luna.Gringotts.records.Loan;
import com.luna.Gringotts.records.LoanPartPayment;
import com.luna.Gringotts.records.User;
import com.luna.Gringotts.repository.ExpenseRepository;
import com.luna.Gringotts.repository.LoanPartPaymentRepository;
import com.luna.Gringotts.repository.LoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class LoanLinkingService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private LoanPartPaymentRepository loanPartPaymentRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private LoanService loanService;

    @Transactional
    public void linkExpenseToLoan(Expense e) {
        if (e.getLoan() == null || e.getLoan().getId() == null) {
            return;
        }

        Loan loan = loanRepository.findById(e.getLoan().getId())
                .orElseThrow(() -> new NoSuchElementException("Loan not found with ID: " + e.getLoan().getId()));

        // Security / User Isolation check
        if (!loan.getUser().getId().equals(e.getUser().getId())) {
            throw new SecurityException("Unauthorized access to loan");
        }

        // 1. Determine if the amount matches the EMI
        boolean amountMatchesEmi = Math.abs(e.getValue() - loan.getEmiAmount()) < 0.01;

        if (amountMatchesEmi) {
            // Check if an EMI expense already exists for this loan in the same calendar month
            LocalDateTime transactionTime = e.getTransactionTime() != null ? e.getTransactionTime() : LocalDateTime.now();
            LocalDateTime monthStart = transactionTime.withDayOfMonth(1).toLocalDate().atStartOfDay();
            LocalDateTime monthEnd = monthStart.plusMonths(1);

            List<Expense> existingEmis = expenseRepository.findEmiExpensesForLoanInMonth(
                    loan.getId(), monthStart, monthEnd, e.getUser());

            if (existingEmis.isEmpty()) {
                // No EMI payment logged for this loan in this month -> treat as EMI payment
                e.setLoanPaymentType("EMI");
                expenseRepository.save(e); // Ensure type is saved

                // Increment emis_paid on loan
                loanService.markEmiPaidInternal(loan.getId(), 1);
                return;
            }
        }

        // 2. Either amount does not match EMI or an EMI is already logged this month -> treat as Part Payment
        e.setLoanPaymentType("PART_PAYMENT");
        expenseRepository.save(e); // Ensure type is saved

        LoanPartPayment pp = new LoanPartPayment();
        pp.setLoan(loan);
        pp.setAmount(e.getValue());
        pp.setPaymentDate(e.getTransactionTime() != null ? e.getTransactionTime().toLocalDate() : java.time.LocalDate.now());
        pp.setNotes("Part payment linked to Expense: " + e.getDescription());
        pp.setLinkedExpenseId(e.getId());

        loanService.addPartPaymentInternal(loan.getId(), pp);
    }

    @Transactional
    public void unlinkExpenseFromLoan(Expense e) {
        if (e.getLoan() == null || e.getLoanPaymentType() == null) {
            return;
        }

        Loan loan = loanRepository.findById(e.getLoan().getId())
                .orElseThrow(() -> new NoSuchElementException("Loan not found with ID: " + e.getLoan().getId()));

        if ("EMI".equals(e.getLoanPaymentType())) {
            // Decrement emis_paid on loan
            int newPaid = Math.max(0, loan.getEmisPaid() - 1);
            loan.setEmisPaid(newPaid);
            
            // Recalculate closure if it was closed
            if (Boolean.TRUE.equals(loan.getIsClosed())) {
                List<LoanPartPayment> pps = loanPartPaymentRepository.findAllByLoanOrderByPaymentDateAsc(loan);
                Map<String, Object> summary = loanService.calculateLoanSummary(loan, pps);
                int adjustedTenure = (Integer) summary.get("adjusted_tenure_months");
                if (newPaid < adjustedTenure) {
                    loan.setIsClosed(false);
                    loan.setClosedAt(null);
                }
            }
            loanRepository.save(loan);
        } else if ("PART_PAYMENT".equals(e.getLoanPaymentType())) {
            // Delete the corresponding part payment by linked expense ID
            loanPartPaymentRepository.findByLinkedExpenseId(e.getId()).ifPresent(pp -> {
                loanService.deletePartPaymentInternal(pp.getId());
            });
        }
    }

    @Transactional
    public void createExpenseForEmiPayment(Loan loan) {
        Expense e = new Expense();
        e.setUser(loan.getUser());
        e.setValue(loan.getEmiAmount());
        e.setDescription("EMI Payment - " + loan.getName());
        e.setTransactionTime(LocalDateTime.now());
        e.setPaymentMode(Expense.ExpenseMode.EMANDATE.name());
        e.setLoan(loan);
        e.setLoanPaymentType("EMI");
        e.setIncludeInBudget(true);

        // Apply default loan categories if configured
        if (loan.getExpenseCategory() != null) {
            e.setCategory(loan.getExpenseCategory());
        }
        if (loan.getExpenseSubCategory() != null) {
            e.setSubCategory(loan.getExpenseSubCategory());
        }
        if (loan.getExpenseItem() != null) {
            e.setItem(loan.getExpenseItem());
        }

        expenseRepository.save(e);
    }

    @Transactional
    public void createExpenseForPartPayment(Loan loan, LoanPartPayment pp) {
        Expense e = new Expense();
        e.setUser(loan.getUser());
        e.setValue(pp.getAmount());
        e.setDescription("Part Payment - " + loan.getName() + (pp.getNotes() != null && !pp.getNotes().trim().isEmpty() ? " (" + pp.getNotes() + ")" : ""));
        e.setTransactionTime(pp.getPaymentDate() != null ? pp.getPaymentDate().atStartOfDay() : LocalDateTime.now());
        e.setPaymentMode(Expense.ExpenseMode.NET_BANKING.name());
        e.setLoan(loan);
        e.setLoanPaymentType("PART_PAYMENT");
        e.setIncludeInBudget(true);

        // Apply default loan categories if configured
        if (loan.getExpenseCategory() != null) {
            e.setCategory(loan.getExpenseCategory());
        }
        if (loan.getExpenseSubCategory() != null) {
            e.setSubCategory(loan.getExpenseSubCategory());
        }
        if (loan.getExpenseItem() != null) {
            e.setItem(loan.getExpenseItem());
        }

        expenseRepository.save(e);
        pp.setLinkedExpenseId(e.getId());
        loanPartPaymentRepository.save(pp);
    }

    @Transactional
    public void deleteExpenseForPartPayment(LoanPartPayment pp) {
        if (pp.getLinkedExpenseId() != null) {
            expenseRepository.findById(pp.getLinkedExpenseId()).ifPresent(e -> {
                // Clear loan linking info first so we don't trigger circular unlink
                e.setLoan(null);
                e.setLoanPaymentType(null);
                expenseRepository.save(e);
                expenseRepository.delete(e);
            });
        }
    }
}
