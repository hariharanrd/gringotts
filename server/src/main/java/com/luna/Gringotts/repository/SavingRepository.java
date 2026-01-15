package com.luna.Gringotts.repository;

import com.luna.Gringotts.records.Saving;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SavingRepository extends TransactionRepository<Saving> {
}
