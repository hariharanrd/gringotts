package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.TransactionGroup;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionGroupRepository extends JpaRepository<TransactionGroup, Long> {

    // Owner-only: used for edit, delete, invite (operations that require ownership)
    Optional<TransactionGroup> findByIdAndUser(Long id, User user);

    // Accessible by owner OR accepted group member — used for listing and reading
    @Query("""
        SELECT tg FROM TransactionGroup tg
        WHERE tg.user = :user
           OR tg.id IN (
               SELECT gm.group.id FROM GroupMember gm
               WHERE gm.user = :user AND gm.status = 'ACCEPTED'
           )
        ORDER BY tg.createdAt DESC
        """)
    List<TransactionGroup> findAllAccessibleByUser(@Param("user") User user);

    // Accessible by owner OR accepted group member — used for single-group fetch
    @Query("""
        SELECT tg FROM TransactionGroup tg
        WHERE tg.id = :id
          AND (tg.user = :user
               OR tg.id IN (
                   SELECT gm.group.id FROM GroupMember gm
                   WHERE gm.user = :user AND gm.status = 'ACCEPTED'
               ))
        """)
    Optional<TransactionGroup> findByIdAccessibleByUser(@Param("id") Long id, @Param("user") User user);
}

