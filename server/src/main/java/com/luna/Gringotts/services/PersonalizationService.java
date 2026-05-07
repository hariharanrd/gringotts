package com.luna.Gringotts.services;

import com.luna.Gringotts.records.Personalization;
import com.luna.Gringotts.records.User;
import com.luna.Gringotts.repository.PersonalizationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PersonalizationService {

    @Autowired
    private PersonalizationRepository personalizationRepository;

    @Autowired
    private IAMService iamService;

    public List<Personalization> getAllPersonalizations() {
        User user = iamService.getCurrentUser();
        return personalizationRepository.findByUser(user);
    }

    public List<Personalization> getPersonalizationsByCategory(String category) {
        User user = iamService.getCurrentUser();
        return personalizationRepository.findByUserAndCategory(user, category);
    }

    public Optional<Personalization> getPersonalization(String category, String configKey) {
        User user = iamService.getCurrentUser();
        return personalizationRepository.findByUserAndCategoryAndConfigKey(user, category, configKey);
    }

    public Personalization savePersonalization(Personalization personalization) {
        User user = iamService.getCurrentUser();
        
        Optional<Personalization> existing = personalizationRepository.findByUserAndCategoryAndConfigKey(
                user, personalization.getCategory(), personalization.getConfigKey());
        
        if (existing.isPresent()) {
            Personalization p = existing.get();
            p.setConfigValue(personalization.getConfigValue());
            return personalizationRepository.save(p);
        } else {
            personalization.setUser(user);
            return personalizationRepository.save(personalization);
        }
    }

    public void deletePersonalization(String category, String configKey) {
        User user = iamService.getCurrentUser();
        personalizationRepository.findByUserAndCategoryAndConfigKey(user, category, configKey)
                .ifPresent(personalizationRepository::delete);
    }
}
