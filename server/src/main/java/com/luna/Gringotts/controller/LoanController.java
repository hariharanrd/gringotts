package com.luna.Gringotts.controller;

import com.luna.Gringotts.records.Loan;
import com.luna.Gringotts.records.LoanPartPayment;
import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.repository.TransactionRepository;
import com.luna.Gringotts.services.LoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class LoanController {

    @Autowired
    private LoanService loanService;

    @Autowired
    private TransactionRepository<Transaction> transactionRepository;

    @GetMapping("/loans")
    public ResponseEntity<Map<String, Object>> getAllLoans() {
        List<Map<String, Object>> loans = loanService.getAllLoans();
        Map<String, Object> response = new HashMap<>();
        response.put("data", loans);
        response.put("total_count", loans.size());
        response.put("has_more", false);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/loans/{id}")
    public ResponseEntity<Map<String, Object>> getLoanById(@PathVariable Long id) {
        Map<String, Object> loan = loanService.getLoanById(id);
        return ResponseEntity.ok(Map.of("data", loan, "status", "success"));
    }

    @PostMapping("/loans")
    public ResponseEntity<Map<String, Object>> createLoan(@RequestBody Loan loan) {
        Map<String, Object> created = loanService.createLoan(loan);
        return ResponseEntity.ok(Map.of("data", created, "status", "success"));
    }

    @PutMapping("/loans/{id}")
    public ResponseEntity<Map<String, Object>> updateLoan(@PathVariable Long id, @RequestBody Loan loan) {
        Map<String, Object> updated = loanService.updateLoan(id, loan);
        return ResponseEntity.ok(Map.of("data", updated, "status", "success"));
    }

    @DeleteMapping("/loans/{id}")
    public ResponseEntity<Map<String, Object>> deleteLoan(@PathVariable Long id) {
        loanService.deleteLoan(id);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Loan deleted successfully"));
    }

    @PostMapping("/loans/{id}/close")
    public ResponseEntity<Map<String, Object>> closeLoan(@PathVariable Long id) {
        Map<String, Object> closed = loanService.closeLoan(id);
        return ResponseEntity.ok(Map.of("data", closed, "status", "success"));
    }

    @PostMapping("/loans/{id}/mark-emi-paid")
    public ResponseEntity<Map<String, Object>> markEmiPaid(@PathVariable Long id, @RequestBody Map<String, Integer> payload) {
        int count = payload.getOrDefault("count", 1);
        Map<String, Object> updated = loanService.markEmiPaid(id, count);
        return ResponseEntity.ok(Map.of("data", updated, "status", "success"));
    }

    @GetMapping("/loans/{id}/amortization")
    public ResponseEntity<Map<String, Object>> getAmortizationSchedule(@PathVariable Long id) {
        List<Map<String, Object>> schedule = loanService.getAmortizationSchedule(id);
        Map<String, Object> response = new HashMap<>();
        response.put("data", schedule);
        response.put("total_count", schedule.size());
        response.put("has_more", false);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/loans/{id}/simulate")
    public ResponseEntity<Map<String, Object>> simulateEarlyClosure(@PathVariable Long id, @RequestParam("target_months") int targetMonths) {
        Map<String, Object> simulation = loanService.simulateEarlyClosure(id, targetMonths);
        return ResponseEntity.ok(Map.of("data", simulation, "status", "success"));
    }

    // ── Part Payment Endpoints ──────────────────────────────────────────────────

    @PostMapping("/loans/{id}/part-payments")
    public ResponseEntity<Map<String, Object>> addPartPayment(@PathVariable Long id, @RequestBody LoanPartPayment partPayment) {
        Map<String, Object> updatedLoan = loanService.addPartPayment(id, partPayment);
        return ResponseEntity.ok(Map.of("data", updatedLoan, "status", "success"));
    }

    @GetMapping("/loans/{id}/part-payments")
    public ResponseEntity<Map<String, Object>> getPartPayments(@PathVariable Long id) {
        List<Map<String, Object>> payments = loanService.getPartPayments(id);
        return ResponseEntity.ok(Map.of("data", payments, "total_count", payments.size(), "status", "success"));
    }

    @DeleteMapping("/loans/part-payments/{paymentId}")
    public ResponseEntity<Map<String, Object>> deletePartPayment(@PathVariable Long paymentId) {
        Map<String, Object> updatedLoan = loanService.deletePartPayment(paymentId);
        return ResponseEntity.ok(Map.of("data", updatedLoan, "status", "success"));
    }

    // ── LOAN TRANSACTIONS ──────────────────────────────────────────────────────

    @GetMapping("/loans/{id}/transactions")
    public ResponseEntity<Map<String, Object>> getLoanTransactions(
            @PathVariable Long id,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        try {
            Loan loan = loanService.requireLoan(id);
            Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "transactionTime"));
            Page<Transaction> result = transactionRepository.findByFundingLoanAndUser(loan, loan.getUser(), pageable);
            return ResponseEntity.ok(Map.of(
                    "data", result.getContent(),
                    "total_count", result.getTotalElements(),
                    "has_more", result.hasNext()));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }
}
