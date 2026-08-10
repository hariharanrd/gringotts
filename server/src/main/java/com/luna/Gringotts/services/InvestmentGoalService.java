package com.luna.Gringotts.services;

import com.luna.Gringotts.records.*;
import com.luna.Gringotts.repository.InvestmentGoalTagRepository;
import com.luna.Gringotts.repository.InvestmentGoalRepository;
import com.luna.Gringotts.repository.ItemRepository;
import com.luna.Gringotts.repository.CategoryRepository;
import com.luna.Gringotts.repository.SubCategoryRepository;
import com.luna.Gringotts.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class InvestmentGoalService {

    @Autowired
    private InvestmentGoalRepository goalRepository;

    @Autowired
    private TransactionRepository<Transaction> transactionRepository;

    @Autowired
    private InvestmentGoalTagRepository tagRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SubCategoryRepository subCategoryRepository;

    @Autowired
    private IAMService iamService;

    // ── Read ──────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getAllGoals() {
        User user = iamService.getCurrentUser();
        List<InvestmentGoal> goals = goalRepository.findAllByUserOrderByCreatedAtDesc(user);
        List<Map<String, Object>> result = new ArrayList<>();
        for (InvestmentGoal goal : goals) {
            result.add(toDto(goal));
        }
        return result;
    }

    public Map<String, Object> getGoalById(Long id) {
        InvestmentGoal goal = requireGoal(id);
        return toDto(goal);
    }

    @Transactional
    public Map<String, Object> createGoal(InvestmentGoal incoming) {
        User user = iamService.getCurrentUser();
        incoming.setUser(user);
        incoming.setTags(new ArrayList<>());
        incoming.setIsClosed(false);
        if (incoming.getCurrentAmount() == null) incoming.setCurrentAmount(0.0);
        if (incoming.getMonthlyContribution() == null) incoming.setMonthlyContribution(0.0);
        if (incoming.getAnnualRate() == null) incoming.setAnnualRate(8.0);
        if (incoming.getIcon() == null || incoming.getIcon().isBlank()) incoming.setIcon("🎯");
        if (incoming.getColor() == null || incoming.getColor().isBlank()) incoming.setColor("#6366f1");
        
        if (incoming.getGoalType() == null) {
            incoming.setGoalType(GoalType.PERSISTENT);
        }

        // current_value: if explicitly provided, stamp the update time
        if (incoming.getCurrentValue() != null) {
            incoming.setLastValueUpdatedAt(LocalDateTime.now());
        }
        
        incoming.setIsClosed(false);
        InvestmentGoal saved = goalRepository.save(incoming);
        if (incoming.getTagsPayload() != null) {
            syncTags(saved, incoming.getTagsPayload());
            saved = goalRepository.save(saved);
        }
        return toDto(saved);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> updateGoal(Long id, InvestmentGoal incoming) {
        InvestmentGoal existing = requireGoal(id);
        if (existing.getIsClosed()) {
            throw new IllegalArgumentException("Cannot update a closed goal");
        }
        existing.setName(incoming.getName());
        existing.setIcon(incoming.getIcon() != null ? incoming.getIcon() : existing.getIcon());
        existing.setColor(incoming.getColor() != null ? incoming.getColor() : existing.getColor());
        existing.setTargetAmount(incoming.getTargetAmount());

        GoalType targetType = incoming.getGoalType() != null ? incoming.getGoalType() : existing.getGoalType();
        Double targetAmount = incoming.getCurrentAmount() != null ? incoming.getCurrentAmount() : existing.getCurrentAmount();
        
        if (GoalType.ONE_TIME.equals(targetType)) {
            List<Transaction> funded = transactionRepository.findByFundingGoalAndUser(existing, existing.getUser());
            double totalFunded = funded.stream().mapToDouble(Transaction::getValue).sum();
            if (targetAmount < totalFunded) {
                throw new IllegalArgumentException("Cannot set ONE_TIME goal amount (₹" + targetAmount + ") below already-funded transactions (₹" + totalFunded + ")");
            }
        }

        existing.setCurrentAmount(
                incoming.getCurrentAmount() != null ? incoming.getCurrentAmount() : existing.getCurrentAmount());
        existing.setMonthlyContribution(incoming.getMonthlyContribution() != null ? incoming.getMonthlyContribution()
                : existing.getMonthlyContribution());
        existing.setAnnualRate(incoming.getAnnualRate() != null ? incoming.getAnnualRate() : existing.getAnnualRate());
        existing.setNotes(incoming.getNotes());
        
        if (incoming.getGoalType() != null) {
            existing.setGoalType(incoming.getGoalType());
        }

        if (incoming.getIsClosed() != null) {
            existing.setIsClosed(incoming.getIsClosed());
            existing.setClosedAt(incoming.getClosedAt());
        }

        // Handle current_value update: stamp timestamp when value changes
        if (incoming.getCurrentValue() != null) {
            // Explicit null sentinel (-1) can be passed by frontend to clear the field
            existing.setCurrentValue(incoming.getCurrentValue() < 0 ? null : incoming.getCurrentValue());
            existing.setLastValueUpdatedAt(incoming.getCurrentValue() < 0 ? null : LocalDateTime.now());
        }

        if (incoming.getTagsPayload() != null) {
            syncTags(existing, incoming.getTagsPayload());
        }

        return toDto(goalRepository.save(existing));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteGoal(Long id) {
        requireGoal(id); // ownership check
        goalRepository.deleteById(id);
    }

    private void syncTags(InvestmentGoal goal, List<InvestmentGoal.TagRequest> requests) {
        if (requests == null) return;
        
        // Clear old tags that are not in the new list
        goal.getTags().clear();
        
        for (InvestmentGoal.TagRequest req : requests) {
            InvestmentGoalTag tag = new InvestmentGoalTag();
            tag.setGoal(goal);
            
            if (req.type == InvestmentGoal.TagType.ITEM) {
                Item item = itemRepository.findById(req.id)
                        .orElseThrow(() -> new NoSuchElementException("Item not found: " + req.id));
                tag.setItem(item);
            } else if (req.type == InvestmentGoal.TagType.SUBCATEGORY) {
                SubCategory sub = subCategoryRepository.findById(req.id)
                        .orElseThrow(() -> new NoSuchElementException("SubCategory not found: " + req.id));
                tag.setSubCategory(sub);
            } else if (req.type == InvestmentGoal.TagType.CATEGORY) {
                Category cat = categoryRepository.findById(req.id)
                        .orElseThrow(() -> new NoSuchElementException("Category not found: " + req.id));
                tag.setCategory(cat);
            }
            goal.getTags().add(tag);
        }
    }

    // ── Auto-credit from savings transactions ─────────────────────────────────

    /**
     * Called by TransactionService when a SAVING transaction is created or updated.
     * Finds all goals tagged with the item and adjusts current_amount by delta.
     * delta > 0 = money flowing in (is_in=true); delta < 0 = withdrawal
     * (is_in=false).
     */
    @Transactional
    public void adjustGoalsForSaving(Saving saving, double delta) {
        if (saving == null || delta == 0.0)
            return;

        Set<Long> updatedGoalIds = new HashSet<>();

        // 1. Check Item matches
        if (saving.getItem() != null) {
            List<InvestmentGoalTag> tags = tagRepository.findAllByItem(saving.getItem());
            for (InvestmentGoalTag tag : tags) {
                applyDelta(tag.getGoal(), delta, updatedGoalIds);
            }
        }

        // 2. Check SubCategory matches
        if (saving.getSubCategory() != null) {
            List<InvestmentGoalTag> tags = tagRepository.findAllBySubCategory(saving.getSubCategory());
            for (InvestmentGoalTag tag : tags) {
                applyDelta(tag.getGoal(), delta, updatedGoalIds);
            }
        }

        // 3. Check Category matches
        if (saving.getCategory() != null) {
            List<InvestmentGoalTag> tags = tagRepository.findAllByCategory(saving.getCategory());
            for (InvestmentGoalTag tag : tags) {
                applyDelta(tag.getGoal(), delta, updatedGoalIds);
            }
        }
    }

    private void applyDelta(InvestmentGoal goal, double delta, Set<Long> alreadyUpdated) {
        if (alreadyUpdated.contains(goal.getId()))
            return;
        // Acquire write lock to ensure accurate balance modifications
        InvestmentGoal lockedGoal = goalRepository.findByIdWithLock(goal.getId())
                .orElse(goal);
        double updated = lockedGoal.getCurrentAmount() + delta;
        lockedGoal.setCurrentAmount(Math.max(0.0, updated));

        // Option C: if current_value is explicitly set, carry the same delta forward
        if (lockedGoal.getCurrentValue() != null) {
            double updatedValue = lockedGoal.getCurrentValue() + delta;
            lockedGoal.setCurrentValue(Math.max(0.0, updatedValue));
            lockedGoal.setLastValueUpdatedAt(LocalDateTime.now());
        }

        goalRepository.save(lockedGoal);
        alreadyUpdated.add(lockedGoal.getId());
    }

    // ── Projection helpers ────────────────────────────────────────────────────

    /**
     * How many years until goal is reached given:
     * - current (PV) already saved
     * - monthlyContribution (PMT) added each month
     * - annualRate (%) compound growth
     *
     * Uses Future Value of annuity formula:
     * FV = PV*(1+r_m)^n + PMT*((1+r_m)^n - 1)/r_m
     * Solving for n:
     * let A = FV + PMT/r_m, B = PV + PMT/r_m
     * (1+r_m)^n = A/B
     * n = log(A/B) / log(1+r_m) (n in months)
     *
     * Falls back to simple compound-only if PMT=0.
     * Returns null when projection is impossible (no contribution, no current
     * amount).
     */
    private Double yearsToGoal(double current, double target, double annualRate, double monthlyContribution) {
        if (target <= 0)
            return null;
        if (current >= target)
            return 0.0;

        double r_m = annualRate / 12.0 / 100.0;
        double pmt = monthlyContribution;

        if (r_m <= 0) {
            // No growth — purely PMT-based
            if (pmt <= 0)
                return null;
            double months = (target - current) / pmt;
            return Math.round(months / 12.0 * 10.0) / 10.0;
        }

        if (pmt <= 0) {
            // No contributions — pure compound growth on current
            if (current <= 0)
                return null;
            double months = Math.log(target / current) / Math.log(1 + r_m);
            return Math.round(months / 12.0 * 10.0) / 10.0;
        }

        // General case: FV of annuity
        double A = target + pmt / r_m;
        double B = current + pmt / r_m;
        if (A <= 0 || B <= 0 || A <= B)
            return null; // edge cases
        double months = Math.log(A / B) / Math.log(1 + r_m);
        return Math.round(months / 12.0 * 10.0) / 10.0;
    }

    // ── DTO builder ───────────────────────────────────────────────────────────

    private Map<String, Object> toDto(InvestmentGoal goal) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", goal.getId());
        dto.put("name", goal.getName());
        dto.put("icon", goal.getIcon());
        dto.put("color", goal.getColor());
        dto.put("target_amount", goal.getTargetAmount());
        dto.put("current_amount", goal.getCurrentAmount());
        dto.put("current_value", goal.getCurrentValue());
        dto.put("last_value_updated_at", goal.getLastValueUpdatedAt());
        dto.put("monthly_contribution", goal.getMonthlyContribution());
        dto.put("annual_rate", goal.getAnnualRate());
        dto.put("notes", goal.getNotes());
        dto.put("is_closed", goal.getIsClosed());
        dto.put("closed_at", goal.getClosedAt());
        dto.put("created_at", goal.getCreatedAt());
        dto.put("goal_type", goal.getGoalType() != null ? goal.getGoalType().name() : "PERSISTENT");

        // Compute total spending funded from this goal
        List<Transaction> fundedTransactions = transactionRepository.findByFundingGoalAndUser(goal, goal.getUser());
        double totalFunded = fundedTransactions.stream().mapToDouble(Transaction::getValue).sum();
        dto.put("total_funded", totalFunded);

        // Tags: strip back-reference to goal to avoid cycles
        List<Map<String, Object>> tagDtos = new ArrayList<>();
        for (InvestmentGoalTag tag : goal.getTags()) {
            Map<String, Object> tagDto = new LinkedHashMap<>();
            tagDto.put("id", tag.getId());
            if (tag.getItem() != null) {
                tagDto.put("type", "ITEM");
                tagDto.put("item", tag.getItem());
            } else if (tag.getSubCategory() != null) {
                tagDto.put("type", "SUBCATEGORY");
                tagDto.put("subcategory", tag.getSubCategory());
            } else if (tag.getCategory() != null) {
                tagDto.put("type", "CATEGORY");
                tagDto.put("category", tag.getCategory());
            }
            tagDtos.add(tagDto);
        }
        dto.put("tags", tagDtos);

        // Projection uses current_amount (invested principal) as the base — not market value
        Double years = yearsToGoal(
                goal.getCurrentAmount(), goal.getTargetAmount(),
                goal.getAnnualRate(), goal.getMonthlyContribution());
        dto.put("years_to_goal", years);

        // Progress toward target: prefer current_value (market worth) when set
        double effectiveValue = goal.getCurrentValue() != null ? goal.getCurrentValue() : goal.getCurrentAmount();
        double pct = goal.getTargetAmount() > 0
                ? (effectiveValue / goal.getTargetAmount()) * 100.0
                : 0.0;
        dto.put("percent_achieved", Math.min(Math.round(pct * 10.0) / 10.0, 100.0));

        // Invested-only progress (for dual-segment bar on frontend)
        double investedPct = goal.getTargetAmount() > 0
                ? (goal.getCurrentAmount() / goal.getTargetAmount()) * 100.0
                : 0.0;
        dto.put("percent_invested", Math.min(Math.round(investedPct * 10.0) / 10.0, 100.0));

        // Returns (only meaningful when current_value is explicitly set)
        if (goal.getCurrentValue() != null && goal.getCurrentAmount() > 0) {
            double returnsAmount = goal.getCurrentValue() - goal.getCurrentAmount();
            double returnsPct = (returnsAmount / goal.getCurrentAmount()) * 100.0;
            dto.put("returns_amount", Math.round(returnsAmount * 100.0) / 100.0);
            dto.put("returns_percent", Math.round(returnsPct * 100.0) / 100.0);
        } else {
            dto.put("returns_amount", null);
            dto.put("returns_percent", null);
        }

        return dto;
    }

    // ── Goal Funding Helpers ──────────────────────────────────────────────────

    /**
     * Validates that the transaction amount does not exceed the available balance of the goal.
     * For PERSISTENT goals, available balance is goal.getCurrentAmount().
     * For ONE_TIME goals, available balance is goal.getCurrentAmount() - sum(other_funded_transactions).
     */
    public void validateOverdraft(Long goalId, double amount, Long excludeTransactionId) {
        InvestmentGoal goal = requireGoal(goalId);
        double available;
        if (GoalType.ONE_TIME.equals(goal.getGoalType())) {
            List<Transaction> funded = transactionRepository.findByFundingGoalAndUser(goal, goal.getUser());
            double otherFunded = funded.stream()
                    .filter(t -> t.getId() != null && !t.getId().equals(excludeTransactionId))
                    .mapToDouble(Transaction::getValue)
                    .sum();
            available = goal.getCurrentAmount() - otherFunded;
        } else {
            available = goal.getCurrentAmount();
        }

        if (amount > available) {
            throw new IllegalArgumentException(
                "Transaction value (₹" + amount + ") exceeds the goal's available balance (₹" + available + ")");
        }
    }

    /**
     * Deduct amount from a PERSISTENT goal's current_amount.
     * Throws IllegalArgumentException if amount exceeds the available limit.
     * For ONE_TIME goals, only performs validation and returns without deducting.
     */
    @Transactional
    public void deductFromGoal(Long goalId, double amount) {
        deductFromGoal(goalId, amount, null);
    }

    @Transactional
    public void deductFromGoal(Long goalId, double amount, Long excludeTransactionId) {
        InvestmentGoal goal = requireGoalWithLock(goalId);
        double available;
        if (GoalType.ONE_TIME.equals(goal.getGoalType())) {
            List<Transaction> funded = transactionRepository.findByFundingGoalAndUser(goal, goal.getUser());
            double otherFunded = funded.stream()
                    .filter(t -> t.getId() != null && !t.getId().equals(excludeTransactionId))
                    .mapToDouble(Transaction::getValue)
                    .sum();
            available = goal.getCurrentAmount() - otherFunded;
        } else {
            available = goal.getCurrentAmount();
        }

        if (amount > available) {
            throw new IllegalArgumentException(
                "Transaction value (₹" + amount + ") exceeds the goal's available balance (₹" + available + ")");
        }

        if (!GoalType.PERSISTENT.equals(goal.getGoalType())) return;
        goal.setCurrentAmount(goal.getCurrentAmount() - amount);
        goalRepository.save(goal);
    }

    /**
     * Restore amount to a PERSISTENT goal's current_amount.
     * No-op for ONE_TIME goals.
     */
    @Transactional
    public void restoreToGoal(Long goalId, double amount) {
        InvestmentGoal goal = requireGoalWithLock(goalId);
        if (!GoalType.PERSISTENT.equals(goal.getGoalType())) return;
        goal.setCurrentAmount(goal.getCurrentAmount() + amount);
        // Option C: propagate restore to current_value when set
        if (goal.getCurrentValue() != null) {
            goal.setCurrentValue(goal.getCurrentValue() + amount);
            goal.setLastValueUpdatedAt(LocalDateTime.now());
        }
        goalRepository.save(goal);
    }

    /**
     * Lightweight update: sets current_value and stamps last_value_updated_at.
     * Passing null clears the market-value tracking.
     */
    @Transactional
    public Map<String, Object> updateCurrentValue(Long goalId, Double newValue) {
        InvestmentGoal goal = requireGoalWithLock(goalId);
        goal.setCurrentValue(newValue);
        goal.setLastValueUpdatedAt(newValue != null ? LocalDateTime.now() : null);
        return toDto(goalRepository.save(goal));
    }

    /**
     * Cyclic dependency check: returns true if the transaction's CSI is tagged to the goal.
     */
    public boolean isTransactionTaggedToGoal(Transaction transaction, Long goalId) {
        InvestmentGoal goal = requireGoal(goalId);
        for (InvestmentGoalTag tag : goal.getTags()) {
            if (tag.getItem() != null && transaction.getItem() != null
                    && tag.getItem().getId().equals(transaction.getItem().getId())) return true;
            if (tag.getSubCategory() != null && transaction.getSubCategory() != null
                    && tag.getSubCategory().getId().equals(transaction.getSubCategory().getId())) return true;
            if (tag.getCategory() != null && transaction.getCategory() != null
                    && tag.getCategory().getId().equals(transaction.getCategory().getId())) return true;
        }
        return false;
    }

    // ── Guard ─────────────────────────────────────────────────────────────────

    public InvestmentGoal requireGoal(Long id) {
        User user = iamService.getCurrentUser();
        InvestmentGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Goal not found: " + id));
        if (!goal.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Access denied to goal: " + id);
        }
        return goal;
    }

    public InvestmentGoal requireGoalWithLock(Long id) {
        User user = iamService.getCurrentUser();
        InvestmentGoal goal = goalRepository.findByIdWithLock(id)
                .orElseThrow(() -> new NoSuchElementException("Goal not found: " + id));
        if (!goal.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Access denied to goal: " + id);
        }
        return goal;
    }
}
