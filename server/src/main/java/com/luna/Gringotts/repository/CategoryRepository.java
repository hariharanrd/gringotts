package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Category;
import com.luna.Gringotts.records.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Page<Category> findByUserOrderByTypeAscNameAsc(User user, Pageable pageable);
    Page<Category> findByTypeAndUserOrderByNameAsc(String type, User user, Pageable pageable);
    Page<Category> findByUserAndNameContainingIgnoreCaseOrderByTypeAscNameAsc(User user, String name, Pageable pageable);
    Page<Category> findByTypeAndUserAndNameContainingIgnoreCaseOrderByNameAsc(String type, User user, String name, Pageable pageable);
    List<Category> findAllByUser(User user);
    java.util.Optional<Category> findByNameIgnoreCaseAndUser(String name, User user);
    void deleteByUser(User user);
}

