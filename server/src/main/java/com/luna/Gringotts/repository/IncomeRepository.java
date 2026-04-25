package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Income;
import com.luna.Gringotts.records.User;
import org.springframework.stereotype.Repository;

@Repository
public interface IncomeRepository extends TransactionRepository<Income> {
    void deleteByUser(User user);
}
