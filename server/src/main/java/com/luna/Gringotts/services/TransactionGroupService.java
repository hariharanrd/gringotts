package com.luna.Gringotts.services;

import com.luna.Gringotts.records.Saving;
import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.records.TransactionGroup;
import com.luna.Gringotts.records.User;
import com.luna.Gringotts.records.GroupCategory;
import com.luna.Gringotts.records.GroupMember;
import com.luna.Gringotts.repository.TransactionGroupRepository;
import com.luna.Gringotts.repository.TransactionRepository;
import com.luna.Gringotts.repository.GroupCategoryRepository;
import com.luna.Gringotts.repository.GroupMemberRepository;
import com.luna.Gringotts.repository.UserRepository;
import com.luna.Gringotts.repository.UserRecoveryInfoRepository;
import com.luna.Gringotts.records.UserRecoveryInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;

@Service
public class TransactionGroupService {

    @Autowired
    private TransactionGroupRepository transactionGroupRepository;

    @Autowired
    private TransactionRepository<Transaction> transactionRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRecoveryInfoRepository userRecoveryInfoRepository;

    @Autowired
    private IAMService iamService;

    @Autowired
    private GroupCategoryRepository groupCategoryRepository;

    public List<TransactionGroup> getAllGroups() {
        User user = iamService.getCurrentUser();
        return transactionGroupRepository.findAllAccessibleByUser(user);
    }

    public Optional<TransactionGroup> getGroupById(Long id) {
        User user = iamService.getCurrentUser();
        return transactionGroupRepository.findByIdAccessibleByUser(id, user);
    }

    public TransactionGroup getGroupForUser(Long groupId, User user) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        return transactionGroupRepository.findByIdAccessibleByUser(groupId, user)
                .orElseThrow(() -> new IllegalArgumentException("Group not found or access denied"));
    }

    private void validateGroupAllowedTypes(TransactionGroup group) {
        if (!group.isAllowsExpense() && !group.isAllowsIncome() && 
            !group.isAllowsSaving() && !group.isAllowsRevolving()) {
            throw new IllegalArgumentException("A transaction group must allow at least one type of transaction.");
        }
    }

    public TransactionGroup createGroup(TransactionGroup group) {
        User user = iamService.getCurrentUser();
        group.setUser(user);
        if (group.getStatus() == null) {
            group.setStatus("ACTIVE");
        }
        if (group.getType() == null) {
            group.setType("CUSTOM");
        }
        validateGroupAllowedTypes(group);
        return transactionGroupRepository.save(group);
    }

    public TransactionGroup updateGroup(Long id, TransactionGroup incoming) {
        User user = iamService.getCurrentUser();
        TransactionGroup existing = transactionGroupRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Group not found or access denied"));

        existing.setName(incoming.getName());
        existing.setDescription(incoming.getDescription());
        if (incoming.getType() != null) {
            existing.setType(incoming.getType());
        }
        existing.setIcon(incoming.getIcon());
        existing.setColor(incoming.getColor());
        if (incoming.getStatus() != null) {
            existing.setStatus(incoming.getStatus());
        }
        existing.setAllowsExpense(incoming.isAllowsExpense());
        existing.setAllowsIncome(incoming.isAllowsIncome());
        existing.setAllowsSaving(incoming.isAllowsSaving());
        existing.setAllowsRevolving(incoming.isAllowsRevolving());
        existing.setThumbnail(incoming.getThumbnail());

        validateGroupAllowedTypes(existing);
        return transactionGroupRepository.save(existing);
    }

    @Transactional
    public void deleteGroup(Long id) {
        User user = iamService.getCurrentUser();
        // Only the owner can delete a group
        TransactionGroup group = transactionGroupRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Group not found or access denied"));

        // Nullify group reference on all transactions in this group (across all members)
        transactionRepository.nullifyGroupByGroupId(id);

        transactionGroupRepository.delete(group);
    }

    public List<Transaction> getGroupTransactions(Long groupId) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = getGroupForUser(groupId, user);
        return transactionRepository.findByGroupWithAccess(group, user, group.isShared());
    }

    public Page<Transaction> getGroupTransactionsPaginated(Long groupId, Pageable pageable) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = getGroupForUser(groupId, user);
        return transactionRepository.findByGroupWithAccess(group, user, group.isShared(), pageable);
    }

    public Map<String, Object> getGroupStatistics(Long groupId) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = getGroupForUser(groupId, user);

        List<Transaction> transactions = transactionRepository.findByGroupWithAccess(group, user, group.isShared());

        double totalExpenses = 0.0;
        double totalIncomes = 0.0;
        double totalSavings = 0.0;

        Map<String, Double> categoryBreakdown = new HashMap<>();
        Map<String, Double> subcategoryBreakdown = new HashMap<>();
        Map<String, Double> itemBreakdown = new HashMap<>();
        boolean hasSubcategoryData = false;
        boolean hasItemData = false;

        for (Transaction t : transactions) {
            double val = t.getValue();

            String categoryName = "Uncategorized";
            if (t.getGroupCategory() != null) {
                categoryName = t.getGroupCategory().getName();
            }
            categoryBreakdown.put(categoryName, categoryBreakdown.getOrDefault(categoryName, 0.0) + val);

            if ("EXPENSE".equals(t.getType())) {
                totalExpenses += val;
            } else if ("INCOME".equals(t.getType())) {
                totalIncomes += val;
            } else if ("SAVING".equals(t.getType())) {
                if (t instanceof Saving s) {
                    boolean isIn = Boolean.TRUE.equals(s.getIsIn());
                    totalSavings += isIn ? val : -val;
                } else {
                    totalSavings += val;
                }
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("total_expenses", totalExpenses);
        stats.put("total_incomes", totalIncomes);
        stats.put("total_savings", totalSavings);
        stats.put("category_breakdown", categoryBreakdown);
        stats.put("subcategory_breakdown", subcategoryBreakdown);
        stats.put("item_breakdown", itemBreakdown);
        stats.put("has_subcategory_data", hasSubcategoryData);
        stats.put("has_item_data", hasItemData);

        return stats;
    }

    public List<GroupCategory> getGroupCategories(Long groupId) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = getGroupForUser(groupId, user);
        return groupCategoryRepository.findByGroupOrderByNameAsc(group);
    }

    public GroupCategory createGroupCategory(Long groupId, GroupCategory category) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = transactionGroupRepository.findByIdAndUser(groupId, user)
                .orElseThrow(() -> new IllegalArgumentException("Group not found or access denied"));

        if (groupCategoryRepository.findByNameIgnoreCaseAndGroup(category.getName(), group).isPresent()) {
            throw new IllegalArgumentException("A category with this name already exists in this group");
        }

        category.setGroup(group);
        category.setUser(user);
        return groupCategoryRepository.save(category);
    }

    public GroupCategory updateGroupCategory(Long groupId, Long catId, GroupCategory incoming) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = transactionGroupRepository.findByIdAndUser(groupId, user)
                .orElseThrow(() -> new IllegalArgumentException("Group not found or access denied"));

        GroupCategory existing = groupCategoryRepository.findByIdAndGroup(catId, group)
                .orElseThrow(() -> new IllegalArgumentException("Category not found in this group"));

        Optional<GroupCategory> duplicate = groupCategoryRepository.findByNameIgnoreCaseAndGroup(incoming.getName(), group);
        if (duplicate.isPresent() && !duplicate.get().getId().equals(catId)) {
            throw new IllegalArgumentException("A category with this name already exists in this group");
        }

        existing.setName(incoming.getName());
        existing.setDescription(incoming.getDescription());
        existing.setIcon(incoming.getIcon());
        existing.setColor(incoming.getColor());
        return groupCategoryRepository.save(existing);
    }

    @Transactional
    public void deleteGroupCategory(Long groupId, Long catId) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = transactionGroupRepository.findByIdAndUser(groupId, user)
                .orElseThrow(() -> new IllegalArgumentException("Group not found or access denied"));

        GroupCategory category = groupCategoryRepository.findByIdAndGroup(catId, group)
                .orElseThrow(() -> new IllegalArgumentException("Category not found in this group"));

        groupCategoryRepository.delete(category);
    }

    public String getGroupThumbnail(Long groupId) {
        User user = iamService.getCurrentUser();
        return getGroupForUser(groupId, user).getThumbnail();
    }

    public List<GroupMember> getGroupMembers(Long groupId) {
        User user = iamService.getCurrentUser();
        TransactionGroup group = getGroupForUser(groupId, user);
        
        List<GroupMember> members = new ArrayList<>(groupMemberRepository.findByGroup(group));
        
        boolean hasOwner = false;
        for (GroupMember gm : members) {
            if (gm.getUser().getId().equals(group.getUser().getId())) {
                hasOwner = true;
                break;
            }
        }
        
        if (!hasOwner) {
            GroupMember ownerMember = new GroupMember();
            ownerMember.setGroup(group);
            ownerMember.setUser(group.getUser());
            ownerMember.setRole("ADMIN");
            ownerMember.setStatus("ACCEPTED");
            ownerMember.setInvitedBy(group.getUser());
            members.add(0, ownerMember);
        }
        
        return members;
    }

    @Transactional
    public void inviteMember(Long groupId, String identifier) {
        User currentUser = iamService.getCurrentUser();
        TransactionGroup group = transactionGroupRepository.findByIdAndUser(groupId, currentUser)
                .orElseThrow(() -> new IllegalArgumentException("Group not found or access denied"));
                
        Optional<User> targetUserOpt = userRepository.findByUsername(identifier.toLowerCase());
        if (targetUserOpt.isEmpty()) {
            // Try looking up by verified recovery email
            Optional<UserRecoveryInfo> recoveryOpt = userRecoveryInfoRepository.findByRecoveryEmailIgnoreCaseAndVerificationStatus(identifier, "VERIFIED");
            if (recoveryOpt.isPresent()) {
                targetUserOpt = Optional.of(recoveryOpt.get().getUser());
            }
        }
        User targetUser = targetUserOpt.orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        if (targetUser.getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Cannot invite yourself");
        }
        
        Optional<GroupMember> existing = groupMemberRepository.findByGroupAndUser(group, targetUser);
        if (existing.isPresent()) {
            GroupMember gm = existing.get();
            if ("ACCEPTED".equals(gm.getStatus())) {
                throw new IllegalArgumentException("User is already a member of this group");
            }
            if ("PENDING".equals(gm.getStatus()) && gm.getExpiresAt().isAfter(LocalDateTime.now())) {
                throw new IllegalArgumentException("An invitation to this user is already pending");
            }
        }
        
        GroupMember member = existing.orElseGet(GroupMember::new);
        member.setGroup(group);
        member.setUser(targetUser);
        member.setRole("MEMBER");
        member.setStatus("PENDING");
        member.setInvitedAt(LocalDateTime.now());
        member.setExpiresAt(LocalDateTime.now().plusDays(7));
        member.setInvitedBy(currentUser);
        groupMemberRepository.save(member);
    }

    public List<GroupMember> getPendingInvitations() {
        User user = iamService.getCurrentUser();
        return groupMemberRepository.findActivePendingInvitationsByUser(user, LocalDateTime.now());
    }

    @Transactional
    public void acceptInvitation(Long memberId) {
        User currentUser = iamService.getCurrentUser();
        GroupMember gm = groupMemberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));
                
        if (!gm.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Access denied");
        }
        
        if (!"PENDING".equals(gm.getStatus()) || gm.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invitation is not valid or has expired");
        }
        
        gm.setStatus("ACCEPTED");
        gm.setAcceptedAt(LocalDateTime.now());
        groupMemberRepository.save(gm);
        
        TransactionGroup group = gm.getGroup();
        if (!group.isShared()) {
            group.setShared(true);
            transactionGroupRepository.save(group);
        }
    }

    @Transactional
    public void declineInvitation(Long memberId) {
        User currentUser = iamService.getCurrentUser();
        GroupMember gm = groupMemberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));
                
        if (!gm.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Access denied");
        }
        
        if (!"PENDING".equals(gm.getStatus()) || gm.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invitation is not valid or has expired");
        }
        
        gm.setStatus("DECLINED");
        groupMemberRepository.save(gm);
    }

    @Transactional
    public void removeMember(Long groupId, Long userId) {
        User currentUser = iamService.getCurrentUser();
        TransactionGroup group = transactionGroupRepository.findByIdAndUser(groupId, currentUser)
                .orElseThrow(() -> new IllegalArgumentException("Group not found or access denied"));
                
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        GroupMember gm = groupMemberRepository.findByGroupAndUser(group, targetUser)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));
                
        gm.setStatus("REMOVED");
        groupMemberRepository.save(gm);
    }

    @Transactional
    public void leaveGroup(Long groupId) {
        User currentUser = iamService.getCurrentUser();
        TransactionGroup group = getGroupForUser(groupId, currentUser);
        
        if (group.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Owner cannot leave the group. Delete the group instead.");
        }
        
        GroupMember gm = groupMemberRepository.findByGroupAndUser(group, currentUser)
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));
                
        if (!"ACCEPTED".equals(gm.getStatus())) {
            throw new IllegalArgumentException("You are not an active member of this group");
        }
        
        gm.setStatus("LEFT");
        groupMemberRepository.save(gm);
    }
}
