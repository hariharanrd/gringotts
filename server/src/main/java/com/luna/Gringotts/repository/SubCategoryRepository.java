package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.SubCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubCategoryRepository extends JpaRepository<SubCategory, Long> {

    Page<SubCategory> findByCategoryId(Long categoryId, org.springframework.data.domain.Pageable pageable);

    Page<SubCategory> findByCategoryUserOrderByNameAsc(com.luna.Gringotts.records.User user, org.springframework.data.domain.Pageable pageable);

    Page<SubCategory> findByCategoryUserAndNameContainingIgnoreCaseOrderByNameAsc(com.luna.Gringotts.records.User user, String name, org.springframework.data.domain.Pageable pageable);

    Page<SubCategory> findByCategoryTypeAndCategoryUserOrderByNameAsc(String type, com.luna.Gringotts.records.User user, org.springframework.data.domain.Pageable pageable);

    Page<SubCategory> findByCategoryTypeAndCategoryUserAndNameContainingIgnoreCaseOrderByNameAsc(String type, com.luna.Gringotts.records.User user, String name, org.springframework.data.domain.Pageable pageable);

    boolean existsByCategoryId(Long categoryId);
}
