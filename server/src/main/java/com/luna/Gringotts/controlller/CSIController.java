package com.luna.Gringotts.controlller;

import com.luna.Gringotts.records.Category;
import com.luna.Gringotts.records.Item;
import com.luna.Gringotts.records.SubCategory;
import com.luna.Gringotts.services.CSIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/api/v1")
public class CSIController {


    @Autowired
    private CSIService CSIService;

    @GetMapping("/categories")
    public ResponseEntity<Map<String,Object>> getCategories(){
        Pageable pageable = Pageable.ofSize(100);
        Page<Category> categories = CSIService.getCategories(pageable);
        HashMap<String,Object> response = new HashMap<>();
        response.put("data",categories.getContent());
        response.put("total_count",categories.getTotalElements());
        response.put("page",pageable.getPageNumber());
        response.put("has_more",categories.hasNext());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/categories/{categoryId}/subcategories")
    public ResponseEntity<Map<String,Object>> getSubCategories(@PathVariable String categoryId){
        Pageable pageable = Pageable.ofSize(100);
        Category category = CSIService.getCategoryById(Long.parseLong(categoryId));
        if(category == null){
            return ResponseEntity.notFound().build();
        }
        Page<SubCategory> result = CSIService.getSubCategories(category.getId(), pageable);
        HashMap<String,Object> response = new HashMap<>();
        response.put("data",result.getContent());
        response.put("total_count",result.getTotalElements());
        response.put("page",pageable.getPageNumber());
        response.put("has_more",result.hasNext());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/subcategories/{subCategoryId}/items")
    public ResponseEntity<Map<String,Object>> getItems(@PathVariable String subCategoryId){
        Pageable pageable = Pageable.ofSize(100);

        SubCategory subCategory = CSIService.getSubCategoryById(Long.parseLong(subCategoryId));
        if(subCategory == null){
            return ResponseEntity.notFound().build();
        }

        Page<com.luna.Gringotts.records.Item> result = CSIService.getItems(Long.parseLong(subCategoryId),pageable);
        HashMap<String,Object> response = new HashMap<>();
        response.put("data",result.getContent());
        response.put("total_count",result.getTotalElements());
        response.put("page",pageable.getPageNumber());
        response.put("has_more",result.hasNext());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<Map<String,Object>> getCategoryById(@PathVariable Long id){
        Category category = CSIService.getCategoryById(id);
        if(category == null){
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("category",category,"status","success"));
    }

    @GetMapping("/subcategories/{id}")
    public ResponseEntity<Map<String,Object>> getSubCategoryById(@PathVariable Long id){

        SubCategory subCategory = CSIService.getSubCategoryById(id);
        if(subCategory == null){
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("sub_category",subCategory,"status","success"));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<Map<String,Object>> getItemById(@PathVariable Long id){
        Item item = CSIService.getItemById(id);
        if(item == null){
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of("item",item,"status","success"));
    }

    @PostMapping("/categories")
    public ResponseEntity<Map<String,Object>> addCategory(@RequestBody Category category){
        Category added = CSIService.addCategory(category);
        return ResponseEntity.ok(Map.of("category",added,"status","success"));
    }

    @PostMapping("/subcategories")
    public ResponseEntity<Map<String,Object>> addSubCategory(@RequestBody SubCategory subCategory) {
        SubCategory added = CSIService.addSubCategory(subCategory);
        return ResponseEntity.ok(Map.of("sub_category", added, "status", "success"));
    }

    @PostMapping("/items")
    public ResponseEntity<Map<String,Object>> addItem(@RequestBody Item item) {
        Item added = CSIService.addItem(item);
        return ResponseEntity.ok(Map.of("item",added,"status", "success"));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Map<String,Object>> updateCategory(@RequestBody Category category, @PathVariable Long id){
        category.setId(id);
        Category updated = CSIService.updateCategory(category);
        return ResponseEntity.ok(Map.of("category", updated, "status","success"));
    }

    @PutMapping("/subcategories/{id}")
    public ResponseEntity<Map<String,Object>> updateSubCategory(@RequestBody SubCategory subCategory, @PathVariable Long id){
        SubCategory existing = CSIService.getSubCategoryById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        subCategory.setId(id);
        subCategory.setCategory(existing.getCategory());
        SubCategory updated = CSIService.updateSubCategory(subCategory);
        return ResponseEntity.ok(Map.of("sub_category", updated, "status","success"));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<Map<String,Object>> updateItem(@RequestBody Item item, @PathVariable Long id){
        Item existing = CSIService.getItemById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        item.setId(id);
        item.setSubCategory(existing.getSubCategory());
        Item updated = CSIService.updateItem(item);
        return ResponseEntity.ok(Map.of("item", updated, "status","success"));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Map<String,Object>> deleteCategory(@PathVariable Long id){
        CSIService.deleteCategory(id);
        return ResponseEntity.ok(Map.of("status","success"));
    }

    @DeleteMapping("/subcategories/{id}")
    public ResponseEntity<Map<String,Object>> deleteSubCategory(@PathVariable Long id){
        CSIService.deleteSubCategory(id);
        return ResponseEntity.ok(Map.of("status","success"));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Map<String,Object>> deleteItem(@PathVariable Long id){
        CSIService.deleteItem(id);
        return ResponseEntity.ok(Map.of("status","success"));
    }

}
