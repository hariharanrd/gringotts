package com.luna.Gringotts.controller;

import com.luna.Gringotts.records.Budget;
import com.luna.Gringotts.services.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/budgets")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    // ── GET ───────────────────────────────────────────────────────────────────

    /** List all budgets: master first, then monthly versions newest-first */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllBudgets() {
        List<Budget> budgets = budgetService.getAllBudgets();
        return ResponseEntity.ok(Map.of("data", budgets, "total_count", budgets.size()));
    }

    /** Get the single master budget */
    @GetMapping("/master")
    public ResponseEntity<Map<String, Object>> getMasterBudget() {
        try {
            Budget master = budgetService.getMasterBudget();
            return ResponseEntity.ok(Map.of("data", master));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** Get the active budget for the current month (or master fallback) */
    @GetMapping("/active")
    public ResponseEntity<Map<String, Object>> getActiveBudget() {
        Budget active = budgetService.getActiveBudget();
        if (active == null) {
            return ResponseEntity.ok(Map.of("data", Map.of()));
        }
        return ResponseEntity.ok(Map.of("data", active));
    }

    /** Utilization for the current active month budget */
    @GetMapping("/active/utilization")
    public ResponseEntity<Map<String, Object>> getActiveBudgetUtilization() {
        Map<String, Object> util = budgetService.getActiveBudgetUtilization();
        if (util == null) {
            return ResponseEntity.ok(Map.of("data", Map.of()));
        }
        return ResponseEntity.ok(Map.of("data", util));
    }

    /** Historical utilization for a specific month and year */
    @GetMapping("/historical-utilization")
    public ResponseEntity<Map<String, Object>> getHistoricalUtilization(
            @RequestParam int month,
            @RequestParam int year) {
        Map<String, Object> util = budgetService.getHistoricalUtilization(month, year);
        if (util == null) {
            return ResponseEntity.ok(Map.of("data", Map.of()));
        }
        return ResponseEntity.ok(Map.of("data", util));
    }

    /** Get a specific budget by ID */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getBudgetById(@PathVariable Long id) {
        try {
            Budget budget = budgetService.getBudgetById(id);
            return ResponseEntity.ok(Map.of("data", budget));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** Utilization for a specific budget */
    @GetMapping("/{id}/utilization")
    public ResponseEntity<Map<String, Object>> getBudgetUtilization(@PathVariable Long id) {
        try {
            Map<String, Object> util = budgetService.getBudgetUtilization(id);
            return ResponseEntity.ok(Map.of("data", util));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ── POST ──────────────────────────────────────────────────────────────────

    /** Create a new budget (master or monthly) */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createBudget(@RequestBody Budget budget) {
        try {
            Budget saved = budgetService.createBudget(budget);
            return ResponseEntity.ok(Map.of("data", saved));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Clone an existing budget as a new monthly version */
    @PostMapping("/{id}/version")
    public ResponseEntity<Map<String, Object>> createVersion(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body) {
        try {
            int month = body.get("month");
            int year = body.get("year");
            Budget version = budgetService.createMonthlyVersion(id, month, year);
            return ResponseEntity.ok(Map.of("data", version));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── PUT ───────────────────────────────────────────────────────────────────

    /** Update a budget's header and allocations */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateBudget(
            @PathVariable Long id,
            @RequestBody Budget budget) {
        try {
            Budget updated = budgetService.updateBudget(id, budget);
            return ResponseEntity.ok(Map.of("data", updated));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    /** Delete a non-master budget */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteBudget(@PathVariable Long id) {
        try {
            budgetService.deleteBudget(id);
            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
