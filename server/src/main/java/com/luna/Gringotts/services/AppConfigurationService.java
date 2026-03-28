package com.luna.Gringotts.services;

import com.luna.Gringotts.records.AppConfiguration;
import com.luna.Gringotts.repository.AppConfigurationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AppConfigurationService {

    @Autowired
    AppConfigurationRepository appConfigurationRepository;

    public String getValue(String category, String parameter, String defaultValue) {
        AppConfiguration config = appConfigurationRepository.findByCategoryAndParameter(category, parameter);
        String value = config.getValue();
        if(value != null){
            return value;
        }
        return defaultValue;
    }
}
