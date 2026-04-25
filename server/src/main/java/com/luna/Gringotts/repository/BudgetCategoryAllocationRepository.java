package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.BudgetCategoryAllocation;
import com.luna.Gringotts.records.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetCategoryAllocationRepository extends JpaRepository<BudgetCategoryAllocation, Long> {
    boolean existsByCategoryId(Long categoryId);
}
