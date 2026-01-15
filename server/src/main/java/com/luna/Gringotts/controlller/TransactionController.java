package com.luna.Gringotts.controlller;


import com.luna.Gringotts.records.Expense;
import com.luna.Gringotts.records.Income;
import com.luna.Gringotts.records.Saving;
import com.luna.Gringotts.services.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @GetMapping("/expenses")
    public ResponseEntity<Map<String, Object>> getExpenses(){
        Pageable pageable = Pageable.ofSize(100);
        Page<Expense> result = transactionService.getExpenses(pageable);
        HashMap<String,Object> map = new HashMap<>();
        map.put("expenses",result.getContent());
        map.put("total_count",result.getTotalElements());
        map.put("page",pageable.getPageNumber()+1);
        map.put("has_more",result.hasNext());
        return ResponseEntity.ok(map);
    }

    @GetMapping("/expenses/{id}")
    public ResponseEntity<Expense> getExpenseById(@PathVariable Long id) {
        Expense expense = transactionService.getExpenseById(id);
        if (expense == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(expense);
    }

    @GetMapping("/incomes/{id}")
    public ResponseEntity<Income> getIncomeById(@PathVariable Long id) {
        Income income = transactionService.getIncomeById(id);
        if (income == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(income);
    }

    @GetMapping
    public ResponseEntity<Saving> getSavingById(@PathVariable Long id) {
        Saving saving = transactionService.getSavingById(id);
        if (saving == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(saving);
    }

    @PostMapping("/expenses")
    public ResponseEntity<Map<String,String>> addExpense(@RequestBody Expense expense) {
        transactionService.saveExpense(expense);
        return ResponseEntity.ok(Map.of("status","success"));
    }

    @PutMapping("/expenses/{id}")
    public ResponseEntity<Map<String,String>> updateExpense(@PathVariable Long id, @RequestBody Expense expense) {
        expense.setId(id);
        transactionService.saveExpense(expense);
        return ResponseEntity.ok(Map.of("status","success"));
    }

    @DeleteMapping("/expenses/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        transactionService.deleteExpense(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/incomes")
    public ResponseEntity<Map<String, Object>> getIncomes() {
        Pageable pageable = Pageable.ofSize(100);
        Page<Income> result = transactionService.getIncomes(pageable);
        HashMap<String, Object> map = new HashMap<>();
        map.put("incomes", result.getContent());
        map.put("total_count", result.getTotalElements());
        map.put("page", pageable.getPageNumber() + 1);
        map.put("has_more", result.hasNext());
        return ResponseEntity.ok(map);
    }

    @PostMapping("/incomes")
    public ResponseEntity<Map<String,String>> addIncome(@RequestBody Income income) {
        transactionService.saveIncome(income);
        return ResponseEntity.ok(Map.of("status","success"));
    }

    @PutMapping("/incomes/{id}")
    public ResponseEntity<Map<String,String>> updateIncome(@PathVariable Long id, @RequestBody Income income) {
        income.setId(id);
        transactionService.saveIncome(income);
        return ResponseEntity.ok(Map.of("status","success"));
    }

    @DeleteMapping("/incomes/{id}")
    public ResponseEntity<Void> deleteIncome(@PathVariable Long id) {
        transactionService.deleteIncome(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/savings")
    public ResponseEntity<Map<String, Object>> getSavings() {
        Pageable pageable = Pageable.ofSize(100);
        Page<Saving> result = transactionService.getSavings(pageable);
        HashMap<String, Object> map = new HashMap<>();
        map.put("savings", result.getContent());
        map.put("total_count", result.getTotalElements());
        map.put("page", pageable.getPageNumber() + 1);
        map.put("has_more", result.hasNext());
        return ResponseEntity.ok(map);
    }

    @PostMapping("/savings")
    public ResponseEntity<Saving> addSaving(@RequestBody Saving saving) {
        transactionService.saveSaving(saving);
        return ResponseEntity.ok(saving);
    }

    @PutMapping("/savings/{id}")
    public ResponseEntity<Saving> updateSaving(@PathVariable Long id, @RequestBody Saving saving) {
        saving.setId(id);
        transactionService.saveSaving(saving);
        return ResponseEntity.ok(saving);
    }

    @DeleteMapping("/savings/{id}")
    public ResponseEntity<Void> deleteSaving(@PathVariable Long id) {
        transactionService.deleteSaving(id);
        return ResponseEntity.ok().build();
    }
}
