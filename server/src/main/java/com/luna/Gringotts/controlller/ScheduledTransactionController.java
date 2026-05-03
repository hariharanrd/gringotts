package com.luna.Gringotts.controlller;

import com.luna.Gringotts.records.ScheduledTransaction;
import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.services.ScheduledTransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/scheduled-transactions")
public class ScheduledTransactionController {

    @Autowired
    ScheduledTransactionService scheduledTransactionService;

    @GetMapping("")
    public ResponseEntity<Map<String, Object>> list() {
        List<ScheduledTransaction> data = scheduledTransactionService.getAllForUser();
        Map<String, Object> resp = new HashMap<>();
        resp.put("data", data);
        resp.put("total_count", data.size());
        resp.put("page", 1);
        resp.put("has_more", false);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable Long id) {
        ScheduledTransaction s = scheduledTransactionService.getById(id);
        return ResponseEntity.ok(Map.of("data", s));
    }

    @PostMapping("")
    public ResponseEntity<Map<String, Object>> create(@RequestBody ScheduledTransaction s) {
        ScheduledTransaction saved = scheduledTransactionService.create(s);
        return ResponseEntity.ok(Map.of("data", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Long id, @RequestBody ScheduledTransaction s) {
        ScheduledTransaction saved = scheduledTransactionService.update(id, s);
        return ResponseEntity.ok(Map.of("data", saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        scheduledTransactionService.delete(id);
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    @PostMapping("/{id}/toggle-active")
    public ResponseEntity<Map<String, Object>> toggleActive(@PathVariable Long id) {
        ScheduledTransaction s = scheduledTransactionService.toggleActive(id);
        return ResponseEntity.ok(Map.of("data", s));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<Map<String, Object>> history(@PathVariable Long id,
            @RequestParam(value = "page", defaultValue = "1") int page) {
        var result = scheduledTransactionService.getHistory(id, PageRequest.of(Math.max(0, page - 1), 20));
        Map<String, Object> resp = new HashMap<>();
        resp.put("data", result.getContent());
        resp.put("total_count", result.getTotalElements());
        resp.put("page", result.getNumber() + 1);
        resp.put("has_more", result.hasNext());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{id}/execute")
    public ResponseEntity<Map<String, Object>> execute(@PathVariable Long id) {
        Transaction t = scheduledTransactionService.executeSchedule(id, true);
        return ResponseEntity.ok(Map.of("data", t));
    }
}
