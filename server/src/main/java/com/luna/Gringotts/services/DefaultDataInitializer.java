package com.luna.Gringotts.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.luna.Gringotts.records.Category;
import com.luna.Gringotts.records.User;
import com.luna.Gringotts.repository.CategoryRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

@Service
public class DefaultDataInitializer {

    private static final Logger LOGGER = Logger.getLogger(DefaultDataInitializer.class.getName());

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ResourceLoader resourceLoader;

    private List<Category> defaultCategories = new ArrayList<>();

    @PostConstruct
    public void init() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Resource resource = resourceLoader.getResource("classpath:default-categories.json");
            try (InputStream inputStream = resource.getInputStream()) {
                defaultCategories = mapper.readValue(inputStream, new TypeReference<List<Category>>() {});
                LOGGER.info("Loaded " + defaultCategories.size() + " default categories from JSON.");
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Failed to load default categories", e);
        }
    }

    public void initializeCategories(User user) {
        if (defaultCategories.isEmpty()) {
            LOGGER.warning("No default categories loaded to initialize for user: " + user.getUsername());
            return;
        }

        for (Category defaultCat : defaultCategories) {
            Category category = new Category();
            category.setName(defaultCat.getName());
            category.setType(defaultCat.getType());
            category.setIcon(defaultCat.getIcon());
            category.setColor(defaultCat.getColor());
            category.setUser(user);
            categoryRepository.save(category);
        }
        LOGGER.info("Initialized default categories for user: " + user.getUsername());
    }
}
