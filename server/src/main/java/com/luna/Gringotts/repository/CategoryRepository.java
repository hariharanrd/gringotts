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
    List<Category> findAllByUser(User user);
    void deleteByUser(User user);
}

