package com.luna.Gringotts.controller;

import com.luna.Gringotts.records.User;
import com.luna.Gringotts.records.UserSession;
import com.luna.Gringotts.repository.UserSessionRepository;
import com.luna.Gringotts.services.IAMService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/sessions")
public class SessionController {

    private final UserSessionRepository userSessionRepository;
    private final IAMService iamService;

    public SessionController(UserSessionRepository userSessionRepository, IAMService iamService) {
        this.userSessionRepository = userSessionRepository;
        this.iamService = iamService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getSessions() {
        User user = iamService.getCurrentUser();
        List<UserSession> sessions = userSessionRepository.findAllByUserAndIsRevokedFalseOrderByLastActiveAtDesc(user);
        
        List<Map<String, Object>> sessionData = sessions.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId().toString());
            map.put("ip_address", s.getIpAddress() != null ? s.getIpAddress() : "Unknown");
            map.put("user_agent", s.getUserAgent() != null ? s.getUserAgent() : "Unknown");
            map.put("created_at", s.getCreatedAt() != null ? s.getCreatedAt() : "Unknown");
            map.put("last_active_at", s.getLastActiveAt() != null ? s.getLastActiveAt() : "Unknown");
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("data", sessionData, "total_count", sessionData.size()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> revokeSession(@PathVariable UUID id) {
        User user = iamService.getCurrentUser();
        UserSession session = userSessionRepository.findById(id).orElseThrow();
        if (!session.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
        }
        
        session.setRevoked(true);
        userSessionRepository.save(session);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Session revoked"));
    }
}
