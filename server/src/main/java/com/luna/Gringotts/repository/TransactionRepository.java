package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface TransactionRepository<T extends Transaction> extends JpaRepository<T, Long> {

    T findByDescriptionAndTransactionTime(String description, LocalDateTime transactionTime);

    List<T> findByDescription(String description);

    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    List<T> findByTransactionTimeAfter(LocalDateTime after);

    @Override
    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    Page<T> findAll(Pageable pageable);
}
