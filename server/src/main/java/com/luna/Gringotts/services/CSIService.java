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
        return categoryRepository.findByUserOrderByTypeAscNameAsc(iamService.getCurrentUser(), pageable);
    }

    @Cacheable(value = "categories", key = "#root.target.iamService.getCurrentUser().id + '-' + #type + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<Category> getCategoriesByType(String type, Pageable pageable){
        return categoryRepository.findByTypeAndUserOrderByNameAsc(type, iamService.getCurrentUser(), pageable);
    }

    @Cacheable(value = "subCategories", key = "#categoryId + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<SubCategory> getSubCategories(Long categoryId, Pageable pageable){
        return subCategoryRepository.findByCategoryId(categoryId,pageable);
    }

    @Cacheable(value = "items", key = "#subCategoryId + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<Item> getItems(Long subCategoryId, Pageable pageable){
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
