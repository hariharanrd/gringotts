package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.ScheduledTransaction;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduledTransactionRepository extends JpaRepository<ScheduledTransaction, Long> {

    List<ScheduledTransaction> findByUserOrderByNextRunDateAscIdAsc(User user);

    List<ScheduledTransaction> findByUserAndIsActiveTrue(User user);

    List<ScheduledTransaction> findByUserAndIsActiveTrueAndNextRunDateLessThanEqual(User user, LocalDate date);

    List<ScheduledTransaction> findByIsActiveTrueAndNextRunDateLessThanEqual(LocalDate date);

}
