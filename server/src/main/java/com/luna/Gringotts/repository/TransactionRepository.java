package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Transaction;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.JpaRepository;
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


    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    List<T> findByUserAndTransactionTimeAfter(User user, LocalDateTime after);

    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    List<T> findByUserAndTransactionTimeBetween(User user, LocalDateTime start, LocalDateTime end);

    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    List<T> findByUserAndTransactionTimeBetweenAndIncludeInBudgetTrue(User user, LocalDateTime start, LocalDateTime end);

    @Override
    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    Page<T> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    Page<T> findAll(Specification<T> spec, Pageable pageable);

    boolean existsByCategoryId(Long categoryId);
    boolean existsBySubCategoryId(Long subCategoryId);
    boolean existsByItemId(Long itemId);
}
