package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Personalization;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonalizationRepository extends JpaRepository<Personalization, Long> {
    List<Personalization> findByUser(User user);
    List<Personalization> findByUserAndCategory(User user, String category);
    Optional<Personalization> findByUserAndCategoryAndConfigKey(User user, String category, String configKey);
}
