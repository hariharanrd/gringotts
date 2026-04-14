package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.TrustedBrowser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface TrustedBrowserRepository extends JpaRepository<TrustedBrowser, Long> {
    Optional<TrustedBrowser> findByToken(String token);
    
    @Transactional
    @Modifying
    void deleteByExpiresAtBefore(LocalDateTime now);
    
    void deleteByUsername(String username);
}
