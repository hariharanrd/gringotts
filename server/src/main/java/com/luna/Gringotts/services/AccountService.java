package com.luna.Gringotts.services;

import com.luna.Gringotts.records.User;
import com.luna.Gringotts.repository.*;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

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
            TrustedBrowserRepository trustedBrowserRepository
    ) {
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
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    public Map<String, String> getProfile(String username) {
        User user = userRepository.findByUsername(username).orElseThrow();
        return Map.of(
                "username", user.getUsername(),
                "displayName", user.getDisplayName() != null ? user.getDisplayName() : "",
                "profilePicture", user.getProfilePicture() != null ? user.getProfilePicture() : ""
        );
    }

    public boolean isUsernameAvailable(String username) {
        if (!isValidUsername(username)) return false;
        return !userRepository.existsByUsername(username.toLowerCase().trim());
    }

    private boolean isValidUsername(String username) {
        if (username == null || username.isBlank() || username.length() < 3) return false;
        return username.toLowerCase().trim().matches("^[a-z0-9._]+$");
    }

    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public Map<String, Object> updateProfile(String currentUsername, String newUsername, String displayName, String profilePicture) {
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
                    user.getAuthorities()
            );
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
            return Map.of("status", "error", "message", "New password must be at least 8 characters", "status_code", 400);
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
}
