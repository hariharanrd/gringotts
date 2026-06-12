package com.luna.Gringotts.controller;

import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.records.TransactionGroup;
import com.luna.Gringotts.services.TransactionGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class TransactionGroupController {

    @Autowired
    private TransactionGroupService transactionGroupService;

    @GetMapping("/transaction-groups")
    public ResponseEntity<Map<String, Object>> getAllGroups() {
        List<TransactionGroup> groups = transactionGroupService.getAllGroups();
        Map<String, Object> response = new HashMap<>();
        response.put("data", groups);
        response.put("total_count", groups.size());
        response.put("has_more", false);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/transaction-groups/{id}")
    public ResponseEntity<Map<String, Object>> getGroupById(@PathVariable Long id) {
        TransactionGroup group = transactionGroupService.getGroupById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found or access denied"));
        return ResponseEntity.ok(Map.of("data", group, "status", "success"));
    }

    @PostMapping("/transaction-groups")
    public ResponseEntity<Map<String, Object>> createGroup(@RequestBody TransactionGroup group) {
        TransactionGroup created = transactionGroupService.createGroup(group);
        return ResponseEntity.ok(Map.of("data", created, "status", "success"));
    }

    @PutMapping("/transaction-groups/{id}")
    public ResponseEntity<Map<String, Object>> updateGroup(@PathVariable Long id, @RequestBody TransactionGroup group) {
        TransactionGroup updated = transactionGroupService.updateGroup(id, group);
        return ResponseEntity.ok(Map.of("data", updated, "status", "success"));
    }

    @DeleteMapping("/transaction-groups/{id}")
    public ResponseEntity<Map<String, Object>> deleteGroup(@PathVariable Long id) {
        transactionGroupService.deleteGroup(id);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Group deleted successfully"));
    }

    @GetMapping("/transaction-groups/{id}/transactions")
    public ResponseEntity<Map<String, Object>> getGroupTransactions(@PathVariable Long id) {
        List<Transaction> transactions = transactionGroupService.getGroupTransactions(id);
        Map<String, Object> response = new HashMap<>();
        response.put("data", transactions);
        response.put("total_count", transactions.size());
        response.put("has_more", false);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/transaction-groups/{id}/statistics")
    public ResponseEntity<Map<String, Object>> getGroupStatistics(@PathVariable Long id) {
        Map<String, Object> stats = transactionGroupService.getGroupStatistics(id);
        return ResponseEntity.ok(Map.of("data", stats, "status", "success"));
    }
}
