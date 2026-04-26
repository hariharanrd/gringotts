package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Income;
import com.luna.Gringotts.records.User;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface IncomeRepository extends TransactionRepository<Income> {
    void deleteByUser(User user);

    @Modifying
    @Query(value = "INSERT INTO public.income (id, source) VALUES (:id, :source)", nativeQuery = true)
    void insertIncome(@Param("id") Long id, @Param("source") String source);

    @Modifying
    @Query(value = "DELETE FROM public.income WHERE id = :id", nativeQuery = true)
    void deleteIncomeRecord(@Param("id") Long id);
}
