package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.GroupCategory;
import com.luna.Gringotts.records.TransactionGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupCategoryRepository extends JpaRepository<GroupCategory, Long> {
    List<GroupCategory> findByGroupOrderByNameAsc(TransactionGroup group);
    Optional<GroupCategory> findByIdAndGroup(Long id, TransactionGroup group);
    Optional<GroupCategory> findByNameIgnoreCaseAndGroup(String name, TransactionGroup group);
    void deleteByGroup(TransactionGroup group);
}
