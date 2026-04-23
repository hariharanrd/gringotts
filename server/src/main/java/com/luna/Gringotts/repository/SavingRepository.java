package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Saving;
import com.luna.Gringotts.records.User;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Repository;

@Repository
public interface SavingRepository extends TransactionRepository<Saving> {

    List<Saving> findByUserAndTransactionTimeBetweenAndIsInTrue(User user, LocalDateTime start, LocalDateTime end);
}
