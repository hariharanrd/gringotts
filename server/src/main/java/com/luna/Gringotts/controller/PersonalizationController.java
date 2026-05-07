package com.luna.Gringotts.controller;

import com.luna.Gringotts.records.Personalization;
import com.luna.Gringotts.services.PersonalizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/personalizations")
public class PersonalizationController {

    @Autowired
    private PersonalizationService personalizationService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllPersonalizations() {
        List<Personalization> personalizations = personalizationService.getAllPersonalizations();
        return ResponseEntity.ok(Map.of("data", personalizations));
    }

    @GetMapping("/{category}")
    public ResponseEntity<Map<String, Object>> getPersonalizationsByCategory(@PathVariable String category) {
        List<Personalization> personalizations = personalizationService.getPersonalizationsByCategory(category);
        return ResponseEntity.ok(Map.of("data", personalizations));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> savePersonalization(@RequestBody Personalization personalization) {
        Personalization saved = personalizationService.savePersonalization(personalization);
        return ResponseEntity.ok(Map.of("data", saved));
    }

    @DeleteMapping("/{category}/{key}")
    public ResponseEntity<Map<String, String>> deletePersonalization(
            @PathVariable String category,
            @PathVariable String key) {
        personalizationService.deletePersonalization(category, key);
        return ResponseEntity.ok(Map.of("status", "success"));
    }
}
