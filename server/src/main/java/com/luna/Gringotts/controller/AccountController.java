package com.luna.Gringotts.controller;

import com.luna.Gringotts.records.User;
import com.luna.Gringotts.repository.UserRepository;
import com.luna.Gringotts.services.AccountService;
import com.luna.Gringotts.services.JwtService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/account")
public class AccountController {

    private final AccountService accountService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Value("${production:false}")
    private String production;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    public AccountController(AccountService accountService, JwtService jwtService, UserRepository userRepository) {
        this.accountService = accountService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

    private void setSessionCookie(String token, HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("__session", token)
                .httpOnly(true)
                .secure(Boolean.parseBoolean(production))
                .path("/")
                .maxAge(jwtExpiration / 1000)
                .sameSite("Lax")
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    // ── GET /api/v1/account/profile ───────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<Map<String, String>> getProfile() {
        return ResponseEntity.ok(accountService.getProfile(currentUsername()));
    }

    // ── GET /api/v1/account/check-username ────────────────────────────────────

    @GetMapping("/check-username")
    public ResponseEntity<Map<String, Boolean>> checkUsername(@RequestParam String username) {
        return ResponseEntity.ok(Map.of("available", accountService.isUsernameAvailable(username)));
    }

    // ── PUT /api/v1/account/profile ───────────────────────────────────────────

    @PutMapping("/profile")
    @CacheEvict(value = "users", allEntries = true)
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody UpdateProfileRequest request,
            HttpServletResponse response) {
        Map<String, Object> result = accountService.updateProfile(
                currentUsername(),
                request.getUsername(),
                request.getDisplayName(),
                request.getProfilePicture());

        if (Boolean.TRUE.equals(result.get("usernameChanged"))) {
            String newUsername = (String) result.get("username");
            User user = userRepository.findByUsername(newUsername).orElseThrow();
            String token = jwtService.generateToken(user);
            setSessionCookie(token, response);
        }

        return ResponseEntity.ok(result);
    }

    // ── POST /api/v1/account/reset-password ───────────────────────────────────

    @PostMapping("/reset-password")
    @CacheEvict(value = "users", allEntries = true)
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody ResetPasswordRequest request) {
        Map<String, Object> result = accountService.resetPassword(
                currentUsername(),
                request.getCurrentPassword(),
                request.getNewPassword());
        if ("error".equals(result.get("status"))) {
            return ResponseEntity.status((Integer) result.get("status_code")).body(result);
        }
        return ResponseEntity.ok(result);
    }

    // ── DELETE /api/v1/account ────────────────────────────────────────────────

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> deleteAccount(
            @RequestBody DeleteAccountRequest request,
            HttpServletResponse response) {

        Map<String, Object> result = accountService.deleteAccount(currentUsername(), request.getCurrentPassword());
        if ("error".equals(result.get("status"))) {
            return ResponseEntity.status((Integer) result.get("status_code")).body(result);
        }

        // Clear the session cookie so the browser is immediately logged out
        ResponseCookie cookie = ResponseCookie.from("__session", "")
                .httpOnly(true)
                .secure(Boolean.parseBoolean(production))
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.ok(result);
    }

    // ── POST /api/v1/account/reset-mfa/initiate ───────────────────────────────

    @PostMapping("/reset-mfa/initiate")
    public ResponseEntity<Map<String, Object>> initiateResetMfa(@RequestBody InitiateMfaResetRequest request) {
        Map<String, Object> result = accountService.initiateResetMfa(
                currentUsername(),
                request.getCurrentPassword());
        if ("error".equals(result.get("status"))) {
            return ResponseEntity.status((Integer) result.get("status_code")).body(result);
        }
        return ResponseEntity.ok(result);
    }

    // ── POST /api/v1/account/reset-mfa/confirm ────────────────────────────────

    @PostMapping("/reset-mfa/confirm")
    @CacheEvict(value = "users", allEntries = true)
    public ResponseEntity<Map<String, Object>> confirmResetMfa(@RequestBody ConfirmMfaResetRequest request) {
        Map<String, Object> result = accountService.confirmResetMfa(
                currentUsername(),
                request.getCode());
        if ("error".equals(result.get("status"))) {
            return ResponseEntity.status((Integer) result.get("status_code")).body(result);
        }
        return ResponseEntity.ok(result);
    }

    // ── Request / Response records ────────────────────────────────────────────

    public static class UpdateProfileRequest {
        private String username;
        private String displayName;
        private String profilePicture;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }

        public String getProfilePicture() {
            return profilePicture;
        }

        public void setProfilePicture(String profilePicture) {
            this.profilePicture = profilePicture;
        }
    }

    public static class ResetPasswordRequest {
        private String currentPassword;
        private String newPassword;

        public String getCurrentPassword() {
            return currentPassword;
        }

        public void setCurrentPassword(String currentPassword) {
            this.currentPassword = currentPassword;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }

    public static class DeleteAccountRequest {
        private String currentPassword;

        public String getCurrentPassword() {
            return currentPassword;
        }

        public void setCurrentPassword(String currentPassword) {
            this.currentPassword = currentPassword;
        }
    }

    public static class InitiateMfaResetRequest {
        private String currentPassword;

        public String getCurrentPassword() {
            return currentPassword;
        }

        public void setCurrentPassword(String currentPassword) {
            this.currentPassword = currentPassword;
        }
    }

    public static class ConfirmMfaResetRequest {
        private int code;

        public int getCode() {
            return code;
        }

        public void setCode(int code) {
            this.code = code;
        }
    }
}
