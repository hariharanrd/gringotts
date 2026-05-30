package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.User;
import com.luna.Gringotts.records.UserRecoveryInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRecoveryInfoRepository extends JpaRepository<UserRecoveryInfo, Long> {
    Optional<UserRecoveryInfo> findByUser(User user);
    Optional<UserRecoveryInfo> findByRecoveryEmailIgnoreCaseAndVerificationStatus(String recoveryEmail, String verificationStatus);
}
