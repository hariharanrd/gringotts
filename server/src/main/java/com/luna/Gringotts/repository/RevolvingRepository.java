package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Revolving;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.EntityGraph;

import java.time.LocalDateTime;
import java.util.List;

public interface RevolvingRepository extends TransactionRepository<Revolving> {

    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    List<Revolving> findByUserAndTransactionTimeBetweenAndClosedFalse(User user, LocalDateTime start, LocalDateTime end);

    @EntityGraph(attributePaths = {"category", "subCategory", "item"})
    List<Revolving> findByUserAndClosedFalse(User user);

}
