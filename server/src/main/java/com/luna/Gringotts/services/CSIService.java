package com.luna.Gringotts.services;

import com.luna.Gringotts.records.Category;
import com.luna.Gringotts.records.Item;
import com.luna.Gringotts.records.SubCategory;
import com.luna.Gringotts.repository.CategoryRepository;
import com.luna.Gringotts.repository.ItemRepository;
import com.luna.Gringotts.repository.SubCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CSIService {

    @Autowired
    CategoryRepository categoryRepository;

    @Autowired
    SubCategoryRepository subCategoryRepository;

    @Autowired
    ItemRepository itemRepository;

    public Category addCategory(Category category){
        return categoryRepository.save(category);
    }

    @Transactional
    public SubCategory addSubCategory(SubCategory subCategory){
        SubCategory saved = subCategoryRepository.save(subCategory);
        // Refreshing the entity to fetch the associated Category details
        return subCategoryRepository.findById(saved.getId()).orElse(saved);
    }

    @Transactional
    public Item addItem(Item item){
        Item saved = itemRepository.save(item);
        // Refreshing the entity to fetch the associated SubCategory details
        return itemRepository.findById(saved.getId()).orElse(saved);
    }

    public void deleteCategory(Long id){
        categoryRepository.deleteById(id);
    }

    public void deleteSubCategory(Long id){
        subCategoryRepository.deleteById(id);
    }

    public void deleteItem(Long id){
        itemRepository.deleteById(id);
    }

    public Category updateCategory(Category category){
        return categoryRepository.save(category);
    }

    @Transactional
    public SubCategory updateSubCategory(SubCategory subCategory){
        SubCategory saved = subCategoryRepository.save(subCategory);
        return subCategoryRepository.findById(saved.getId()).orElse(saved);
    }

    @Transactional
    public Item updateItem(Item item){
        Item saved = itemRepository.save(item);
        return itemRepository.findById(saved.getId()).orElse(saved);
    }

    public Page<Category> getCategories(Pageable pageable){
        return categoryRepository.findAll(pageable);
    }

    public Page<Category> getCategoriesByType(String type, Pageable pageable){
        return categoryRepository.findByType(type, pageable);
    }

    public Page<SubCategory> getSubCategories(Long categoryId, Pageable pageable){
        return subCategoryRepository.findByCategoryId(categoryId,pageable);
    }

    public Page<Item> getItems(Long subCategoryId, Pageable pageable){
        return itemRepository.findBySubCategoryId(subCategoryId,pageable);
    }

    public Category getCategoryById(Long id){
        return categoryRepository.findById(id).orElse(null);
    }

    public SubCategory getSubCategoryById(Long id) {
        return subCategoryRepository.findById(id).orElse(null);
    }

    public Item getItemById(Long id) {
        return itemRepository.findById(id).orElse(null);
    }

}
