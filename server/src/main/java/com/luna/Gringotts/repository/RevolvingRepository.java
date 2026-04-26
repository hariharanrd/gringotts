package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Revolving;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.EntityGraph;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RevolvingRepository extends TransactionRepository<Revolving> {

    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    List<Revolving> findByUserAndTransactionTimeBetweenAndClosedFalseAndIsGiveTrue(User user, LocalDateTime start, LocalDateTime end);

    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    List<Revolving> findByUserAndClosedFalse(User user);

    void deleteByUser(User user);

    @Modifying
    @Query(value = "INSERT INTO public.revolving (id, is_give, closed) VALUES (:id, :isGive, :closed)", nativeQuery = true)
    void insertRevolving(@Param("id") Long id, @Param("isGive") boolean isGive, @Param("closed") boolean closed);

    @Modifying
    @Query(value = "DELETE FROM public.revolving WHERE id = :id", nativeQuery = true)
    void deleteRevolvingRecord(@Param("id") Long id);
}
