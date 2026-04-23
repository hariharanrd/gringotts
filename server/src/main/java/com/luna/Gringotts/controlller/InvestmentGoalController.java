package com.luna.Gringotts.controlller;

import com.luna.Gringotts.records.InvestmentGoal;
import com.luna.Gringotts.services.InvestmentGoalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/investment-goals")
public class InvestmentGoalController {

    @Autowired
    private InvestmentGoalService investmentGoalService;

    // ── GET ───────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllGoals() {
        List<Map<String, Object>> goals = investmentGoalService.getAllGoals();
        return ResponseEntity.ok(Map.of("data", goals, "total_count", goals.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getGoalById(@PathVariable Long id) {
        try {
            Map<String, Object> goal = investmentGoalService.getGoalById(id);
            return ResponseEntity.ok(Map.of("data", goal));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    // ── POST ──────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<Map<String, Object>> createGoal(@RequestBody InvestmentGoal goal) {
        try {
            Map<String, Object> created = investmentGoalService.createGoal(goal);
            return ResponseEntity.ok(Map.of("data", created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── PUT ───────────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateGoal(
            @PathVariable Long id,
            @RequestBody InvestmentGoal goal) {
        try {
            Map<String, Object> updated = investmentGoalService.updateGoal(id, goal);
            return ResponseEntity.ok(Map.of("data", updated));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteGoal(@PathVariable Long id) {
        try {
            investmentGoalService.deleteGoal(id);
            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }
}
