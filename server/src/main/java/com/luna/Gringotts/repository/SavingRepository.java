package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Saving;
import com.luna.Gringotts.records.User;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface SavingRepository extends TransactionRepository<Saving> {

    List<Saving> findByUserAndTransactionTimeBetweenAndIsInTrueAndIncludeInBudgetTrue(User user, LocalDateTime start, LocalDateTime end);

    void deleteByUser(User user);

    @Modifying
    @Query(value = "INSERT INTO public.saving (id, is_in) VALUES (:id, :isIn)", nativeQuery = true)
    void insertSaving(@Param("id") Long id, @Param("isIn") boolean isIn);

    @Modifying
    @Query(value = "DELETE FROM public.saving WHERE id = :id", nativeQuery = true)
    void deleteSavingRecord(@Param("id") Long id);
}
