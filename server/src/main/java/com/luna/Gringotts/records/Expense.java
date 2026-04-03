package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(name = "expense", schema = "public")
@PrimaryKeyJoinColumn(name = "id")
@OnDelete(action = OnDeleteAction.CASCADE)
public class Expense extends Transaction {

    public Expense() {

    }

    @Column(name = "payment_mode")
    @JsonProperty("payment_mode")
    String paymentMode;

    public Expense(String refNo, LocalDateTime date, String description, Double value, ExpenseMode mode) {
        super(refNo, date, description, value);
        if (mode != null) {
            this.paymentMode = mode.toString();
        }
    }

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public enum ExpenseMode {
        UPI, DEBIT_CARD, ATM, CREDIT_CARD, NET_BANKING, WALLET, EMANDATE, OTHERS;
    }
}
