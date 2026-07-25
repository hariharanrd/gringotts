package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.CreditCard;
import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.records.User;
import com.luna.Gringotts.records.InvestmentGoal;
import com.luna.Gringotts.records.TransactionGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface TransactionRepository<T extends Transaction> extends JpaRepository<T, Long>, JpaSpecificationExecutor<T> {

    java.util.Optional<T> findByIdAndUser(Long id, User user);


    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    List<T> findByUserAndTransactionTimeAfter(User user, LocalDateTime after);

    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    List<T> findByUserAndCreditCardAndTransactionTimeBetween(User user, CreditCard creditCard, LocalDateTime start, LocalDateTime end);

    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    List<T> findByUserAndTransactionTimeBetween(User user, LocalDateTime start, LocalDateTime end);

    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    List<T> findByUserAndTransactionTimeBetweenAndIncludeInBudgetTrue(User user, LocalDateTime start, LocalDateTime end);

    @Override
    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    Page<T> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    Page<T> findAll(Specification<T> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"fundingGoal", "category", "subCategory", "item"})
    List<T> findByFundingGoalAndUser(InvestmentGoal fundingGoal, User user);

    @EntityGraph(attributePaths = {"fundingGoal", "category", "subCategory", "item"})
    Page<T> findByFundingGoalAndUser(InvestmentGoal fundingGoal, User user, Pageable pageable);

    boolean existsByCategoryId(Long categoryId);
    boolean existsBySubCategoryId(Long subCategoryId);
    boolean existsByItemId(Long itemId);
    boolean existsByGroupCategoryId(Long groupCategoryId);

    @EntityGraph(attributePaths = {"category", "subCategory", "item", "group"})
    List<T> findByGroupAndUserOrderByTransactionTimeDesc(TransactionGroup group, User user);

    @EntityGraph(attributePaths = {"category", "subCategory", "item", "group"})
    List<T> findByGroupIdAndUser(Long groupId, User user);

    @EntityGraph(attributePaths = {"category", "subCategory", "item", "group"})
    List<T> findByGroupOrderByTransactionTimeDesc(TransactionGroup group);

    @EntityGraph(attributePaths = {"category", "subCategory", "item", "group"})
    Page<T> findByGroup(TransactionGroup group, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "subCategory", "item", "group"})
    Page<T> findByGroupAndUser(TransactionGroup group, User user, Pageable pageable);

    // Unified access-aware group transaction query.
    // When isShared=true (group is shared), all group transactions are returned regardless of owner.
    // When isShared=false, only the requesting user's transactions in the group are returned.
    @EntityGraph(attributePaths = {"category", "subCategory", "item", "group"})
    @Query("""
        SELECT t FROM Transaction t
        WHERE t.group = :group
          AND (:isShared = true OR t.user = :user)
        ORDER BY t.transactionTime DESC
        """)
    List<T> findByGroupWithAccess(
        @Param("group") TransactionGroup group,
        @Param("user") User user,
        @Param("isShared") boolean isShared);

    @EntityGraph(attributePaths = {"category", "subCategory", "item", "group"})
    @Query("""
        SELECT t FROM Transaction t
        WHERE t.group = :group
          AND (:isShared = true OR t.user = :user)
        ORDER BY t.transactionTime DESC
        """)
    Page<T> findByGroupWithAccess(
        @Param("group") TransactionGroup group,
        @Param("user") User user,
        @Param("isShared") boolean isShared,
        Pageable pageable);

    @Modifying
    @Query("UPDATE Transaction t SET t.group = null WHERE t.group.id = :groupId AND t.user = :user")
    void nullifyGroupByGroupIdAndUser(@Param("groupId") Long groupId, @Param("user") User user);

    @Modifying
    @Query("UPDATE Transaction t SET t.group = null WHERE t.group.id = :groupId")
    void nullifyGroupByGroupId(@Param("groupId") Long groupId);
}
