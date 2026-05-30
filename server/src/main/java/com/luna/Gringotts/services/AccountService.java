package com.luna.Gringotts.services;

import com.luna.Gringotts.records.AppConfiguration;
import com.luna.Gringotts.records.User;
import com.luna.Gringotts.repository.*;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class AccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final SavingRepository savingRepository;
    private final RevolvingRepository revolvingRepository;
    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final InvestmentGoalRepository investmentGoalRepository;
    private final TrustedBrowserRepository trustedBrowserRepository;
    private final AppConfigurationRepository appConfigurationRepository;
    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();
    private final ConcurrentHashMap<String, String> pendingMfaSecrets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, List<LocalDateTime>> mfaResetTimestamps = new ConcurrentHashMap<>();

    public AccountService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            ExpenseRepository expenseRepository,
            IncomeRepository incomeRepository,
            SavingRepository savingRepository,
            RevolvingRepository revolvingRepository,
            BudgetRepository budgetRepository,
            CategoryRepository categoryRepository,
            InvestmentGoalRepository investmentGoalRepository,
            TrustedBrowserRepository trustedBrowserRepository,
            AppConfigurationRepository appConfigurationRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.expenseRepository = expenseRepository;
        this.incomeRepository = incomeRepository;
        this.savingRepository = savingRepository;
        this.revolvingRepository = revolvingRepository;
        this.budgetRepository = budgetRepository;
        this.categoryRepository = categoryRepository;
        this.investmentGoalRepository = investmentGoalRepository;
        this.trustedBrowserRepository = trustedBrowserRepository;
        this.appConfigurationRepository = appConfigurationRepository;
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    public Map<String, String> getProfile(String username) {
        User user = userRepository.findByUsername(username).orElseThrow();
        return Map.of(
                "username", user.getUsername(),
                "displayName", user.getDisplayName() != null ? user.getDisplayName() : "",
                "profilePicture", user.getProfilePicture() != null ? user.getProfilePicture() : "");
    }

    public boolean isUsernameAvailable(String username) {
        if (!isValidUsername(username))
            return false;
        return !userRepository.existsByUsername(username.toLowerCase().trim());
    }

    private boolean isValidUsername(String username) {
        if (username == null || username.isBlank() || username.length() < 3)
            return false;
        return username.toLowerCase().trim().matches("^[a-z0-9._]+$");
    }

    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public Map<String, Object> updateProfile(String currentUsername, String newUsername, String displayName,
            String profilePicture) {
        User user = userRepository.findByUsername(currentUsername).orElseThrow();
        boolean usernameChanged = false;

        if (newUsername != null && !newUsername.isBlank()) {
            newUsername = newUsername.toLowerCase().trim();
            if (!newUsername.equals(currentUsername)) {
                if (!isValidUsername(newUsername)) {
                    throw new RuntimeException("Invalid username format");
                }
                if (userRepository.existsByUsername(newUsername)) {
                    throw new RuntimeException("Username already taken");
                }
                user.setUsername(newUsername);
                usernameChanged = true;
            }
        }

        if (displayName != null) {
            user.setDisplayName(displayName.isBlank() ? null : displayName.trim());
        }
        if (profilePicture != null) {
            user.setProfilePicture(profilePicture.isBlank() ? null : profilePicture);
        }

        userRepository.save(user);

        // Update SecurityContext if username changed to keep the current request valid
        if (usernameChanged) {
            UsernamePasswordAuthenticationToken newAuth = new UsernamePasswordAuthenticationToken(
                    user,
                    null,
                    user.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(newAuth);
        }

        Map<String, Object> profileMap = new HashMap<>(getProfile(user.getUsername()));
        profileMap.put("usernameChanged", usernameChanged);
        return profileMap;
    }

    // ── Security ──────────────────────────────────────────────────────────────

    @CacheEvict(value = "users", allEntries = true)
    public Map<String, Object> resetPassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username).orElseThrow();

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return Map.of("status", "error", "message", "Current password is incorrect", "status_code", 401);
        }
        if (newPassword == null || newPassword.length() < 8) {
            return Map.of("status", "error", "message", "New password must be at least 8 characters", "status_code",
                    400);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return Map.of("status", "success");
    }

    // ── Delete Account ────────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public Map<String, Object> deleteAccount(String username, String currentPassword) {
        User user = userRepository.findByUsername(username).orElseThrow();

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return Map.of("status", "error", "message", "Password is incorrect", "status_code", 401);
        }

        // 1. Goals (tags cascade via CascadeType.ALL on InvestmentGoal.tags)
        investmentGoalRepository.deleteByUser(user);

        // 2. Transactions (expenses, incomes, savings, revolvings)
        expenseRepository.deleteByUser(user);
        incomeRepository.deleteByUser(user);
        savingRepository.deleteByUser(user);
        revolvingRepository.deleteByUser(user);

        // 3. Budgets (allocations cascade via CascadeType.ALL on Budget.allocations)
        budgetRepository.deleteByUser(user);

        // 4. Categories (subcategories & items cascade via DB-level ON DELETE CASCADE)
        categoryRepository.deleteByUser(user);

        // 5. Trusted browsers
        trustedBrowserRepository.deleteByUsername(username);

        // 6. User itself
        userRepository.delete(user);
        return Map.of("status", "success");
    }

    // ── Reset MFA ─────────────────────────────────────────────────────────────

    public Map<String, Object> initiateResetMfa(String username, String currentPassword) {
        int maxResets = 3; // Default limit

        // Check if there is a custom user-specific limit or global default configured
        // in app_configuration table
        AppConfiguration userConfig = appConfigurationRepository.findByCategoryAndParameter("MFA_LIMIT", username);
        if (userConfig != null && userConfig.getValue() != null) {
            try {
                maxResets = Integer.parseInt(userConfig.getValue());
            } catch (NumberFormatException e) {
                // fall back
            }
        } else {
            AppConfiguration defaultConfig = appConfigurationRepository.findByCategoryAndParameter("MFA_LIMIT",
                    "DEFAULT");
            if (defaultConfig != null && defaultConfig.getValue() != null) {
                try {
                    maxResets = Integer.parseInt(defaultConfig.getValue());
                } catch (NumberFormatException e) {
                    // fall back
                }
            }
        }

        // Limit resets in 24 hours
        List<LocalDateTime> timestamps = mfaResetTimestamps.computeIfAbsent(username,
                k -> new CopyOnWriteArrayList<>());
        LocalDateTime now = LocalDateTime.now();
        timestamps.removeIf(t -> t.isBefore(now.minusHours(24)));

        if (timestamps.size() >= maxResets) {
            return Map.of("status", "error", "message",
                    "MFA reset limit exceeded. You can only reset MFA up to " + maxResets + " times in 24 hours.",
                    "status_code", 429);
        }

        User user = userRepository.findByUsername(username).orElseThrow();

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return Map.of("status", "error", "message", "Current password is incorrect", "status_code", 401);
        }

        GoogleAuthenticatorKey key = gAuth.createCredentials();
        pendingMfaSecrets.put(username, key.getKey());

        return Map.of(
                "status", "success",
                "secret", key.getKey(),
                "otpAuthTotpURL",
                "otpauth://totp/Gringotts:" + username + "?secret=" + key.getKey() + "&issuer=Gringotts");
    }

    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public Map<String, Object> confirmResetMfa(String username, int code) {
        int maxResets = 3;
        AppConfiguration userConfig = appConfigurationRepository.findByCategoryAndParameter("MFA_LIMIT", username);
        if (userConfig != null && userConfig.getValue() != null) {
            try {
                maxResets = Integer.parseInt(userConfig.getValue());
            } catch (NumberFormatException e) {
                // fall back
            }
        } else {
            AppConfiguration defaultConfig = appConfigurationRepository.findByCategoryAndParameter("MFA_LIMIT",
                    "DEFAULT");
            if (defaultConfig != null && defaultConfig.getValue() != null) {
                try {
                    maxResets = Integer.parseInt(defaultConfig.getValue());
                } catch (NumberFormatException e) {
                    // fall back
                }
            }
        }

        List<LocalDateTime> timestamps = mfaResetTimestamps.computeIfAbsent(username,
                k -> new CopyOnWriteArrayList<>());
        LocalDateTime now = LocalDateTime.now();
        timestamps.removeIf(t -> t.isBefore(now.minusHours(24)));

        if (timestamps.size() >= maxResets) {
            return Map.of("status", "error", "message",
                    "MFA reset limit exceeded. You can only reset MFA up to " + maxResets + " times in 24 hours.",
                    "status_code", 429);
        }

        String pendingSecret = pendingMfaSecrets.get(username);
        if (pendingSecret == null) {
            return Map.of("status", "error", "message", "No pending MFA reset request found", "status_code", 400);
        }

        if (!gAuth.authorize(pendingSecret, code)) {
            return Map.of("status", "error", "message", "Invalid 2FA code", "status_code", 401);
        }

        User user = userRepository.findByUsername(username).orElseThrow();
        user.setTotpSecret(pendingSecret);
        userRepository.saveAndFlush(user);

        pendingMfaSecrets.remove(username);

        // Add confirmation timestamp to rate limiter
        timestamps.add(LocalDateTime.now());

        // Clear trusted browsers on reset
        trustedBrowserRepository.deleteByUsername(username);

        return Map.of("status", "success");
    }
}
