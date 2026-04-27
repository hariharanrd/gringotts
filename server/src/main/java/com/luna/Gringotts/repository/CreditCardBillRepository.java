package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.CreditCard;
import com.luna.Gringotts.records.CreditCardBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CreditCardBillRepository extends JpaRepository<CreditCardBill, Long> {
    List<CreditCardBill> findAllByCreditCardOrderByBillingYearDescBillingMonthDesc(CreditCard card);
    Optional<CreditCardBill> findByCreditCardAndBillingMonthAndBillingYear(CreditCard card, int month, int year);
}
