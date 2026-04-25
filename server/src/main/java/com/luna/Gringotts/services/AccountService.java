package com.luna.Gringotts.services;

import com.luna.Gringotts.records.User;
import com.luna.Gringotts.repository.*;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @CacheEvict(value = "users", allEntries = true)
    public Map<String, String> updateProfile(String username, String displayName, String profilePicture) {
        User user = userRepository.findByUsername(username).orElseThrow();

        if (displayName != null) {
            user.setDisplayName(displayName.isBlank() ? null : displayName.trim());
        }
        if (profilePicture != null) {
            user.setProfilePicture(profilePicture.isBlank() ? null : profilePicture);
        }

        userRepository.save(user);
        return getProfile(username);
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
