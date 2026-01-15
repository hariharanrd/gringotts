package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.SubCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubCategoryRepository extends JpaRepository<SubCategory, Long> {

    Page<SubCategory> findByCategoryId(Long categoryId, org.springframework.data.domain.Pageable pageable);
}
