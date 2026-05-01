package com.luna.Gringotts.services;

import com.luna.Gringotts.records.*;
import com.luna.Gringotts.repository.CreditCardBillRepository;
import com.luna.Gringotts.repository.CreditCardRepository;
import com.luna.Gringotts.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CreditCardService {

    @Autowired
    private CreditCardRepository creditCardRepository;

    @Autowired
    private CreditCardBillRepository creditCardBillRepository;

    @Autowired
    private IAMService iamService;

    @Autowired
    private TransactionRepository<Transaction> transactionRepository;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getAllCards() {
        User user = iamService.getCurrentUser();
        List<CreditCard> cards = creditCardRepository.findAllByUserOrderByCreatedAtDesc(user);
        return cards.stream().map(this::toDto).collect(Collectors.toList());
    }

    public Map<String, Object> getCardById(Long id) {
        CreditCard card = requireCard(id);
        Map<String, Object> dto = toDto(card);
        List<CreditCardBill> bills = creditCardBillRepository.findAllByCreditCardOrderByBillingYearDescBillingMonthDesc(card);
        
        List<Map<String, Object>> billDtos = bills.stream().map(bill -> {
            Map<String, Object> billDto = new LinkedHashMap<>();
            billDto.put("id", bill.getId());
            billDto.put("billing_month", bill.getBillingMonth());
            billDto.put("billing_year", bill.getBillingYear());
            billDto.put("amount_due", bill.getAmountDue());
            billDto.put("amount_paid", bill.getAmountPaid());
            billDto.put("payment_status", bill.getPaymentStatus());
            billDto.put("created_at", bill.getCreatedAt());

            // Calculate category-wise spending
            billDto.put("category_spending", getCategorySpendingForBill(card, bill));
            
            return billDto;
        }).collect(Collectors.toList());

        dto.put("bills", billDtos);
        return dto;
    }

    @Transactional
    public Map<String, Object> createCard(CreditCard card) {
        card.setUser(iamService.getCurrentUser());
        if (card.getThresholdPercentage() == null) card.setThresholdPercentage(80);
        return toDto(creditCardRepository.save(card));
    }

    @Transactional
    public Map<String, Object> updateCard(Long id, CreditCard incoming) {
        CreditCard existing = requireCard(id);
        existing.setNickname(incoming.getNickname());
        existing.setIssuer(incoming.getIssuer());
        existing.setBillingDate(incoming.getBillingDate());
        existing.setDueDate(incoming.getDueDate());
        existing.setCreditLimit(incoming.getCreditLimit());
        existing.setThresholdPercentage(incoming.getThresholdPercentage());
        return toDto(creditCardRepository.save(existing));
    }

    @Transactional
    public void deleteCard(Long id) {
        requireCard(id);
        creditCardRepository.deleteById(id);
    }

    // ── Bill Management ───────────────────────────────────────────────────────

    @Transactional
    public void updateBillPayment(Long billId, Double amountPaid) {
        CreditCardBill bill = creditCardBillRepository.findById(billId)
                .orElseThrow(() -> new NoSuchElementException("Bill not found: " + billId));
        
        // Ownership check
        requireCard(bill.getCreditCard().getId());

        bill.setAmountPaid(amountPaid);
        
        if (amountPaid >= bill.getAmountDue()) {
            bill.setPaymentStatus("PAID");
        } else if (amountPaid > 0) {
            bill.setPaymentStatus("PARTIALLY_PAID");
        } else {
            bill.setPaymentStatus("UNPAID");
        }
        
        creditCardBillRepository.save(bill);
    }

    // ── Billing Cycle Logic ──────────────────────────────────────────────────

    public void addTransactionToBill(Transaction transaction) {
        if (transaction.getCreditCard() == null) return;
        CreditCard card = creditCardRepository.findById(transaction.getCreditCard().getId()).orElse(null);
        if (card == null) return;

        Cycle cycle = getBillingCycle(card, transaction.getTransactionTime());
        CreditCardBill bill = creditCardBillRepository.findByCreditCardAndBillingMonthAndBillingYear(card, cycle.month, cycle.year)
                .orElseGet(() -> {
                    CreditCardBill newBill = new CreditCardBill();
                    newBill.setCreditCard(card);
                    newBill.setBillingMonth(cycle.month);
                    newBill.setBillingYear(cycle.year);
                    return newBill;
                });

        double delta = 0;
        if (transaction instanceof Expense) {
            delta = transaction.getValue();
        } else if (transaction instanceof Income) {
            delta = -transaction.getValue();
        } else if (transaction instanceof Saving) {
            Saving s = (Saving) transaction;
            delta = Boolean.TRUE.equals(s.getIsIn()) ? transaction.getValue() : -transaction.getValue();
        } else if (transaction instanceof Revolving) {
            Revolving r = (Revolving) transaction;
            delta = Boolean.TRUE.equals(r.getIsGive()) ? transaction.getValue() : -transaction.getValue();
        }

        bill.setAmountDue(bill.getAmountDue() + delta);
        resolveStatus(bill);
        creditCardBillRepository.save(bill);
    }

    public void removeTransactionFromBill(Transaction transaction) {
        if (transaction.getCreditCard() == null) return;
        CreditCard card = creditCardRepository.findById(transaction.getCreditCard().getId()).orElse(null);
        if (card == null) return;

        Cycle cycle = getBillingCycle(card, transaction.getTransactionTime());
        creditCardBillRepository.findByCreditCardAndBillingMonthAndBillingYear(card, cycle.month, cycle.year)
                .ifPresent(bill -> {
                    double delta = 0;
                    if (transaction instanceof Expense) {
                        delta = transaction.getValue();
                    } else if (transaction instanceof Income) {
                        delta = -transaction.getValue();
                    } else if (transaction instanceof Saving) {
                        Saving s = (Saving) transaction;
                        delta = Boolean.TRUE.equals(s.getIsIn()) ? transaction.getValue() : -transaction.getValue();
                    } else if (transaction instanceof Revolving) {
                        Revolving r = (Revolving) transaction;
                        delta = Boolean.TRUE.equals(r.getIsGive()) ? transaction.getValue() : -transaction.getValue();
                    }

                    bill.setAmountDue(Math.max(0.0, bill.getAmountDue() - delta));
                    resolveStatus(bill);
                    creditCardBillRepository.save(bill);
                });
    }

    private void resolveStatus(CreditCardBill bill) {
        if (bill.getAmountPaid() >= bill.getAmountDue() && bill.getAmountDue() > 0) {
            bill.setPaymentStatus("PAID");
        } else if (bill.getAmountPaid() > 0) {
            bill.setPaymentStatus("PARTIALLY_PAID");
        } else {
            bill.setPaymentStatus("UNPAID");
        }
    }

    private static class Cycle {
        int month;
        int year;
        Cycle(int m, int y) { this.month = m; this.year = y; }
    }

    private Cycle getBillingCycle(CreditCard card, LocalDateTime transactionTime) {
        LocalDate date = transactionTime.toLocalDate();
        int day = date.getDayOfMonth();
        int month = date.getMonthValue();
        int year = date.getYear();

        if (day > card.getBillingDate()) {
            // Belongs to previous cycle
            month++;
            if (month == 12) {
                month = 1;
                year++;
            }
        }
        return new Cycle(month, year);
    }

    // ── DTO Helper ────────────────────────────────────────────────────────────

    private Map<String, Object> toDto(CreditCard card) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", card.getId());
        dto.put("nickname", card.getNickname());
        dto.put("issuer", card.getIssuer());
        dto.put("billing_date", card.getBillingDate());
        dto.put("due_date", card.getDueDate());
        dto.put("credit_limit", card.getCreditLimit());
        dto.put("threshold_percentage", card.getThresholdPercentage());
        dto.put("created_at", card.getCreatedAt());

        Cycle currentCycle = getBillingCycle(card, LocalDateTime.now());
        Optional<CreditCardBill> currentBillOpt = creditCardBillRepository.findByCreditCardAndBillingMonthAndBillingYear(card, currentCycle.month, currentCycle.year);
        
        if (currentBillOpt.isPresent()) {
            CreditCardBill currentBill = currentBillOpt.get();
            dto.put("current_bill", currentBill);
            double utilization = (currentBill.getAmountDue() / card.getCreditLimit()) * 100.0;
            dto.put("utilization_percent", Math.round(utilization * 10.0) / 10.0);
            dto.put("threshold_exceeded", utilization >= card.getThresholdPercentage());
        } else {
            dto.put("current_bill", null);
            dto.put("utilization_percent", 0.0);
            dto.put("threshold_exceeded", false);
        }

        // Total outstanding across all unpaid/partially paid bills
        List<CreditCardBill> allBills = creditCardBillRepository.findAllByCreditCardOrderByBillingYearDescBillingMonthDesc(card);
        double totalOutstanding = allBills.stream()
                .filter(b -> !"PAID".equals(b.getPaymentStatus()))
                .mapToDouble(b -> b.getAmountDue() - b.getAmountPaid())
                .sum();
        dto.put("total_outstanding", totalOutstanding);

        // Smart Status Logic
        dto.put("smart_status", getSmartStatus(card, allBills));

        return dto;
    }

    private Map<String, Object> getSmartStatus(CreditCard card, List<CreditCardBill> allBills) {
        LocalDate today = LocalDate.now();
        
        // Filter for statements already generated (today >= statement date)
        List<CreditCardBill> billedStatements = allBills.stream()
                .filter(bill -> {
                    LocalDate statementDate = LocalDate.of(bill.getBillingYear(), bill.getBillingMonth(), card.getBillingDate());
                    return !today.isBefore(statementDate);
                })
                .collect(Collectors.toList());

        // Find oldest unpaid billed statement
        List<CreditCardBill> unpaidBilled = billedStatements.stream()
                .filter(b -> !"PAID".equals(b.getPaymentStatus()))
                .sorted(Comparator.comparingInt(CreditCardBill::getBillingYear)
                        .thenComparingInt(CreditCardBill::getBillingMonth))
                .collect(Collectors.toList());

        Map<String, Object> status = new LinkedHashMap<>();

        if (!unpaidBilled.isEmpty()) {
            CreditCardBill oldestUnpaid = unpaidBilled.get(0);
            
            int dueMonth = oldestUnpaid.getBillingMonth();
            int dueYear = oldestUnpaid.getBillingYear();
            if (card.getBillingDate() > card.getDueDate()) {
                dueMonth++;
                if (dueMonth > 12) {
                    dueMonth = 1;
                    dueYear++;
                }
            }
            
            LocalDate dueDate = LocalDate.of(dueYear, dueMonth, card.getDueDate());
            boolean isOverdue = today.isAfter(dueDate);
            double unpaidAmount = oldestUnpaid.getAmountDue() - oldestUnpaid.getAmountPaid();

            if (isOverdue) {
                status.put("type", "overdue");
                status.put("label", "Overdue");
                status.put("amount", unpaidAmount);
            } else {
                status.put("type", "pending");
                status.put("label", "Bill Pending");
                status.put("amount", unpaidAmount);
            }
            return status;
        }

        // If all generated statements are paid
        if (!billedStatements.isEmpty() && billedStatements.stream().allMatch(b -> "PAID".equals(b.getPaymentStatus()))) {
            status.put("type", "paid");
            status.put("label", "Last Bill Paid");
            return status;
        }

        status.put("type", "next");
        status.put("label", "Next Bill");
        status.put("date", card.getBillingDate());
        return status;
    }

    private List<Map<String, Object>> getCategorySpendingForBill(CreditCard card, CreditCardBill bill) {
        LocalDateTime[] range = getCycleStartAndEnd(card, bill.getBillingMonth(), bill.getBillingYear());
        List<Transaction> txns = transactionRepository.findByUserAndCreditCardAndTransactionTimeBetween(
                iamService.getCurrentUser(), card, range[0], range[1]);

        Map<String, Double> spendingMap = new HashMap<>();
        for (Transaction t : txns) {
            String categoryName = (t.getCategory() != null) ? t.getCategory().getName() : "Uncategorized";
            double value = t.getValue();
            
            // For credit cards, Expenses increase the due amount, Incomes/Payments decrease it
            // We want to show spending, so we focus on positive values (Expenses)
            // But let's follow the same delta logic as addTransactionToBill
            double delta = 0;
            if (t instanceof Expense) {
                delta = t.getValue();
            } else if (t instanceof Income) {
                delta = -t.getValue();
            } else if (t instanceof Saving) {
                Saving s = (Saving) t;
                delta = Boolean.TRUE.equals(s.getIsIn()) ? t.getValue() : -t.getValue();
            } else if (t instanceof Revolving) {
                Revolving r = (Revolving) t;
                delta = Boolean.TRUE.equals(r.getIsGive()) ? t.getValue() : -t.getValue();
            }

            if (delta > 0) { // Only count spending
                spendingMap.put(categoryName, spendingMap.getOrDefault(categoryName, 0.0) + delta);
            }
        }

        return spendingMap.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", entry.getKey());
                    item.put("value", entry.getValue());
                    return item;
                })
                .sorted((a, b) -> Double.compare((Double) b.get("value"), (Double) a.get("value")))
                .collect(Collectors.toList());
    }

    private LocalDateTime[] getCycleStartAndEnd(CreditCard card, int month, int year) {
        LocalDateTime end = LocalDateTime.of(year, month, card.getBillingDate(), 23, 59, 59);
        LocalDateTime start = end.minusMonths(1).plusDays(1).withHour(0).withMinute(0).withSecond(0);
        return new LocalDateTime[]{start, end};
    }

    private CreditCard requireCard(Long id) {
        User user = iamService.getCurrentUser();
        CreditCard card = creditCardRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Credit card not found: " + id));
        if (!card.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Access denied to credit card: " + id);
        }
        return card;
    }
}
