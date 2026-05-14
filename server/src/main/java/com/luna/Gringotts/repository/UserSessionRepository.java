package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.User;
import com.luna.Gringotts.records.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {
    Optional<UserSession> findByTokenId(String tokenId);
    List<UserSession> findAllByUserAndIsRevokedFalseOrderByLastActiveAtDesc(User user);
    List<UserSession> findAllByUser(User user);
}
