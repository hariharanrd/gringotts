package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.GroupBudget;
import com.luna.Gringotts.records.TransactionGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupBudgetRepository extends JpaRepository<GroupBudget, Long> {
    Optional<GroupBudget> findByGroup(TransactionGroup group);

    @Query("SELECT gb FROM GroupBudget gb WHERE gb.group = :group AND gb.month IS NULL AND gb.year IS NULL")
    Optional<GroupBudget> findMasterByGroup(@Param("group") TransactionGroup group);

    Optional<GroupBudget> findByGroupAndMonthAndYear(TransactionGroup group, Integer month, Integer year);

    List<GroupBudget> findByGroupOrderByYearDescMonthDesc(TransactionGroup group);

    void deleteByGroup(TransactionGroup group);
}
