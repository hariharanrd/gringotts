package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Category;
import com.luna.Gringotts.records.InvestmentGoal;
import com.luna.Gringotts.records.Item;
import com.luna.Gringotts.records.SubCategory;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestmentGoalRepository extends JpaRepository<InvestmentGoal, Long> {
    List<InvestmentGoal> findAllByUserOrderByCreatedAtDesc(User user);
    void deleteByUser(User user);
}
