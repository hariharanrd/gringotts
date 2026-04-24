package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Budget;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    Optional<Budget> findByIsMasterTrueAndUser(User user);

    Optional<Budget> findByMonthAndYearAndUser(int month, int year, User user);

    List<Budget> findAllByIsMasterFalseAndUserOrderByYearDescMonthDesc(User user);
    List<Budget> findAllByUser(User user);
    void deleteByUser(User user);
}
