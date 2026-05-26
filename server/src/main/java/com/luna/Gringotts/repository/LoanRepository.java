package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Loan;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findAllByUserOrderByCreatedAtDesc(User user);
    Optional<Loan> findByIdAndUser(Long id, User user);
}
