package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.PasswordResetToken;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    List<PasswordResetToken> findByUser(User user);
}
