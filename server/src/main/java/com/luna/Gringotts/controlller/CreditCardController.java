package com.luna.Gringotts.controlller;

import com.luna.Gringotts.records.CreditCard;
import com.luna.Gringotts.services.CreditCardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/credit-cards")
public class CreditCardController {

    @Autowired
    private CreditCardService creditCardService;

    // ── GET ───────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllCards() {
        List<Map<String, Object>> cards = creditCardService.getAllCards();
        return ResponseEntity.ok(Map.of("data", cards, "total_count", cards.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCardById(@PathVariable Long id) {
        try {
            Map<String, Object> card = creditCardService.getCardById(id);
            return ResponseEntity.ok(Map.of("data", card));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    // ── POST ──────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<Map<String, Object>> createCard(@RequestBody CreditCard card) {
        try {
            Map<String, Object> created = creditCardService.createCard(card);
            return ResponseEntity.ok(Map.of("data", created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── PUT ───────────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCard(
            @PathVariable Long id,
            @RequestBody CreditCard card) {
        try {
            Map<String, Object> updated = creditCardService.updateCard(id, card);
            return ResponseEntity.ok(Map.of("data", updated));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteCard(@PathVariable Long id) {
        try {
            creditCardService.deleteCard(id);
            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Bills ─────────────────────────────────────────────────────────────────

    @PutMapping("/bills/{billId}")
    public ResponseEntity<Map<String, Object>> updateBillPayment(
            @PathVariable Long billId,
            @RequestBody Map<String, Double> payload) {
        try {
            Double amountPaid = payload.get("amount_paid");
            if (amountPaid == null) return ResponseEntity.badRequest().body(Map.of("error", "amount_paid is required"));
            creditCardService.updateBillPayment(billId, amountPaid);
            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/resync")
    public ResponseEntity<Map<String, Object>> resyncBills(@PathVariable Long id) {
        try {
            creditCardService.resyncBills(id);
            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }
}
