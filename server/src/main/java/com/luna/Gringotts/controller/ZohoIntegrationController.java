package com.luna.Gringotts.controller;

import com.luna.Gringotts.records.User;
import com.luna.Gringotts.records.ZohoIntegration;
import com.luna.Gringotts.repository.ZohoIntegrationRepository;
import com.luna.Gringotts.services.IAMService;
import com.luna.Gringotts.services.ZohoAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/zoho")
public class ZohoIntegrationController {

    @Autowired
    private IAMService iamService;

    @Autowired
    private ZohoIntegrationRepository zohoIntegrationRepository;

    @Autowired
    private ZohoAnalyticsService zohoAnalyticsService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        User user = iamService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        ZohoIntegration integration = zohoIntegrationRepository.findByUser(user).orElse(null);

        Map<String, Object> data = new HashMap<>();
        if (integration != null) {
            data.put("connected", true);
            data.put("workspaceName", integration.getWorkspaceName());
            data.put("lastSyncedAt", integration.getLastSyncedAt() != null ? integration.getLastSyncedAt().toString() : null);
            data.put("lastSyncError", integration.getLastSyncError());
            data.put("dataCenter", integration.getDataCenter());
        } else {
            data.put("connected", false);
        }

        return ResponseEntity.ok(Map.of("data", data));
    }

    @PostMapping("/connect")
    public ResponseEntity<Map<String, Object>> connect(@RequestBody ConnectRequest request) {
        User user = iamService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        if (request.getClientId() == null || request.getClientSecret() == null ||
            request.getRefreshToken() == null || request.getWorkspaceName() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "All fields are required"));
        }

        String dataCenter = request.getDataCenter() != null ? request.getDataCenter() : "com";

        try {
            // Test connection/credentials
            Map<String, Object> tokenInfo = zohoAnalyticsService.validateCredentials(
                    request.getClientId().trim(),
                    request.getClientSecret().trim(),
                    request.getRefreshToken().trim(),
                    dataCenter,
                    request.getWorkspaceName().trim()
            );

            // Fetch or create new integration record
            ZohoIntegration integration = zohoIntegrationRepository.findByUser(user)
                    .orElse(new ZohoIntegration());

            integration.setUser(user);
            integration.setClientId(request.getClientId().trim());
            integration.setClientSecret(request.getClientSecret().trim());
            integration.setRefreshToken(request.getRefreshToken().trim());
            integration.setWorkspaceName(request.getWorkspaceName().trim());
            integration.setDataCenter(dataCenter);

            String token = (String) tokenInfo.get("access_token");
            Number expiresIn = (Number) tokenInfo.get("expires_in");
            int seconds = expiresIn != null ? expiresIn.intValue() : 3600;
            integration.setAccessToken(token);
            integration.setAccessTokenExpiresAt(java.time.LocalDateTime.now().plusSeconds(seconds));

            zohoIntegrationRepository.save(integration);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Successfully connected to Zoho Analytics"
            ));

        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of(
                    "status", "error",
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> sync() {
        User user = iamService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            zohoAnalyticsService.syncAll(user);
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Synchronization completed successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of(
                    "status", "error",
                    "error", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/disconnect")
    public ResponseEntity<Map<String, Object>> disconnect() {
        User user = iamService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        ZohoIntegration integration = zohoIntegrationRepository.findByUser(user).orElse(null);
        if (integration != null) {
            zohoIntegrationRepository.delete(integration);
        }

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Successfully disconnected Zoho Analytics"
        ));
    }

    public static class ConnectRequest {
        private String clientId;
        private String clientSecret;
        private String refreshToken;
        private String workspaceName;
        private String dataCenter;

        public String getClientId() {
            return clientId;
        }

        public void setClientId(String clientId) {
            this.clientId = clientId;
        }

        public String getClientSecret() {
            return clientSecret;
        }

        public void setClientSecret(String clientSecret) {
            this.clientSecret = clientSecret;
        }

        public String getRefreshToken() {
            return refreshToken;
        }

        public void setRefreshToken(String refreshToken) {
            this.refreshToken = refreshToken;
        }

        public String getWorkspaceName() {
            return workspaceName;
        }

        public void setWorkspaceName(String workspaceName) {
            this.workspaceName = workspaceName;
        }

        public String getDataCenter() {
            return dataCenter;
        }

        public void setDataCenter(String dataCenter) {
            this.dataCenter = dataCenter;
        }
    }
}
