package com.luna.Gringotts.services;

import com.luna.Gringotts.records.Category;
import com.luna.Gringotts.records.Item;
import com.luna.Gringotts.records.SubCategory;
import com.luna.Gringotts.records.User;
import com.luna.Gringotts.repository.CategoryRepository;
import com.luna.Gringotts.repository.ItemRepository;
import com.luna.Gringotts.repository.SubCategoryRepository;
import com.luna.Gringotts.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

@Service
public class CSIService {

    @Autowired
    CategoryRepository categoryRepository;

    @Autowired
    SubCategoryRepository subCategoryRepository;

    @Autowired
    ItemRepository itemRepository;

    @Autowired
    public IAMService iamService;


    @CacheEvict(value = {"categories", "categoryById"}, allEntries = true)
    public Category addCategory(Category category){
        category.setUser(iamService.getCurrentUser());
        return categoryRepository.save(category);
    }

    @Transactional
    @CacheEvict(value = {"subCategories", "subCategoryById"}, allEntries = true)
    public SubCategory addSubCategory(SubCategory subCategory){
        SubCategory saved = subCategoryRepository.save(subCategory);
        // Refreshing the entity to fetch the associated Category details
        return subCategoryRepository.findById(saved.getId()).orElse(saved);
    }

    @Transactional
    @CacheEvict(value = {"items", "itemById"}, allEntries = true)
    public Item addItem(Item item){
        Item saved = itemRepository.save(item);
        // Refreshing the entity to fetch the associated SubCategory details
        return itemRepository.findById(saved.getId()).orElse(saved);
    }

    @CacheEvict(value = {"categories", "categoryById"}, allEntries = true)
    public void deleteCategory(Long id){
        categoryRepository.deleteById(id);
    }

    @CacheEvict(value = {"subCategories", "subCategoryById"}, allEntries = true)
    public void deleteSubCategory(Long id){
        subCategoryRepository.deleteById(id);
    }

    @CacheEvict(value = {"items", "itemById"}, allEntries = true)
    public void deleteItem(Long id){
        itemRepository.deleteById(id);
    }

    @CacheEvict(value = {"categories", "categoryById"}, allEntries = true)
    public Category updateCategory(Category category){
        category.setUser(iamService.getCurrentUser());
        return categoryRepository.save(category);
    }

    @Transactional
    @CacheEvict(value = {"subCategories", "subCategoryById"}, allEntries = true)
    public SubCategory updateSubCategory(SubCategory subCategory){
        SubCategory saved = subCategoryRepository.save(subCategory);
        return subCategoryRepository.findById(saved.getId()).orElse(saved);
    }

    @Transactional
    @CacheEvict(value = {"items", "itemById"}, allEntries = true)
    public Item updateItem(Item item){
        Item saved = itemRepository.save(item);
        return itemRepository.findById(saved.getId()).orElse(saved);
    }

    @Cacheable(value = "categories", key = "#root.target.iamService.getCurrentUser().id + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<Category> getCategories(Pageable pageable){
        return categoryRepository.findByUser(iamService.getCurrentUser(), pageable);
    }

    @Cacheable(value = "categories", key = "#root.target.iamService.getCurrentUser().id + '-' + #type + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<Category> getCategoriesByType(String type, Pageable pageable){
        return categoryRepository.findByTypeAndUser(type, iamService.getCurrentUser(), pageable);
    }

    @Cacheable(value = "subCategories", key = "#categoryId + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<SubCategory> getSubCategories(Long categoryId, Pageable pageable){
        return subCategoryRepository.findByCategoryId(categoryId,pageable);
    }

    @Cacheable(value = "items", key = "#subCategoryId + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<Item> getItems(Long subCategoryId, Pageable pageable){
        return itemRepository.findBySubCategoryId(subCategoryId,pageable);
    }

    @Cacheable(value = "categoryById", key = "#id")
    public Category getCategoryById(Long id){
        return categoryRepository.findById(id).orElse(null);
    }

    @Cacheable(value = "subCategoryById", key = "#id")
    public SubCategory getSubCategoryById(Long id) {
        return subCategoryRepository.findById(id).orElse(null);
    }

    @Cacheable(value = "itemById", key = "#id")
    public Item getItemById(Long id) {
        return itemRepository.findById(id).orElse(null);
    }

}
