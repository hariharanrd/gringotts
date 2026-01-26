package com.luna.Gringotts.services;

import com.luna.Gringotts.repository.AppConfigurationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AppConfigurationService {

    @Autowired
    AppConfigurationRepository appConfigurationRepository;

    public String getValue(String category, String parameter, String defaultValue) {
        String value = appConfigurationRepository.findByCategoryAndParameter(category, parameter);
        if(value != null){
            return value;
        }
        return defaultValue;
    }
}
