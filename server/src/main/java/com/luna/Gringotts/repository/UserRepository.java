package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.cache.annotation.Cacheable;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    @Cacheable("users")
    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);
}
