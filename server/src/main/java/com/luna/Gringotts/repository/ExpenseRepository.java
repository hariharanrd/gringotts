package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Expense;
import com.luna.Gringotts.records.User;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface ExpenseRepository extends TransactionRepository<Expense> {

    @Override
    void deleteById(Long aLong);

    void deleteByUser(User user);

    @Modifying
    @Query(value = "INSERT INTO public.expense (id, payment_mode, credit_card_id) VALUES (:id, :mode, :ccid)", nativeQuery = true)
    void insertExpense(@Param("id") Long id, @Param("mode") String mode, @Param("ccid") Long ccid);

    @Modifying
    @Query(value = "DELETE FROM public.expense WHERE id = :id", nativeQuery = true)
    void deleteExpenseRecord(@Param("id") Long id);
}
