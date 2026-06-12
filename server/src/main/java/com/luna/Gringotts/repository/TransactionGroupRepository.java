package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.TransactionGroup;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionGroupRepository extends JpaRepository<TransactionGroup, Long> {
    List<TransactionGroup> findAllByUserOrderByCreatedAtDesc(User user);
    Optional<TransactionGroup> findByIdAndUser(Long id, User user);
}
