package com.luna.Gringotts.controller;


import com.luna.Gringotts.parsers.APayCCStatementParser;
import com.luna.Gringotts.parsers.HDFCCCStatementParser;
import com.luna.Gringotts.parsers.HDFCStatementParser;
import com.luna.Gringotts.parsers.StatementParser;
import com.luna.Gringotts.records.Expense;
import com.luna.Gringotts.records.Income;
import com.luna.Gringotts.records.Saving;
import com.luna.Gringotts.records.Revolving;
import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.records.TimeRange;
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

    @Autowired
    private com.luna.Gringotts.services.ExportService exportService;

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
    public ResponseEntity<Map<String, Object>> getSummary(@RequestParam(value = "range", defaultValue = "LAST_30_DAYS") TimeRange range) {
        Map<String, Object> summary = transactionService.getSummary(range);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/transactions")
    public ResponseEntity<Map<String, Object>> getTransactions(
            @RequestParam("page") int page,
            @RequestParam(value = "filters", required = false) String filtersJson,
            @RequestParam(value = "direction", defaultValue = "DESC") String direction) {
        Pageable pageable = PageRequest.of(page - 1, 10, Sort.by(Sort.Direction.fromString(direction), "transactionTime"));
        List<com.luna.Gringotts.records.SearchCriteria> filters = parseFilters(filtersJson);
        Page<Transaction> result = transactionService.getTransactions(filters, pageable);
        HashMap<String, Object> map = new HashMap<>();
        map.put("data", result.getContent());
        map.put("total_count", result.getTotalElements());
        map.put("page", pageable.getPageNumber() + 1);
        map.put("has_more", result.hasNext());
        return ResponseEntity.ok(map);
    }

    @GetMapping("/transactions/export")
    public ResponseEntity<byte[]> exportTransactions(
            @RequestParam("format") String format,
            @RequestParam(value = "type", defaultValue = "all") String type,
            @RequestParam(value = "startDate", required = false) String startDateStr,
            @RequestParam(value = "endDate", required = false) String endDateStr,
            @RequestParam(value = "filters", required = false) String filtersJson) {

        if (!"csv".equalsIgnoreCase(format) && !"xlsx".equalsIgnoreCase(format)) {
            return ResponseEntity.badRequest().body("Invalid format. Must be csv or xlsx".getBytes());
        }

        java.time.LocalDate startDate = null;
        java.time.LocalDate endDate = null;
        try {
            if (startDateStr != null && !startDateStr.trim().isEmpty()) {
                startDate = java.time.LocalDate.parse(startDateStr);
            }
            if (endDateStr != null && !endDateStr.trim().isEmpty()) {
                endDate = java.time.LocalDate.parse(endDateStr);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid date format. Must be YYYY-MM-DD".getBytes());
        }

        List<com.luna.Gringotts.records.SearchCriteria> filters = parseFilters(filtersJson);
        List<Transaction> transactions = transactionService.getTransactionsForExport(type, startDate, endDate, filters);

        byte[] fileBytes;
        String contentType;
        String filename;

        String dateStr = java.time.LocalDate.now().toString();
        if ("csv".equalsIgnoreCase(format)) {
            fileBytes = exportService.exportAsCsv(transactions);
            contentType = "text/csv; charset=UTF-8";
            filename = "transactions_" + dateStr + ".csv";
        } else {
            fileBytes = exportService.exportAsXlsx(transactions);
            contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            filename = "transactions_" + dateStr + ".xlsx";
        }

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .header("Content-Type", contentType)
                .body(fileBytes);
    }

    @GetMapping("/expenses")
    public ResponseEntity<Map<String, Object>> getExpenses(
            @RequestParam("page") int page,
            @RequestParam(value = "filters", required = false) String filtersJson,
            @RequestParam(value = "direction", defaultValue = "DESC") String direction){
        Pageable pageable = PageRequest.of(page - 1, 10, Sort.by(Sort.Direction.fromString(direction), "transactionTime"));
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

    @GetMapping("/savings/{id}")
    public ResponseEntity<Saving> getSavingById(@PathVariable Long id) {
        Saving saving = transactionService.getSavingById(id);
        if (saving == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(saving);
    }

    @PostMapping("/expenses")
    public ResponseEntity<Map<String,Object>> addExpense(@RequestBody Expense expense) {
        transactionService.saveExpense(expense);
        return ResponseEntity.ok(Map.of("data", expense));
    }

    @PutMapping("/expenses/{id}")
    @Transactional
    public ResponseEntity<Map<String,Object>> updateExpense(@PathVariable Long id, @RequestBody Expense expense) {
        Expense saved = transactionService.updateToExpense(id, expense);
        return ResponseEntity.ok(Map.of("data", saved));
    }

    @GetMapping("/incomes")
    public ResponseEntity<Map<String, Object>> getIncomes(
            @RequestParam("page") int page,
            @RequestParam(value = "filters", required = false) String filtersJson,
            @RequestParam(value = "direction", defaultValue = "DESC") String direction) {
        Pageable pageable = PageRequest.of(page-1, 10, Sort.by(Sort.Direction.fromString(direction), "transactionTime"));
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
    public ResponseEntity<Map<String,Object>> addIncome(@RequestBody Income income) {
        transactionService.saveIncome(income);
        return ResponseEntity.ok(Map.of("data", income));
    }

    @PutMapping("/incomes/{id}")
    @Transactional
    public ResponseEntity<Map<String,Object>> updateIncome(@PathVariable Long id, @RequestBody Income income) {
        Income saved = transactionService.updateToIncome(id, income);
        return ResponseEntity.ok(Map.of("data", saved));
    }

    @GetMapping("/savings")
    public ResponseEntity<Map<String, Object>> getSavings(
            @RequestParam("page") int page,
            @RequestParam(value = "filters", required = false) String filtersJson,
            @RequestParam(value = "direction", defaultValue = "DESC") String direction) {
        Pageable pageable = PageRequest.of(page-1, 10, Sort.by(Sort.Direction.fromString(direction), "transactionTime"));
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
    public ResponseEntity<Map<String,Object>> addSaving(@RequestBody Saving saving) {
        transactionService.saveSaving(saving);
        return ResponseEntity.ok(Map.of("data", saving));
    }

    @PutMapping("/savings/{id}")
    @Transactional
    public ResponseEntity<Map<String,Object>> updateSaving(@PathVariable Long id, @RequestBody Saving saving) {
        Saving saved = transactionService.updateToSaving(id, saving);
        return ResponseEntity.ok(Map.of("data", saved));
    }

    @GetMapping("/revolvings")
    public ResponseEntity<Map<String, Object>> getRevolvings(
            @RequestParam("page") int page,
            @RequestParam(value = "filters", required = false) String filtersJson,
            @RequestParam(value = "direction", defaultValue = "DESC") String direction) {
        Pageable pageable = PageRequest.of(page-1, 10, Sort.by(Sort.Direction.fromString(direction), "transactionTime"));
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
    public ResponseEntity<Map<String,Object>> addRevolving(@RequestBody Revolving revolving) {
        transactionService.saveRevolving(revolving);
        return ResponseEntity.ok(Map.of("data", revolving));
    }

    @PutMapping("/revolvings/{id}")
    @Transactional
    public ResponseEntity<Map<String,Object>> updateRevolving(@PathVariable Long id, @RequestBody Revolving revolving) {
        Revolving saved = transactionService.updateToRevolving(id, revolving);
        return ResponseEntity.ok(Map.of("data", saved));
    }


    @PutMapping("/transactions")
    public ResponseEntity<Map<String, String>> bulkUpdate(
            @RequestParam("ids") List<Long> transactionIds,
            @RequestBody Map<String, Object> fields) {
        transactionService.bulkUpdateFields(transactionIds, fields);
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/transactions")
    public ResponseEntity<Map<String, String>> bulkDelete(@RequestParam("ids") List<Long> transactionIds) {
        transactionService.bulkDelete(transactionIds);
        return ResponseEntity.ok(Map.of("status", "success"));
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
