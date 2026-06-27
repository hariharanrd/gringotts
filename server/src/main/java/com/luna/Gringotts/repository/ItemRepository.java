package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    Page<Item> findBySubCategoryId(Long subCategoryId, org.springframework.data.domain.Pageable pageable);

    Page<Item> findBySubCategoryCategoryUserOrderByNameAsc(com.luna.Gringotts.records.User user, org.springframework.data.domain.Pageable pageable);

    Page<Item> findBySubCategoryCategoryUserAndNameContainingIgnoreCaseOrderByNameAsc(com.luna.Gringotts.records.User user, String name, org.springframework.data.domain.Pageable pageable);

    Page<Item> findBySubCategoryCategoryTypeAndSubCategoryCategoryUserOrderByNameAsc(String type, com.luna.Gringotts.records.User user, org.springframework.data.domain.Pageable pageable);

    Page<Item> findBySubCategoryCategoryTypeAndSubCategoryCategoryUserAndNameContainingIgnoreCaseOrderByNameAsc(String type, com.luna.Gringotts.records.User user, String name, org.springframework.data.domain.Pageable pageable);

    boolean existsBySubCategoryId(Long subCategoryId);
}
