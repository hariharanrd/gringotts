package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.User;
import com.luna.Gringotts.records.ZohoIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ZohoIntegrationRepository extends JpaRepository<ZohoIntegration, Long> {
    Optional<ZohoIntegration> findByUser(User user);
    void deleteByUser(User user);
}
