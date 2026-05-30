package com.luna.Gringotts.controller;

import com.luna.Gringotts.records.User;
import com.luna.Gringotts.records.UserRecoveryInfo;
import com.luna.Gringotts.repository.UserRepository;
import com.luna.Gringotts.repository.UserRecoveryInfoRepository;
import com.luna.Gringotts.services.AccountService;
import com.luna.Gringotts.services.AppConfigurationService;
import com.luna.Gringotts.services.AuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    private final AuthenticationService service;
    private final UserRepository userRepository;
    private final AccountService accountService;
    private final UserRecoveryInfoRepository userRecoveryInfoRepository;

    @Value("${production:false}")
    private String production;

    @Autowired
    AppConfigurationService appConfigurationService;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    public AuthenticationController(
            AuthenticationService service,
            UserRepository userRepository,
            AccountService accountService,
            UserRecoveryInfoRepository userRecoveryInfoRepository) {
        this.service = service;
        this.userRepository = userRepository;
        this.accountService = accountService;
        this.userRecoveryInfoRepository = userRecoveryInfoRepository;
    }

    @GetMapping("/check-username")
    public ResponseEntity<Map<String, Boolean>> checkUsername(@RequestParam String username) {
        return ResponseEntity.ok(Map.of("available", accountService.isUsernameAvailable(username)));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        boolean registrationAllowed = Boolean
                .parseBoolean(appConfigurationService.getValue("IAM", "USER_REGISTRATION", "false"));
        if (registrationAllowed) {
            Map<String, Object> result = service.register(request.getUsername(), request.getPassword());
            if ("error".equals(result.get("status"))) {
                return ResponseEntity.status((Integer) result.get("status_code")).body(result);
            }
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(403).build();
        }
    }

    @PostMapping("/pre-authenticate")
    public ResponseEntity<?> preAuthenticate(
            @RequestBody PreAuthenticateRequest request,
            @RequestHeader(value = "X-Trust-Token", required = false) String trustToken,
            HttpServletRequest httpServletRequest,
            HttpServletResponse response) {
        Map<String, Object> result = service.preAuthenticate(
                request.getUsername(), request.getPassword(), trustToken, httpServletRequest);

        if ("error".equals(result.get("status"))) {
            return ResponseEntity.status((Integer) result.get("status_code")).body(result);
        }

        if (Boolean.FALSE.equals(result.get("requiresMfa"))) {
            setSessionCookie((String) result.get("jwt"), response);
            return ResponseEntity.ok(new PreAuthenticateResponse(false, null));
        }

        return ResponseEntity.ok(new PreAuthenticateResponse(true, (String) result.get("preAuthToken")));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticate(
            @RequestBody AuthenticateRequest request,
            HttpServletRequest httpServletRequest,
            HttpServletResponse response) {
        Map<String, Object> result = service.completeMfa(
                request.getPreAuthToken(), request.getCode(), request.isTrustBrowser(), httpServletRequest);

        if ("error".equals(result.get("status"))) {
            return ResponseEntity.status((Integer) result.get("status_code")).body(result);
        }

        setSessionCookie((String) result.get("jwt"), response);

        return ResponseEntity.ok(new AuthenticateResponse((String) result.get("trustToken")));
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

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "__session", required = false) String token,
            HttpServletResponse response) {
        if (token != null) {
            service.logout(token);
        }
        ResponseCookie cookie = ResponseCookie.from("__session", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, String>> checkAuth() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {

            User user = userRepository.findByUsername(authentication.getName()).orElse(null);
            if (user == null)
                return ResponseEntity.status(403).build();

            Optional<UserRecoveryInfo> recoveryOpt = userRecoveryInfoRepository.findByUser(user);
            String email = "";
            boolean hasEmail = false;
            if (recoveryOpt.isPresent() && "VERIFIED".equals(recoveryOpt.get().getVerificationStatus())
                    && recoveryOpt.get().getRecoveryEmail() != null) {
                email = recoveryOpt.get().getRecoveryEmail();
                hasEmail = true;
            }

            return ResponseEntity.ok(Map.of(
                    "username", user.getUsername(),
                    "displayName", user.getDisplayName() != null ? user.getDisplayName() : "",
                    "profilePicture", user.getProfilePicture() != null ? user.getProfilePicture() : "",
                    "recoveryEmail", email,
                    "hasRecoveryEmail", String.valueOf(hasEmail)));
        }
        return ResponseEntity.status(403).build();
    }

    @PostMapping("/forgot-password/initiate")
    public ResponseEntity<Map<String, Object>> initiateForgotPassword(@RequestBody InitiateForgotPasswordRequest request) {
        Map<String, Object> result = service.initiateForgotPassword(request.getUsername());
        if ("error".equals(result.get("status"))) {
            return ResponseEntity.status((Integer) result.get("status_code")).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/forgot-password/confirm")
    public ResponseEntity<Map<String, Object>> confirmForgotPassword(@RequestBody ConfirmForgotPasswordRequest request) {
        Map<String, Object> result = service.confirmForgotPassword(request.getUsername(), request.getRecoveryEmail());
        if ("error".equals(result.get("status"))) {
            return ResponseEntity.status((Integer) result.get("status_code")).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody ResetPasswordRequest request) {
        Map<String, Object> result = service.resetPassword(request.getToken(), request.getNewPassword());
        if ("error".equals(result.get("status"))) {
            return ResponseEntity.status((Integer) result.get("status_code")).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/verify-recovery-email/initiate")
    public ResponseEntity<Map<String, Object>> initiateVerifyEmail(
            @RequestBody InitiateEmailVerificationRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }

        Map<String, Object> result = service.initiateRecoveryEmailVerification(authentication.getName(),
                request.getRecoveryEmail());
        if ("error".equals(result.get("status"))) {
            return ResponseEntity.status((Integer) result.get("status_code")).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/verify-recovery-email/confirm")
    public ResponseEntity<Map<String, Object>> confirmVerifyEmail(
            @RequestBody ConfirmEmailVerificationRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }

        Map<String, Object> result = service.confirmRecoveryEmailVerification(authentication.getName(),
                request.getOtp());
        if ("error".equals(result.get("status"))) {
            return ResponseEntity.status((Integer) result.get("status_code")).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/verify-recovery-email/clear")
    public ResponseEntity<Map<String, Object>> clearVerifyEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }

        Map<String, Object> result = service.clearRecoveryEmail(authentication.getName());
        return ResponseEntity.ok(result);
    }


    public static class RegisterRequest {
        private String username;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class PreAuthenticateRequest {
        private String username;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static record PreAuthenticateResponse(boolean requiresMfa, String preAuthToken) {
    }

    public static class AuthenticateRequest {
        private String preAuthToken;
        private int code;
        private boolean trustBrowser;

        public String getPreAuthToken() {
            return preAuthToken;
        }

        public void setPreAuthToken(String preAuthToken) {
            this.preAuthToken = preAuthToken;
        }

        public int getCode() {
            return code;
        }

        public void setCode(int code) {
            this.code = code;
        }

        public boolean isTrustBrowser() {
            return trustBrowser;
        }

        public void setTrustBrowser(boolean trustBrowser) {
            this.trustBrowser = trustBrowser;
        }
    }

    public static record AuthenticateResponse(String trustToken) {
    }

    public static class InitiateForgotPasswordRequest {
        private String username;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }
    }

    public static class ConfirmForgotPasswordRequest {
        private String username;
        private String recoveryEmail;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getRecoveryEmail() {
            return recoveryEmail;
        }

        public void setRecoveryEmail(String recoveryEmail) {
            this.recoveryEmail = recoveryEmail;
        }
    }

    public static class ResetPasswordRequest {
        private String token;
        private String newPassword;

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }

    public static class InitiateEmailVerificationRequest {
        private String recoveryEmail;

        public String getRecoveryEmail() {
            return recoveryEmail;
        }

        public void setRecoveryEmail(String recoveryEmail) {
            this.recoveryEmail = recoveryEmail;
        }
    }

    public static class ConfirmEmailVerificationRequest {
        private String otp;

        public String getOtp() {
            return otp;
        }

        public void setOtp(String otp) {
            this.otp = otp;
        }
    }
}
