package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Category;
import com.luna.Gringotts.records.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Page<Category> findByType(String type, Pageable pageable);
    Page<Category> findByUser(User user, Pageable pageable);
    Page<Category> findByTypeAndUser(String type, User user, Pageable pageable);
}

