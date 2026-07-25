package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.GroupBudgetCategoryAllocation;
import com.luna.Gringotts.records.GroupBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupBudgetCategoryAllocationRepository extends JpaRepository<GroupBudgetCategoryAllocation, Long> {
    List<GroupBudgetCategoryAllocation> findByGroupBudget(GroupBudget groupBudget);
    void deleteByGroupBudget(GroupBudget groupBudget);
}
