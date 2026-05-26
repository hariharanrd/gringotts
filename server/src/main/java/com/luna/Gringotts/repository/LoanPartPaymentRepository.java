package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Loan;
import com.luna.Gringotts.records.LoanPartPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanPartPaymentRepository extends JpaRepository<LoanPartPayment, Long> {
    List<LoanPartPayment> findAllByLoanOrderByPaymentDateAsc(Loan loan);
}
