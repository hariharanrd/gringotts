package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.CreditCard;
import com.luna.Gringotts.records.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CreditCardRepository extends JpaRepository<CreditCard, Long> {
    List<CreditCard> findAllByUserOrderByCreatedAtDesc(User user);
}
