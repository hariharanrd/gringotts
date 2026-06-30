package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.ImportJob;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ImportJobRepository extends JpaRepository<ImportJob, Long> {
    List<ImportJob> findByUserOrderByCreatedAtDesc(User user);
    Optional<ImportJob> findByIdAndUser(Long id, User user);
}
