package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Expense;
import com.luna.Gringotts.records.User;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface ExpenseRepository extends TransactionRepository<Expense> {

    @Override
    void deleteById(Long aLong);

    void deleteByUser(User user);

    @Modifying
    @Query(value = "INSERT INTO public.expense (id) VALUES (:id)", nativeQuery = true)
    void insertExpense(@Param("id") Long id);

    @Modifying
    @Query(value = "DELETE FROM public.expense WHERE id = :id", nativeQuery = true)
    void deleteExpenseRecord(@Param("id") Long id);

    @Query("SELECT e FROM Expense e WHERE e.loan.id = :loanId AND e.loanPaymentType = 'EMI' " +
           "AND e.transactionTime >= :monthStart AND e.transactionTime < :monthEnd AND e.user = :user")
    List<Expense> findEmiExpensesForLoanInMonth(
        @Param("loanId") Long loanId, 
        @Param("monthStart") LocalDateTime monthStart, 
        @Param("monthEnd") LocalDateTime monthEnd, 
        @Param("user") User user
    );

    List<Expense> findByLoanIdAndUser(Long loanId, User user);
}
