package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository<T extends Transaction> extends JpaRepository<T, Long> {

    T findByDescriptionAndTransactionTime(String description, LocalDateTime transactionTime);

    List<T> findByDescription(String description);

    List<T> findByTransactionTimeAfter(LocalDateTime after);
}
