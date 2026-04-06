package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    Optional<Budget> findByIsMasterTrue();

    Optional<Budget> findByMonthAndYear(int month, int year);

    List<Budget> findAllByIsMasterFalseOrderByYearDescMonthDesc();
}
