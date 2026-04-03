package com.luna.Gringotts.controlller;


import com.luna.Gringotts.parsers.APayCCStatementParser;
import com.luna.Gringotts.parsers.HDFCCCStatementParser;
import com.luna.Gringotts.parsers.HDFCStatementParser;
import com.luna.Gringotts.parsers.StatementParser;
import com.luna.Gringotts.records.Expense;
import com.luna.Gringotts.records.Income;
import com.luna.Gringotts.records.Saving;
import com.luna.Gringotts.records.Revolving;
import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.services.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.logging.Level;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/v1")
public class TransactionController {

    private static final Logger LOGGER = Logger.getLogger(TransactionController.class.getName());

    @Autowired
    private TransactionService transactionService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private List<com.luna.Gringotts.records.SearchCriteria> parseFilters(String filtersJson) {
        if (filtersJson == null || filtersJson.trim().isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(filtersJson, new TypeReference<List<com.luna.Gringotts.records.SearchCriteria>>() {});
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "Failed to parse filters: " + filtersJson, e);
            return new ArrayList<>();
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(@RequestParam(value = "days", defaultValue = "30") int days) {
        Map<String, Object> summary = transactionService.getSummary(days);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/expenses")
    public ResponseEntity<Map<String, Object>> getExpenses(
            @RequestParam("page") int page,
            @RequestParam(value = "filters", required = false) String filtersJson){
        Pageable pageable = PageRequest.of(page - 1, 10, Sort.by(Sort.Direction.DESC, "transactionTime"));
        List<com.luna.Gringotts.records.SearchCriteria> filters = parseFilters(filtersJson);
        Page<Expense> result = transactionService.getExpenses(filters, pageable);
        HashMap<String,Object> map = new HashMap<>();
        map.put("data",result.getContent());
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
    @Transactional
    public ResponseEntity<Map<String,String>> updateExpense(@PathVariable Long id, @RequestBody Expense expense) {
        Transaction existing = transactionService.getTransactionById(id);
        if (existing != null && !(existing instanceof Expense)) {
            transactionService.deleteTransaction(id);
            expense.setId(null);
        } else {
            expense.setId(id);
        }
        transactionService.saveExpense(expense);
        return ResponseEntity.ok(Map.of("status","success"));
    }

    @GetMapping("/incomes")
    public ResponseEntity<Map<String, Object>> getIncomes(
            @RequestParam("page") int page,
            @RequestParam(value = "filters", required = false) String filtersJson) {
        Pageable pageable = PageRequest.of(page-1, 10, Sort.by(Sort.Direction.DESC, "transactionTime"));
        List<com.luna.Gringotts.records.SearchCriteria> filters = parseFilters(filtersJson);
        Page<Income> result = transactionService.getIncomes(filters, pageable);
        HashMap<String, Object> map = new HashMap<>();
        map.put("data", result.getContent());
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
    @Transactional
    public ResponseEntity<Map<String,String>> updateIncome(@PathVariable Long id, @RequestBody Income income) {
        Transaction existing = transactionService.getTransactionById(id);
        if (existing != null && !(existing instanceof Income)) {
            transactionService.deleteTransaction(id);
            income.setId(null);
        } else {
            income.setId(id);
        }
        transactionService.saveIncome(income);
        return ResponseEntity.ok(Map.of("status","success"));
    }

    @GetMapping("/savings")
    public ResponseEntity<Map<String, Object>> getSavings(
            @RequestParam("page") int page,
            @RequestParam(value = "filters", required = false) String filtersJson) {
        Pageable pageable = PageRequest.of(page-1, 10, Sort.by(Sort.Direction.DESC, "transactionTime"));
        List<com.luna.Gringotts.records.SearchCriteria> filters = parseFilters(filtersJson);
        Page<Saving> result = transactionService.getSavings(filters, pageable);
        HashMap<String, Object> map = new HashMap<>();
        map.put("data", result.getContent());
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
    @Transactional
    public ResponseEntity<Saving> updateSaving(@PathVariable Long id, @RequestBody Saving saving) {
        Transaction existing = transactionService.getTransactionById(id);
        if (existing != null && !(existing instanceof Saving)) {
            transactionService.deleteTransaction(id);
            saving.setId(null);
        } else {
            saving.setId(id);
        }
        transactionService.saveSaving(saving);
        return ResponseEntity.ok(saving);
    }

    @GetMapping("/revolvings")
    public ResponseEntity<Map<String, Object>> getRevolvings(
            @RequestParam("page") int page,
            @RequestParam(value = "filters", required = false) String filtersJson) {
        Pageable pageable = PageRequest.of(page-1, 10, Sort.by(Sort.Direction.DESC, "transactionTime"));
        List<com.luna.Gringotts.records.SearchCriteria> filters = parseFilters(filtersJson);
        Page<Revolving> result = transactionService.getRevolvings(filters, pageable);
        HashMap<String, Object> map = new HashMap<>();
        map.put("data", result.getContent());
        map.put("total_count", result.getTotalElements());
        map.put("page", pageable.getPageNumber() + 1);
        map.put("has_more", result.hasNext());
        return ResponseEntity.ok(map);
    }

    @GetMapping("/revolvings/{id}")
    public ResponseEntity<Revolving> getRevolvingById(@PathVariable Long id) {
        Revolving revolving = transactionService.getRevolvingById(id);
        if (revolving == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(revolving);
    }

    @PostMapping("/revolvings")
    public ResponseEntity<Revolving> addRevolving(@RequestBody Revolving revolving) {
        transactionService.saveRevolving(revolving);
        return ResponseEntity.ok(revolving);
    }

    @PutMapping("/revolvings/{id}")
    @Transactional
    public ResponseEntity<Revolving> updateRevolving(@PathVariable Long id, @RequestBody Revolving revolving) {
        Transaction existing = transactionService.getTransactionById(id);
        if (existing != null && !(existing instanceof Revolving)) {
            transactionService.deleteTransaction(id);
            revolving.setId(null);
        } else {
            revolving.setId(id);
        }
        transactionService.saveRevolving(revolving);
        return ResponseEntity.ok(revolving);
    }


    @PutMapping("/transactions/bulk-update-category")
    public ResponseEntity<Map<String, String>> bulkUpdateCategory(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Integer> rawIds = (List<Integer>) request.get("transaction_ids");
        List<Long> transactionIds = rawIds.stream().map(Integer::longValue).toList();
        Long categoryId = ((Number) request.get("category_id")).longValue();
        transactionService.bulkUpdateCategory(transactionIds, categoryId);
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file, @RequestParam("type") String type) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "File is empty"));
        }

        try {
            File tempFile = File.createTempFile("upload", file.getOriginalFilename());
            file.transferTo(tempFile);

            StatementParser parser;
            if ("HDFC".equalsIgnoreCase(type)) {
                parser = new HDFCStatementParser(tempFile.getAbsolutePath());
            } else if ("APayCC".equalsIgnoreCase(type)) {
                parser = new APayCCStatementParser(tempFile.getAbsolutePath());
            } else if ("HDFCCC".equalsIgnoreCase(type)) {
                parser = new HDFCCCStatementParser(tempFile.getAbsolutePath());
            } else {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Invalid type"));
            }

            parser.parseStatement();
            List<Transaction> transactions = parser.getTransactions();
            transactionService.saveTransactions(transactions);

            if (!tempFile.delete()) {
                LOGGER.log(Level.WARNING, "Failed to delete temp file: {0}", tempFile.getAbsolutePath());
            }

            return ResponseEntity.ok(Map.of("status", "success", "message", "Transactions imported successfully"));

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("status", "error", "message", "Failed to upload file"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("status", "error", "message", "Failed to parse file: " + e.getMessage()));
        }
    }
}
