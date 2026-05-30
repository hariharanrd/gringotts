package com.luna.Gringotts.services;

import com.luna.Gringotts.records.TrustedBrowser;
import com.luna.Gringotts.repository.TrustedBrowserRepository;
import com.luna.Gringotts.records.User;
import com.luna.Gringotts.records.UserSession;
import com.luna.Gringotts.records.PasswordResetToken;
import com.luna.Gringotts.records.UserRecoveryInfo;
import com.luna.Gringotts.repository.UserRepository;
import com.luna.Gringotts.repository.UserSessionRepository;
import com.luna.Gringotts.repository.PasswordResetTokenRepository;
import com.luna.Gringotts.repository.UserRecoveryInfoRepository;
import com.luna.Gringotts.records.AppConfiguration;
import com.luna.Gringotts.repository.AppConfigurationRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class AuthenticationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GoogleAuthenticator gAuth;
    private final TrustedBrowserRepository trustedBrowserRepository;
    private final DefaultDataInitializer defaultDataInitializer;
    private final UserSessionRepository userSessionRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final UserRecoveryInfoRepository userRecoveryInfoRepository;
    private final AppConfigurationRepository appConfigurationRepository;
    private final ConcurrentHashMap<String, List<LocalDateTime>> recoveryEmailUpdateTimestamps = new ConcurrentHashMap<>();

    public AuthenticationService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            TrustedBrowserRepository trustedBrowserRepository,
            DefaultDataInitializer defaultDataInitializer,
            UserSessionRepository userSessionRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            EmailService emailService,
            UserRecoveryInfoRepository userRecoveryInfoRepository,
            AppConfigurationRepository appConfigurationRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.trustedBrowserRepository = trustedBrowserRepository;
        this.defaultDataInitializer = defaultDataInitializer;
        this.userSessionRepository = userSessionRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService = emailService;
        this.userRecoveryInfoRepository = userRecoveryInfoRepository;
        this.appConfigurationRepository = appConfigurationRepository;
        this.gAuth = new GoogleAuthenticator();
    }

    @CacheEvict(value = "users", allEntries = true)
    public Map<String, Object> register(String username, String password) {
        if (username == null)
            return Map.of("status", "error", "message", "Username is required", "status_code", 400);

        username = username.toLowerCase().trim();
        if (!username.matches("^[a-z0-9._]+$") || username.length() < 3) {
            return Map.of("status", "error", "message",
                    "Username must be at least 3 characters and contain only lowercase letters, numbers, dots, or underscores",
                    "status_code", 400);
        }

        if (userRepository.findByUsername(username).isPresent()) {
            return Map.of("status", "error", "message", "User already exists", "status_code", 409);
        }

        GoogleAuthenticatorKey key = gAuth.createCredentials();

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setTotpSecret(key.getKey());

        userRepository.save(user);

        String preAuthToken = jwtService.generatePreAuthToken(username);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("secret", key.getKey());
        response.put("otpAuthTotpURL",
                "otpauth://totp/Gringotts:" + username + "?secret=" + key.getKey() + "&issuer=Gringotts");
        response.put("preAuthToken", preAuthToken);

        return response;
    }

    public String authenticate(String username, String password, int code) {
        if (username != null)
            username = username.toLowerCase().trim();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));

        User user = userRepository.findByUsername(username)
                .orElseThrow();

        if (!gAuth.authorize(user.getTotpSecret(), code)) {
            throw new RuntimeException("Invalid 2FA code");
        }

        return jwtService.generateToken(user);
    }

    public Map<String, Object> preAuthenticate(String username, String password, String trustToken,
            HttpServletRequest request) {
        if (username != null)
            username = username.toLowerCase().trim();
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));
        } catch (DisabledException | UsernameNotFoundException | BadCredentialsException ue) {
            return Map.of("status", "error", "message", "Bad Credentials", "status_code", 401);
        }

        if (trustToken != null) {
            Optional<TrustedBrowser> trusted = trustedBrowserRepository.findByToken(trustToken);
            if (trusted.isPresent() && trusted.get().getUsername().equals(username) &&
                    trusted.get().getExpiresAt().isAfter(LocalDateTime.now())) {

                User user = userRepository.findByUsername(username).orElseThrow();

                String tokenId = UUID.randomUUID().toString();
                UserSession session = new UserSession();
                session.setUser(user);
                session.setTokenId(tokenId);
                session.setIpAddress(request.getRemoteAddr());
                session.setUserAgent(request.getHeader("User-Agent"));
                userSessionRepository.save(session);

                return Map.of(
                        "status", "success",
                        "requiresMfa", false,
                        "jwt", jwtService.generateToken(user, tokenId));
            }
        }

        return Map.of(
                "status", "success",
                "requiresMfa", true,
                "preAuthToken", jwtService.generatePreAuthToken(username));
    }

    public Map<String, Object> completeMfa(String preAuthToken, int code, boolean trustBrowser,
            HttpServletRequest request) {
        if (!jwtService.isPreAuthTokenValid(preAuthToken)) {
            return Map.of("status", "error", "message", "Invalid or expired session. Please login again.",
                    "status_code", 401);
        }

        String username = jwtService.extractPreAuthUsername(preAuthToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow();

        if (!gAuth.authorize(user.getTotpSecret(), code)) {
            return Map.of("status", "error", "message", "Invalid 2FA code", "status_code", 401);
        }

        if (!user.isConfirmed()) {
            user.setConfirmed(true);
            userRepository.save(user);
            defaultDataInitializer.initializeCategories(user);
        }

        String tokenId = UUID.randomUUID().toString();
        UserSession session = new UserSession();
        session.setUser(user);
        session.setTokenId(tokenId);
        session.setIpAddress(request.getRemoteAddr());
        session.setUserAgent(request.getHeader("User-Agent"));
        userSessionRepository.save(session);

        String jwt = jwtService.generateToken(user, tokenId);
        String trustToken = null;

        if (trustBrowser) {
            trustToken = UUID.randomUUID().toString();
            TrustedBrowser tb = new TrustedBrowser();
            tb.setToken(trustToken);
            tb.setUsername(username);
            tb.setExpiresAt(LocalDateTime.now().plusMonths(3));
            trustedBrowserRepository.save(tb);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("jwt", jwt);
        if (trustToken != null)
            response.put("trustToken", trustToken);
        return response;
    }

    public void logout(String token) {
        if (token == null || token.isEmpty())
            return;
        try {
            String jti = jwtService.extractClaim(token, claims -> claims.get("jti", String.class));
            if (jti != null) {
                userSessionRepository.findByTokenId(jti).ifPresent(session -> {
                    session.setRevoked(true);
                    userSessionRepository.save(session);
                });
            }
        } catch (Exception e) {
            // Ignore token parsing errors during logout
        }
    }

    public Map<String, Object> initiateForgotPassword(String username) {
        if (username == null || username.trim().isEmpty()) {
            return Map.of("status", "error", "message", "Username is required", "status_code", 400);
        }
        username = username.trim();

        User user = userRepository.findByUsername(username.toLowerCase()).orElse(null);
        if (user == null) {
            return Map.of("status", "error", "message", "This username does not exist or has no verified recovery email configured.", "status_code", 404);
        }

        Optional<UserRecoveryInfo> recoveryOpt = userRecoveryInfoRepository.findByUser(user);
        if (recoveryOpt.isEmpty() || !"VERIFIED".equals(recoveryOpt.get().getVerificationStatus())
                || recoveryOpt.get().getRecoveryEmail() == null || recoveryOpt.get().getRecoveryEmail().trim().isEmpty()) {
            return Map.of("status", "error", "message", "This username does not exist or has no verified recovery email configured.", "status_code", 404);
        }

        String email = recoveryOpt.get().getRecoveryEmail().trim();
        String maskedEmail = maskEmail(email);

        return Map.of("status", "success", "maskedEmail", maskedEmail);
    }

    public Map<String, Object> confirmForgotPassword(String username, String recoveryEmail) {
        if (username == null || username.trim().isEmpty() || recoveryEmail == null || recoveryEmail.trim().isEmpty()) {
            return Map.of("status", "error", "message", "Username and recovery email are required", "status_code", 400);
        }

        username = username.trim();
        recoveryEmail = recoveryEmail.trim();

        User user = userRepository.findByUsername(username.toLowerCase()).orElse(null);
        if (user != null) {
            Optional<UserRecoveryInfo> recoveryOpt = userRecoveryInfoRepository.findByUser(user);
            if (recoveryOpt.isPresent() && "VERIFIED".equals(recoveryOpt.get().getVerificationStatus())
                    && recoveryOpt.get().getRecoveryEmail() != null) {
                
                String storedEmail = recoveryOpt.get().getRecoveryEmail().trim();
                if (storedEmail.equalsIgnoreCase(recoveryEmail)) {
                    // Match! Invalidate older tokens
                    java.util.List<PasswordResetToken> oldTokens = passwordResetTokenRepository.findByUser(user);
                    for (PasswordResetToken ot : oldTokens) {
                        if (!ot.isUsed()) {
                            ot.setUsed(true);
                            passwordResetTokenRepository.save(ot);
                        }
                    }

                    // Generate token (valid for 15 minutes)
                    String token = java.util.UUID.randomUUID().toString();
                    PasswordResetToken resetToken = new PasswordResetToken();
                    resetToken.setUser(user);
                    resetToken.setToken(token);
                    resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(15));
                    resetToken.setUsed(false);
                    passwordResetTokenRepository.save(resetToken);

                    emailService.sendPasswordResetEmail(storedEmail, token);
                }
            }
        }

        // Unconditionally return generic success response
        return Map.of("status", "success", "message", "If the entered email is correct, a recovery link has been sent to it.");
    }

    private String maskEmail(String email) {
        int atIdx = email.indexOf('@');
        if (atIdx <= 0) return email;
        String local = email.substring(0, atIdx);
        String domain = email.substring(atIdx + 1);

        String maskedLocal;
        if (local.length() <= 2) {
            maskedLocal = local.charAt(0) + "*";
        } else {
            maskedLocal = local.charAt(0) + "*".repeat(local.length() - 2) + local.charAt(local.length() - 1);
        }

        int dotIdx = domain.lastIndexOf('.');
        if (dotIdx <= 0) {
            return maskedLocal + "@" + domain;
        }

        String domainName = domain.substring(0, dotIdx);
        String tld = domain.substring(dotIdx);

        String maskedDomain;
        if (domainName.length() <= 2) {
            maskedDomain = domainName.charAt(0) + "*";
        } else {
            maskedDomain = domainName.charAt(0) + "*".repeat(domainName.length() - 2) + domainName.charAt(domainName.length() - 1);
        }

        return maskedLocal + "@" + maskedDomain + tld;
    }

    @CacheEvict(value = "users", allEntries = true)
    public Map<String, Object> resetPassword(String token, String newPassword) {
        if (token == null || token.trim().isEmpty()) {
            return Map.of("status", "error", "message", "Token is required", "status_code", 400);
        }
        if (newPassword == null || newPassword.length() < 8) {
            return Map.of("status", "error", "message", "Password must be at least 8 characters long", "status_code",
                    400);
        }

        Optional<PasswordResetToken> resetTokenOpt = passwordResetTokenRepository.findByToken(token);
        if (resetTokenOpt.isEmpty()) {
            return Map.of("status", "error", "message", "Invalid or unrecognized recovery token.", "status_code", 400);
        }

        PasswordResetToken resetToken = resetTokenOpt.get();
        if (resetToken.isUsed()) {
            return Map.of("status", "error", "message", "This recovery token has already been used.", "status_code",
                    400);
        }

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            return Map.of("status", "error", "message", "This recovery token has expired.", "status_code", 400);
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Revoke active sessions
        List<UserSession> activeSessions = userSessionRepository.findAllByUser(user);
        for (UserSession session : activeSessions) {
            session.setRevoked(true);
            userSessionRepository.save(session);
        }

        // Delete trusted browser tokens
        trustedBrowserRepository.deleteByUsername(user.getUsername());

        // Invalidate all reset tokens for this user
        List<PasswordResetToken> userTokens = passwordResetTokenRepository.findByUser(user);
        for (PasswordResetToken t : userTokens) {
            if (!t.isUsed()) {
                t.setUsed(true);
                passwordResetTokenRepository.save(t);
            }
        }

        return Map.of("status", "success", "message", "Your password has been successfully reset.");
    }

    @CacheEvict(value = "users", allEntries = true)
    public Map<String, Object> initiateRecoveryEmailVerification(String username, String recoveryEmail) {
        if (username == null) {
            return Map.of("status", "error", "message", "Username is required", "status_code", 400);
        }
        if (recoveryEmail == null || recoveryEmail.trim().isEmpty()) {
            return Map.of("status", "error", "message", "Email is required", "status_code", 400);
        }

        recoveryEmail = recoveryEmail.trim();
        if (!recoveryEmail.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$")) {
            return Map.of("status", "error", "message", "Invalid email format", "status_code", 400);
        }

        User user = userRepository.findByUsername(username.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        int maxChanges = 2; // Default limit
        AppConfiguration userConfig = appConfigurationRepository.findByCategoryAndParameter("RECOVERY_EMAIL_LIMIT",
                username);
        if (userConfig != null && userConfig.getValue() != null) {
            try {
                maxChanges = Integer.parseInt(userConfig.getValue());
            } catch (NumberFormatException e) {
                // fall back
            }
        } else {
            AppConfiguration defaultConfig = appConfigurationRepository.findByCategoryAndParameter(
                    "RECOVERY_EMAIL_LIMIT",
                    "DEFAULT");
            if (defaultConfig != null && defaultConfig.getValue() != null) {
                try {
                    maxChanges = Integer.parseInt(defaultConfig.getValue());
                } catch (NumberFormatException e) {
                    // fall back
                }
            }
        }

        List<LocalDateTime> timestamps = recoveryEmailUpdateTimestamps.computeIfAbsent(username,
                k -> new CopyOnWriteArrayList<>());
        LocalDateTime now = LocalDateTime.now();
        timestamps.removeIf(t -> t.isBefore(now.minusHours(24)));

        if (timestamps.size() >= maxChanges) {
            return Map.of("status", "error", "message",
                    "Recovery email change limit exceeded. You can only change your recovery email up to " + maxChanges
                            + " times in 24 hours.",
                    "status_code", 429);
        }

        // Find or create UserRecoveryInfo
        UserRecoveryInfo recoveryInfo = userRecoveryInfoRepository.findByUser(user)
                .orElseGet(() -> {
                    UserRecoveryInfo uri = new UserRecoveryInfo();
                    uri.setUser(user);
                    return uri;
                });

        // Generate 6-digit OTP
        String otp = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));

        recoveryInfo.setRecoveryEmail(recoveryEmail);
        recoveryInfo.setVerificationStatus("PENDING");
        recoveryInfo.setOtp(hashOtp(otp));
        recoveryInfo.setExpiry(LocalDateTime.now().plusMinutes(15));

        userRecoveryInfoRepository.save(recoveryInfo);

        boolean sent = emailService.sendVerificationOtpEmail(recoveryEmail, otp);
        if (sent) {
            return Map.of("status", "success", "message", "Verification code sent to " + recoveryEmail);
        } else {
            return Map.of("status", "error", "message", "Failed to send verification email. Please try again later.",
                    "status_code", 500);
        }
    }

    @CacheEvict(value = "users", allEntries = true)
    public Map<String, Object> confirmRecoveryEmailVerification(String username, String otp) {
        if (username == null) {
            return Map.of("status", "error", "message", "Username is required", "status_code", 400);
        }
        if (otp == null || otp.trim().isEmpty()) {
            return Map.of("status", "error", "message", "Verification code is required", "status_code", 400);
        }

        User user = userRepository.findByUsername(username.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        int maxChanges = 2; // Default limit
        AppConfiguration userConfig = appConfigurationRepository.findByCategoryAndParameter("RECOVERY_EMAIL_LIMIT",
                username);
        if (userConfig != null && userConfig.getValue() != null) {
            try {
                maxChanges = Integer.parseInt(userConfig.getValue());
            } catch (NumberFormatException e) {
                // fall back
            }
        } else {
            AppConfiguration defaultConfig = appConfigurationRepository.findByCategoryAndParameter(
                    "RECOVERY_EMAIL_LIMIT",
                    "DEFAULT");
            if (defaultConfig != null && defaultConfig.getValue() != null) {
                try {
                    maxChanges = Integer.parseInt(defaultConfig.getValue());
                } catch (NumberFormatException e) {
                    // fall back
                }
            }
        }

        List<LocalDateTime> timestamps = recoveryEmailUpdateTimestamps.computeIfAbsent(username,
                k -> new CopyOnWriteArrayList<>());
        LocalDateTime now = LocalDateTime.now();
        timestamps.removeIf(t -> t.isBefore(now.minusHours(24)));

        if (timestamps.size() >= maxChanges) {
            return Map.of("status", "error", "message",
                    "Recovery email change limit exceeded. You can only change your recovery email up to " + maxChanges
                            + " times in 24 hours.",
                    "status_code", 429);
        }

        Optional<UserRecoveryInfo> recoveryOpt = userRecoveryInfoRepository.findByUser(user);
        if (recoveryOpt.isEmpty() || !"PENDING".equals(recoveryOpt.get().getVerificationStatus())) {
            return Map.of("status", "error", "message", "No active verification request found.", "status_code", 400);
        }

        UserRecoveryInfo recoveryInfo = recoveryOpt.get();
        if (recoveryInfo.getExpiry().isBefore(LocalDateTime.now())) {
            return Map.of("status", "error", "message", "Verification code has expired. Please request a new one.",
                    "status_code", 400);
        }

        if (!hashOtp(otp.trim()).equals(recoveryInfo.getOtp())) {
            return Map.of("status", "error", "message", "Invalid verification code.", "status_code", 400);
        }

        recoveryInfo.setVerificationStatus("VERIFIED");
        recoveryInfo.setOtp(null);
        recoveryInfo.setExpiry(null);
        userRecoveryInfoRepository.save(recoveryInfo);

        // Add verification timestamp to rate limiter
        timestamps.add(LocalDateTime.now());

        return Map.of("status", "success", "message", "Recovery email successfully verified and configured.");
    }

    @CacheEvict(value = "users", allEntries = true)
    public Map<String, Object> clearRecoveryEmail(String username) {
        if (username == null) {
            return Map.of("status", "error", "message", "Username is required", "status_code", 400);
        }
        User user = userRepository.findByUsername(username.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        userRecoveryInfoRepository.findByUser(user).ifPresent(userRecoveryInfoRepository::delete);
        return Map.of("status", "success", "message", "Recovery email successfully removed.");
    }

    private String hashOtp(String otp) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(otp.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1)
                    hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error hashing OTP", e);
        }
    }

    public static record PreAuthResult(boolean requiresMfa, String preAuthToken, String jwt, String trustToken) {
    }

    public static record MfaResult(String jwt, String trustToken) {
    }
}
