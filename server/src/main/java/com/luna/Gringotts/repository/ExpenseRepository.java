package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Expense;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpenseRepository extends TransactionRepository<Expense> {

    @Override
    void deleteById(Long aLong);
}
