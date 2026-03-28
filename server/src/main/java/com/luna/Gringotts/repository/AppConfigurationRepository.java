package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.AppConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppConfigurationRepository extends JpaRepository<AppConfiguration, Long> {

    public AppConfiguration findByCategoryAndParameter(String category, String parameter);
}
