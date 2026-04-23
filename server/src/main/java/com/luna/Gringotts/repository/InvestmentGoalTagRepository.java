package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestmentGoalTagRepository extends JpaRepository<InvestmentGoalTag, Long> {
    List<InvestmentGoalTag> findAllByItem(Item item);
    List<InvestmentGoalTag> findAllBySubCategory(SubCategory subCategory);
    List<InvestmentGoalTag> findAllByCategory(Category category);
    List<InvestmentGoalTag> findAllByGoal(InvestmentGoal goal);
}
