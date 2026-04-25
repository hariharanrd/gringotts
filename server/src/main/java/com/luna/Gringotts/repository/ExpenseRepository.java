package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Expense;
import com.luna.Gringotts.records.User;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpenseRepository extends TransactionRepository<Expense> {

    @Override
    void deleteById(Long aLong);

    void deleteByUser(User user);
}
