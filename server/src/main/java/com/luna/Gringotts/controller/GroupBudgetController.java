package com.luna.Gringotts.controller;

import com.luna.Gringotts.records.GroupBudget;
import com.luna.Gringotts.services.GroupBudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/transaction-groups/{groupId}/budget")
public class GroupBudgetController {

    @Autowired
    private GroupBudgetService groupBudgetService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getGroupBudget(
            @PathVariable Long groupId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        GroupBudget budget = groupBudgetService.getGroupBudget(groupId, month, year).orElse(null);
        return ResponseEntity.ok(Map.of("data", budget != null ? budget : Map.of(), "status", "success"));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrUpdateGroupBudget(
            @PathVariable Long groupId,
            @RequestBody GroupBudget budget) {
        GroupBudget saved = groupBudgetService.saveGroupBudget(groupId, budget);
        return ResponseEntity.ok(Map.of("data", saved, "status", "success"));
    }

    @PutMapping("/{budgetId}")
    public ResponseEntity<Map<String, Object>> updateGroupBudget(
            @PathVariable Long groupId,
            @PathVariable Long budgetId,
            @RequestBody GroupBudget budget) {
        budget.setId(budgetId);
        GroupBudget saved = groupBudgetService.saveGroupBudget(groupId, budget);
        return ResponseEntity.ok(Map.of("data", saved, "status", "success"));
    }

    @DeleteMapping("/{budgetId}")
    public ResponseEntity<Map<String, Object>> deleteGroupBudget(
            @PathVariable Long groupId,
            @PathVariable Long budgetId) {
        groupBudgetService.deleteGroupBudget(groupId, budgetId);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Group budget deleted successfully"));
    }

    @GetMapping("/utilization")
    public ResponseEntity<Map<String, Object>> getGroupBudgetUtilization(
            @PathVariable Long groupId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        Map<String, Object> utilization = groupBudgetService.getGroupBudgetUtilization(groupId, month, year);
        return ResponseEntity.ok(Map.of("data", utilization, "status", "success"));
    }
}
