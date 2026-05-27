package com.luna.Gringotts.services;

import com.luna.Gringotts.records.Category;
import com.luna.Gringotts.records.Item;
import com.luna.Gringotts.records.Loan;
import com.luna.Gringotts.records.LoanPartPayment;
import com.luna.Gringotts.records.SubCategory;
import com.luna.Gringotts.records.User;
import com.luna.Gringotts.repository.LoanRepository;
import com.luna.Gringotts.repository.LoanPartPaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LoanService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private LoanPartPaymentRepository loanPartPaymentRepository;

    @Autowired
    private IAMService iamService;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private LoanLinkingService loanLinkingService;

    // ── CRUD Operations ────────────────────────────────────────────────────────

    public List<Map<String, Object>> getAllLoans() {
        User user = iamService.getCurrentUser();
        List<Loan> loans = loanRepository.findAllByUserOrderByCreatedAtDesc(user);
        return loans.stream().map(this::toDto).collect(Collectors.toList());
    }

    public Map<String, Object> getLoanById(Long id) {
        Loan loan = requireLoan(id);
        return toDto(loan);
    }

    @Transactional
    public Map<String, Object> createLoan(Loan loan) {
        validateLoan(loan);
        loan.setUser(iamService.getCurrentUser());
        double emi = calculateEmi(loan.getPrincipalAmount(), loan.getAnnualRate(), loan.getTenureMonths());
        loan.setEmiAmount(Math.round(emi * 100.0) / 100.0);
        if (loan.getEmisPaid() == null)
            loan.setEmisPaid(0);
        if (loan.getIsClosed() == null)
            loan.setIsClosed(false);
        return toDto(loanRepository.save(loan));
    }

    @Transactional
    public Map<String, Object> updateLoan(Long id, Loan incoming) {
        Loan existing = requireLoan(id);
        validateLoan(incoming);
        existing.setName(incoming.getName());
        existing.setLender(incoming.getLender());
        existing.setPrincipalAmount(incoming.getPrincipalAmount());
        existing.setAnnualRate(incoming.getAnnualRate());
        existing.setTenureMonths(incoming.getTenureMonths());
        existing.setStartDate(incoming.getStartDate());
        existing.setEmisPaid(incoming.getEmisPaid());
        existing.setNotes(incoming.getNotes());
        existing.setExpenseCategory(incoming.getExpenseCategory());
        existing.setExpenseSubCategory(incoming.getExpenseSubCategory());
        existing.setExpenseItem(incoming.getExpenseItem());

        double emi = calculateEmi(existing.getPrincipalAmount(), existing.getAnnualRate(), existing.getTenureMonths());
        existing.setEmiAmount(Math.round(emi * 100.0) / 100.0);

        List<LoanPartPayment> pps = loanPartPaymentRepository.findAllByLoanOrderByPaymentDateAsc(existing);
        Map<String, Object> summary = calculateLoanSummary(existing, pps);
        int adjustedTenure = (Integer) summary.get("adjusted_tenure_months");

        if (existing.getEmisPaid() > adjustedTenure) {
            throw new IllegalArgumentException("EMIs paid (" + existing.getEmisPaid() + ") cannot exceed the adjusted tenure (" + adjustedTenure + " months)");
        }

        if (existing.getEmisPaid() >= adjustedTenure) {
            existing.setIsClosed(true);
            existing.setClosedAt(LocalDateTime.now());
        } else {
            existing.setIsClosed(incoming.getIsClosed() != null ? incoming.getIsClosed() : false);
            if (Boolean.TRUE.equals(existing.getIsClosed())) {
                if (existing.getClosedAt() == null) {
                    existing.setClosedAt(LocalDateTime.now());
                }
            } else {
                existing.setClosedAt(null);
            }
        }

        return toDto(loanRepository.save(existing));
    }

    @Transactional
    public void deleteLoan(Long id) {
        requireLoan(id);
        loanRepository.deleteById(id);
    }

    @Transactional
    public Map<String, Object> closeLoan(Long id) {
        Loan existing = requireLoan(id);
        existing.setIsClosed(true);
        existing.setClosedAt(LocalDateTime.now());
        return toDto(loanRepository.save(existing));
    }

    @Transactional
    public void markEmiPaidInternal(Long id, int count) {
        Loan existing = loanRepository.findById(id).orElseThrow();
        if (count <= 0) {
            throw new IllegalArgumentException("EMI count to pay must be greater than zero");
        }
        if (Boolean.TRUE.equals(existing.getIsClosed())) {
            throw new IllegalStateException("Cannot pay EMI on a closed loan");
        }

        int newPaid = existing.getEmisPaid() + count;

        List<LoanPartPayment> pps = loanPartPaymentRepository.findAllByLoanOrderByPaymentDateAsc(existing);
        Map<String, Object> summary = calculateLoanSummary(existing, pps);
        int adjustedTenure = (Integer) summary.get("adjusted_tenure_months");

        if (newPaid > adjustedTenure) {
            newPaid = adjustedTenure;
        }
        existing.setEmisPaid(newPaid);
        if (newPaid >= adjustedTenure) {
            existing.setIsClosed(true);
            existing.setClosedAt(LocalDateTime.now());
        }
        loanRepository.save(existing);
    }

    @Transactional
    public Map<String, Object> markEmiPaid(Long id, int count) {
        Loan existing = requireLoan(id);
        if (count <= 0) {
            throw new IllegalArgumentException("EMI count to pay must be greater than zero");
        }
        if (Boolean.TRUE.equals(existing.getIsClosed())) {
            throw new IllegalStateException("Cannot pay EMI on a closed loan");
        }
        markEmiPaidInternal(id, count);

        // Auto-create expense record
        loanLinkingService.createExpenseForEmiPayment(existing);

        return toDto(existing);
    }

    // ── Part Payment Endpoints ──────────────────────────────────────────────────

    @Transactional
    public void addPartPaymentInternal(Long loanId, LoanPartPayment partPayment) {
        Loan loan = loanRepository.findById(loanId).orElseThrow();
        if (partPayment == null || partPayment.getAmount() == null || partPayment.getAmount() <= 0.0) {
            throw new IllegalArgumentException("Part payment amount must be greater than zero");
        }
        if (Boolean.TRUE.equals(loan.getIsClosed())) {
            throw new IllegalStateException("Cannot add part payment to a closed loan");
        }

        Map<String, Object> summary = getLoanSummary(loan);
        double outstanding = (Double) summary.get("outstanding_principal");
        if (partPayment.getAmount() - outstanding > 0.01) {
            throw new IllegalArgumentException("Part payment amount (" + partPayment.getAmount() + 
                ") exceeds the current outstanding principal (" + outstanding + ")");
        }

        partPayment.setLoan(loan);
        if (partPayment.getPaymentDate() == null)
            partPayment.setPaymentDate(LocalDate.now());
        loanPartPaymentRepository.save(partPayment);

        // Auto-close loan if outstanding principal hits 0
        Map<String, Object> updatedSummary = getLoanSummary(loan);
        double updatedOutstanding = (Double) updatedSummary.get("outstanding_principal");
        if (updatedOutstanding <= 0.0) {
            loan.setIsClosed(true);
            loan.setClosedAt(LocalDateTime.now());
            loanRepository.save(loan);
        }
    }

    @Transactional
    public Map<String, Object> addPartPayment(Long loanId, LoanPartPayment partPayment) {
        Loan loan = requireLoan(loanId);
        addPartPaymentInternal(loanId, partPayment);

        // Auto-create expense record
        loanLinkingService.createExpenseForPartPayment(loan, partPayment);

        return toDto(loan);
    }

    @Transactional
    public void deletePartPaymentInternal(Long paymentId) {
        LoanPartPayment pp = loanPartPaymentRepository.findById(paymentId)
                .orElseThrow(() -> new NoSuchElementException("Part payment not found: " + paymentId));
        Loan loan = pp.getLoan();

        loanPartPaymentRepository.delete(pp);

        // If loan was closed and now outstanding > 0, re-open it
        Map<String, Object> summary = getLoanSummary(loan);
        double outstanding = (Double) summary.get("outstanding_principal");
        if (outstanding > 0.0 && Boolean.TRUE.equals(loan.getIsClosed())) {
            loan.setIsClosed(false);
            loan.setClosedAt(null);
            loanRepository.save(loan);
        }
    }

    @Transactional
    public Map<String, Object> deletePartPayment(Long paymentId) {
        LoanPartPayment pp = loanPartPaymentRepository.findById(paymentId)
                .orElseThrow(() -> new NoSuchElementException("Part payment not found: " + paymentId));
        Loan loan = pp.getLoan();
        requireLoan(loan.getId());

        // Auto-delete linked expense
        loanLinkingService.deleteExpenseForPartPayment(pp);

        deletePartPaymentInternal(paymentId);

        return toDto(loan);
    }

    public List<Map<String, Object>> getPartPayments(Long loanId) {
        Loan loan = requireLoan(loanId);
        List<LoanPartPayment> pps = loanPartPaymentRepository.findAllByLoanOrderByPaymentDateAsc(loan);
        return pps.stream().map(pp -> {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", pp.getId());
            dto.put("amount", pp.getAmount());
            dto.put("payment_date", pp.getPaymentDate().toString());
            dto.put("notes", pp.getNotes());
            dto.put("linked_expense_id", pp.getLinkedExpenseId());
            dto.put("created_at", pp.getCreatedAt() != null ? pp.getCreatedAt().toString() : null);
            return dto;
        }).collect(Collectors.toList());
    }

    // ── Business Logic ─────────────────────────────────────────────────────────

    public double calculateEmi(double principal, double annualRate, int tenureMonths) {
        if (tenureMonths <= 0)
            return 0.0;
        if (annualRate <= 0.0)
            return principal / tenureMonths;
        double r = (annualRate / 12.0) / 100.0;
        return (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
    }

    public Map<String, Object> getLoanSummary(Loan loan) {
        List<LoanPartPayment> partPayments = loanPartPaymentRepository.findAllByLoanOrderByPaymentDateAsc(loan);
        return calculateLoanSummary(loan, partPayments);
    }

    public Map<String, Object> calculateLoanSummary(Loan loan, List<LoanPartPayment> partPayments) {
        double principal = loan.getPrincipalAmount();
        int tenure = loan.getTenureMonths();
        int emisPaid = loan.getEmisPaid();

        List<Map<String, Object>> schedule = calculateAmortizationSchedule(loan, partPayments);

        double totalPayable = 0.0;
        double totalInterest = 0.0;
        double outstandingPrincipal = principal;
        double amountPaidSoFar = 0.0;
        int activeMonths = schedule.size();

        for (Map<String, Object> row : schedule) {
            double rowEmi = (Double) row.get("emi");
            double rowInterest = (Double) row.get("interest_component");
            double rowPp = (Double) row.get("part_payment_amount");
            int m = (Integer) row.get("month");

            totalPayable += rowEmi + rowPp;
            totalInterest += rowInterest;

            if (m <= emisPaid) {
                amountPaidSoFar += rowEmi + rowPp;
                outstandingPrincipal = (Double) row.get("outstanding_balance");
            }
        }

        if (emisPaid >= activeMonths) {
            outstandingPrincipal = 0.0;
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("total_payable", Math.round(totalPayable * 100.0) / 100.0);
        summary.put("total_interest", Math.round(totalInterest * 100.0) / 100.0);
        summary.put("amount_paid_so_far", Math.round(amountPaidSoFar * 100.0) / 100.0);
        summary.put("outstanding_principal", Math.round(outstandingPrincipal * 100.0) / 100.0);
        summary.put("emis_remaining", Math.max(0, activeMonths - emisPaid));
        double completion = activeMonths > 0 ? ((double) Math.min(emisPaid, activeMonths) / activeMonths) * 100.0
                : 100.0;
        summary.put("completion_percent", Math.min(100.0, Math.round(completion * 10.0) / 10.0));
        summary.put("adjusted_tenure_months", activeMonths);

        return summary;
    }

    public List<Map<String, Object>> getAmortizationSchedule(Long id) {
        Loan loan = requireLoan(id);
        List<LoanPartPayment> partPayments = loanPartPaymentRepository.findAllByLoanOrderByPaymentDateAsc(loan);
        return calculateAmortizationSchedule(loan, partPayments);
    }

    private List<Map<String, Object>> calculateAmortizationSchedule(Loan loan, List<LoanPartPayment> partPayments) {
        List<Map<String, Object>> schedule = new ArrayList<>();
        double balance = loan.getPrincipalAmount();
        double annualRate = loan.getAnnualRate();
        int originalTenure = loan.getTenureMonths();
        double emi = loan.getEmiAmount();
        LocalDate startDate = loan.getStartDate();

        double r = (annualRate / 12.0) / 100.0;
        LocalDate currentDate = startDate;

        for (int month = 1; month <= originalTenure; month++) {
            if (balance <= 0.0)
                break;

            double interestComponent = (annualRate > 0.0) ? (balance * r) : 0.0;
            double principalComponent = emi - interestComponent;

            if (balance < principalComponent) {
                principalComponent = balance;
            }

            balance -= principalComponent;

            LocalDate nextMonthDate = currentDate.plusMonths(1);
            double monthPartPaymentsTotal = 0.0;
            for (LoanPartPayment pp : partPayments) {
                LocalDate ppDate = pp.getPaymentDate();
                if (!ppDate.isBefore(currentDate) && ppDate.isBefore(nextMonthDate)) {
                    monthPartPaymentsTotal += pp.getAmount();
                }
            }

            if (monthPartPaymentsTotal > 0.0) {
                if (balance < monthPartPaymentsTotal) {
                    monthPartPaymentsTotal = balance;
                }
                balance -= monthPartPaymentsTotal;
            }

            if (balance < 0.0)
                balance = 0.0;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("month", month);
            row.put("date", currentDate.toString());
            row.put("emi", Math.round((principalComponent + interestComponent) * 100.0) / 100.0);
            row.put("principal_component", Math.round(principalComponent * 100.0) / 100.0);
            row.put("interest_component", Math.round(interestComponent * 100.0) / 100.0);
            row.put("part_payment_amount", Math.round(monthPartPaymentsTotal * 100.0) / 100.0);
            row.put("outstanding_balance", Math.round(balance * 100.0) / 100.0);

            schedule.add(row);

            currentDate = nextMonthDate;
        }
        return schedule;
    }

    public Map<String, Object> simulateEarlyClosure(Long id, int targetMonths) {
        Loan loan = requireLoan(id);
        List<LoanPartPayment> partPayments = loanPartPaymentRepository.findAllByLoanOrderByPaymentDateAsc(loan);
        Map<String, Object> summary = calculateLoanSummary(loan, partPayments);
        double outstandingPrincipal = (Double) summary.get("outstanding_principal");
        int emisRemaining = (Integer) summary.get("emis_remaining");
        double annualRate = loan.getAnnualRate();

        if (targetMonths <= 0 || targetMonths > emisRemaining) {
            throw new IllegalArgumentException("Target tenure must be between 1 and " + emisRemaining);
        }

        double newEmi = calculateEmi(outstandingPrincipal, annualRate, targetMonths);
        double newPayable = newEmi * targetMonths;
        double newInterest = newPayable - outstandingPrincipal;

        double originalRemainingPayable = loan.getEmiAmount() * emisRemaining;
        double originalRemainingInterest = originalRemainingPayable - outstandingPrincipal;

        double interestSaved = originalRemainingInterest - newInterest;
        int monthsSaved = emisRemaining - targetMonths;

        Map<String, Object> sim = new LinkedHashMap<>();
        sim.put("target_months", targetMonths);
        sim.put("new_emi", Math.round(newEmi * 100.0) / 100.0);
        sim.put("total_payable", Math.round(newPayable * 100.0) / 100.0);
        sim.put("total_interest", Math.round(newInterest * 100.0) / 100.0);
        sim.put("interest_saved", Math.round(Math.max(0.0, interestSaved) * 100.0) / 100.0);
        sim.put("months_saved", Math.max(0, monthsSaved));
        return sim;
    }

    // ── Helper Methods ─────────────────────────────────────────────────────────

    private Loan requireLoan(Long id) {
        User user = iamService.getCurrentUser();
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Loan not found: " + id));
        if (!loan.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Access denied to loan: " + id);
        }
        return loan;
    }

    private void validateLoan(Loan loan) {
        if (loan == null) {
            throw new IllegalArgumentException("Loan payload cannot be null");
        }
        if (loan.getName() == null || loan.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Loan name is required");
        }
        if (loan.getPrincipalAmount() == null || loan.getPrincipalAmount() <= 0.0) {
            throw new IllegalArgumentException("Principal amount must be greater than zero");
        }
        if (loan.getAnnualRate() == null || loan.getAnnualRate() < 0.0 || loan.getAnnualRate() > 50.0) {
            throw new IllegalArgumentException("Annual interest rate must be between 0% and 50%");
        }
        if (loan.getTenureMonths() == null || loan.getTenureMonths() <= 0) {
            throw new IllegalArgumentException("Tenure months must be greater than zero");
        }
        if (loan.getStartDate() == null) {
            throw new IllegalArgumentException("Start date is required");
        }
        if (loan.getEmisPaid() != null && loan.getEmisPaid() < 0) {
            throw new IllegalArgumentException("EMIs paid cannot be negative");
        }
    }

    private Map<String, Object> toDto(Loan loan) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", loan.getId());
        dto.put("name", loan.getName());
        dto.put("lender", loan.getLender());
        dto.put("principal_amount", loan.getPrincipalAmount());
        dto.put("annual_rate", loan.getAnnualRate());
        dto.put("tenure_months", loan.getTenureMonths());
        dto.put("start_date", loan.getStartDate().toString());
        dto.put("emi_amount", loan.getEmiAmount());
        dto.put("emis_paid", loan.getEmisPaid());
        dto.put("is_closed", loan.getIsClosed());
        dto.put("closed_at", loan.getClosedAt() != null ? loan.getClosedAt().toString() : null);
        dto.put("notes", loan.getNotes());
        dto.put("created_at", loan.getCreatedAt() != null ? loan.getCreatedAt().toString() : null);

        dto.put("expense_category", categoryToDto(loan.getExpenseCategory()));
        dto.put("expense_subcategory", subCategoryToDto(loan.getExpenseSubCategory()));
        dto.put("expense_item", itemToDto(loan.getExpenseItem()));

        List<LoanPartPayment> pps = loanPartPaymentRepository.findAllByLoanOrderByPaymentDateAsc(loan);
        dto.put("summary", calculateLoanSummary(loan, pps));

        List<Map<String, Object>> ppsDtos = pps.stream().map(pp -> {
            Map<String, Object> ppMap = new LinkedHashMap<>();
            ppMap.put("id", pp.getId());
            ppMap.put("amount", pp.getAmount());
            ppMap.put("payment_date", pp.getPaymentDate().toString());
            ppMap.put("notes", pp.getNotes());
            ppMap.put("linked_expense_id", pp.getLinkedExpenseId());
            return ppMap;
        }).collect(Collectors.toList());
        dto.put("part_payments", ppsDtos);

        return dto;
    }

    private Map<String, Object> categoryToDto(Category c) {
        if (c == null)
            return null;
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", c.getId());
        dto.put("name", c.getName());
        return dto;
    }

    private Map<String, Object> subCategoryToDto(SubCategory sc) {
        if (sc == null)
            return null;
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", sc.getId());
        dto.put("name", sc.getName());
        return dto;
    }

    private Map<String, Object> itemToDto(Item item) {
        if (item == null)
            return null;
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", item.getId());
        dto.put("name", item.getName());
        return dto;
    }
}
