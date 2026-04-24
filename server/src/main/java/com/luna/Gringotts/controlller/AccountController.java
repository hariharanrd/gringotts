package com.luna.Gringotts.controlller;

import com.luna.Gringotts.services.AccountService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${production:false}")
    private String production;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

    // ── GET /api/v1/account/profile ───────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<Map<String, String>> getProfile() {
        return ResponseEntity.ok(accountService.getProfile(currentUsername()));
    }

    // ── PUT /api/v1/account/profile ───────────────────────────────────────────

    @PutMapping("/profile")
    public ResponseEntity<Map<String, String>> updateProfile(@RequestBody UpdateProfileRequest request) {
        Map<String, String> profile = accountService.updateProfile(
                currentUsername(),
                request.getDisplayName(),
                request.getProfilePicture()
        );
        return ResponseEntity.ok(profile);
    }

    // ── POST /api/v1/account/reset-password ───────────────────────────────────

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody ResetPasswordRequest request) {
        accountService.resetPassword(
                currentUsername(),
                request.getCurrentPassword(),
                request.getNewPassword()
        );
        return ResponseEntity.ok().build();
    }

    // ── DELETE /api/v1/account ────────────────────────────────────────────────

    @DeleteMapping
    public ResponseEntity<Void> deleteAccount(
            @RequestBody DeleteAccountRequest request,
            HttpServletResponse response) {

        accountService.deleteAccount(currentUsername(), request.getCurrentPassword());

        // Clear the session cookie so the browser is immediately logged out
        ResponseCookie cookie = ResponseCookie.from("__session", "")
                .httpOnly(true)
                .secure(Boolean.parseBoolean(production))
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.ok().build();
    }

    // ── Request / Response records ────────────────────────────────────────────

    public static class UpdateProfileRequest {
        private String displayName;
        private String profilePicture;

        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }

        public String getProfilePicture() { return profilePicture; }
        public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    }

    public static class ResetPasswordRequest {
        private String currentPassword;
        private String newPassword;

        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }

        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    public static class DeleteAccountRequest {
        private String currentPassword;

        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
    }
}
