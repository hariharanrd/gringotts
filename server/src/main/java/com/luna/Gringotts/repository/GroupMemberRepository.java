package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.TransactionGroup;
import com.luna.Gringotts.records.GroupMember;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByGroup(TransactionGroup group);

    Optional<GroupMember> findByGroupAndUser(TransactionGroup group, User user);

    @Query("SELECT gm FROM GroupMember gm WHERE gm.user = :user AND gm.status = 'PENDING' AND gm.expiresAt > :now")
    List<GroupMember> findActivePendingInvitationsByUser(@Param("user") User user, @Param("now") LocalDateTime now);
}
