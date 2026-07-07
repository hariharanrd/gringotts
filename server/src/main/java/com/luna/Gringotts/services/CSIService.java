package com.luna.Gringotts.services;

import java.util.Map;
import com.luna.Gringotts.records.Category;
import com.luna.Gringotts.records.Item;
import com.luna.Gringotts.records.SubCategory;
import com.luna.Gringotts.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private InvestmentGoalTagRepository investmentGoalTagRepository;

    @Autowired
    private BudgetCategoryAllocationRepository budgetCategoryAllocationRepository;


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
    public Map<String, Object> deleteCategory(Long id){
        Category category = categoryRepository.findByIdAndUser(id, iamService.getCurrentUser()).orElse(null);
        if (category == null) {
            return Map.of("status", "error", "message", "Category not found.", "status_code", 404);
        }
        if (subCategoryRepository.existsByCategoryId(id)) {
            return Map.of("status", "error", "message", "Cannot delete category as it has associated sub-categories.", "status_code", 409);
        }
        if (transactionRepository.existsByCategoryId(id)) {
            return Map.of("status", "error", "message", "Cannot delete category as it is associated with transactions.", "status_code", 409);
        }
        if (budgetCategoryAllocationRepository.existsByCategoryId(id)) {
            return Map.of("status", "error", "message", "Cannot delete category as it is used in budget allocations.", "status_code", 409);
        }
        if (investmentGoalTagRepository.existsByCategoryId(id)) {
            return Map.of("status", "error", "message", "Cannot delete category as it is tagged in investment goals.", "status_code", 409);
        }
        categoryRepository.deleteById(id);
        return Map.of("status", "success");
    }

    @CacheEvict(value = {"subCategories", "subCategoryById"}, allEntries = true)
    public Map<String, Object> deleteSubCategory(Long id){
        SubCategory subCategory = subCategoryRepository.findByIdAndCategoryUser(id, iamService.getCurrentUser()).orElse(null);
        if (subCategory == null) {
            return Map.of("status", "error", "message", "Sub-category not found.", "status_code", 404);
        }
        if (itemRepository.existsBySubCategoryId(id)) {
            return Map.of("status", "error", "message", "Cannot delete sub-category as it has associated items.", "status_code", 409);
        }
        if (transactionRepository.existsBySubCategoryId(id)) {
            return Map.of("status", "error", "message", "Cannot delete sub-category as it is associated with transactions.", "status_code", 409);
        }
        if (investmentGoalTagRepository.existsBySubCategoryId(id)) {
            return Map.of("status", "error", "message", "Cannot delete sub-category as it is tagged in investment goals.", "status_code", 409);
        }
        subCategoryRepository.deleteById(id);
        return Map.of("status", "success");
    }

    @CacheEvict(value = {"items", "itemById"}, allEntries = true)
    public Map<String, Object> deleteItem(Long id){
        Item item = itemRepository.findByIdAndSubCategoryCategoryUser(id, iamService.getCurrentUser()).orElse(null);
        if (item == null) {
            return Map.of("status", "error", "message", "Item not found.", "status_code", 404);
        }
        if (transactionRepository.existsByItemId(id)) {
            return Map.of("status", "error", "message", "Cannot delete item as it is associated with transactions.", "status_code", 409);
        }
        if (investmentGoalTagRepository.existsByItemId(id)) {
            return Map.of("status", "error", "message", "Cannot delete item as it is tagged in investment goals.", "status_code", 409);
        }
        itemRepository.deleteById(id);
        return Map.of("status", "success");
    }

    @CacheEvict(value = {"categories", "categoryById"}, allEntries = true)
    public Category updateCategory(Category category){
        Category existing = categoryRepository.findByIdAndUser(category.getId(), iamService.getCurrentUser()).orElse(null);
        if (existing == null) {
            throw new java.util.NoSuchElementException("Category not found: " + category.getId());
        }
        category.setUser(iamService.getCurrentUser());
        return categoryRepository.save(category);
    }

    @Transactional
    @CacheEvict(value = {"subCategories", "subCategoryById"}, allEntries = true)
    public SubCategory updateSubCategory(SubCategory subCategory){
        SubCategory existing = subCategoryRepository.findByIdAndCategoryUser(subCategory.getId(), iamService.getCurrentUser()).orElse(null);
        if (existing == null) {
            throw new java.util.NoSuchElementException("Sub-category not found: " + subCategory.getId());
        }
        SubCategory saved = subCategoryRepository.save(subCategory);
        return subCategoryRepository.findById(saved.getId()).orElse(saved);
    }

    @Transactional
    @CacheEvict(value = {"items", "itemById"}, allEntries = true)
    public Item updateItem(Item item){
        Item existing = itemRepository.findByIdAndSubCategoryCategoryUser(item.getId(), iamService.getCurrentUser()).orElse(null);
        if (existing == null) {
            throw new java.util.NoSuchElementException("Item not found: " + item.getId());
        }
        Item saved = itemRepository.save(item);
        return itemRepository.findById(saved.getId()).orElse(saved);
    }

    @Cacheable(value = "categories", key = "#root.target.iamService.getCurrentUser().id + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<Category> getCategories(Pageable pageable){
        return categoryRepository.findByUserOrderByTypeAscNameAsc(iamService.getCurrentUser(), pageable);
    }

    @Cacheable(value = "categories", key = "#root.target.iamService.getCurrentUser().id + '-' + #type + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<Category> getCategoriesByType(String type, Pageable pageable){
        return categoryRepository.findByTypeAndUserOrderByNameAsc(type, iamService.getCurrentUser(), pageable);
    }

    @Cacheable(value = "subCategories", key = "#root.target.iamService.getCurrentUser().id + '-' + #categoryId + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<SubCategory> getSubCategories(Long categoryId, Pageable pageable){
        categoryRepository.findByIdAndUser(categoryId, iamService.getCurrentUser())
                .orElseThrow(() -> new java.util.NoSuchElementException("Category not found: " + categoryId));
        return subCategoryRepository.findByCategoryId(categoryId,pageable);
    }

    @Cacheable(value = "items", key = "#root.target.iamService.getCurrentUser().id + '-' + #subCategoryId + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<Item> getItems(Long subCategoryId, Pageable pageable){
        subCategoryRepository.findByIdAndCategoryUser(subCategoryId, iamService.getCurrentUser())
                .orElseThrow(() -> new java.util.NoSuchElementException("Sub-category not found: " + subCategoryId));
        return itemRepository.findBySubCategoryId(subCategoryId,pageable);
    }

    public Page<SubCategory> getAllUserSubCategories(Pageable pageable) {
        return subCategoryRepository.findByCategoryUserOrderByNameAsc(iamService.getCurrentUser(), pageable);
    }

    public Page<SubCategory> getAllUserSubCategoriesBySearch(String search, Pageable pageable) {
        return subCategoryRepository.findByCategoryUserAndNameContainingIgnoreCaseOrderByNameAsc(iamService.getCurrentUser(), search, pageable);
    }

    public Page<SubCategory> getSubCategoriesByType(String type, Pageable pageable) {
        return subCategoryRepository.findByCategoryTypeAndCategoryUserOrderByNameAsc(type, iamService.getCurrentUser(), pageable);
    }

    public Page<SubCategory> getSubCategoriesByTypeAndSearch(String type, String search, Pageable pageable) {
        return subCategoryRepository.findByCategoryTypeAndCategoryUserAndNameContainingIgnoreCaseOrderByNameAsc(type, iamService.getCurrentUser(), search, pageable);
    }

    public Page<Item> getAllUserItems(Pageable pageable) {
        return itemRepository.findBySubCategoryCategoryUserOrderByNameAsc(iamService.getCurrentUser(), pageable);
    }

    public Page<Item> getAllUserItemsBySearch(String search, Pageable pageable) {
        return itemRepository.findBySubCategoryCategoryUserAndNameContainingIgnoreCaseOrderByNameAsc(iamService.getCurrentUser(), search, pageable);
    }

    public Page<Item> getItemsByType(String type, Pageable pageable) {
        return itemRepository.findBySubCategoryCategoryTypeAndSubCategoryCategoryUserOrderByNameAsc(type, iamService.getCurrentUser(), pageable);
    }

    public Page<Item> getItemsByTypeAndSearch(String type, String search, Pageable pageable) {
        return itemRepository.findBySubCategoryCategoryTypeAndSubCategoryCategoryUserAndNameContainingIgnoreCaseOrderByNameAsc(type, iamService.getCurrentUser(), search, pageable);
    }

    public Page<Category> getCategoriesBySearch(String search, Pageable pageable) {
        return categoryRepository.findByUserAndNameContainingIgnoreCaseOrderByTypeAscNameAsc(iamService.getCurrentUser(), search, pageable);
    }

    public Page<Category> getCategoriesByTypeAndSearch(String type, String search, Pageable pageable) {
        return categoryRepository.findByTypeAndUserAndNameContainingIgnoreCaseOrderByNameAsc(type, iamService.getCurrentUser(), search, pageable);
    }

    @Cacheable(value = "categoryById", key = "#root.target.iamService.getCurrentUser().id + '-' + #id")
    public Category getCategoryById(Long id){
        return categoryRepository.findByIdAndUser(id, iamService.getCurrentUser()).orElse(null);
    }

    @Cacheable(value = "subCategoryById", key = "#root.target.iamService.getCurrentUser().id + '-' + #id")
    public SubCategory getSubCategoryById(Long id) {
        return subCategoryRepository.findByIdAndCategoryUser(id, iamService.getCurrentUser()).orElse(null);
    }

    @Cacheable(value = "itemById", key = "#root.target.iamService.getCurrentUser().id + '-' + #id")
    public Item getItemById(Long id) {
        return itemRepository.findByIdAndSubCategoryCategoryUser(id, iamService.getCurrentUser()).orElse(null);
    }

}
