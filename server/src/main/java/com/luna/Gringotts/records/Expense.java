package com.luna.Gringotts.records;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "expense", schema = "public")
@PrimaryKeyJoinColumn(name = "id")
@OnDelete(action = OnDeleteAction.CASCADE)
public class Expense extends Transaction {

    @Column(name="payment_mode")
    String paymentMode;

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }
}
