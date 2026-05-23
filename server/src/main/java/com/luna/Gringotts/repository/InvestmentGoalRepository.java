package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.InvestmentGoal;
import com.luna.Gringotts.records.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvestmentGoalRepository extends JpaRepository<InvestmentGoal, Long> {
    List<InvestmentGoal> findAllByUserOrderByCreatedAtDesc(User user);
    void deleteByUser(User user);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select g from InvestmentGoal g where g.id = :id")
    Optional<InvestmentGoal> findByIdWithLock(@Param("id") Long id);
}
