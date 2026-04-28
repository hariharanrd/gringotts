package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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

    public Expense(String refNo, LocalDateTime date, String description, Double value, ExpenseMode mode) {
        super(refNo, date, description, value);
        if (mode != null) {
            setPaymentMode(mode.toString());
        }
    }

    public enum ExpenseMode {
        UPI, DEBIT_CARD, CREDIT_CARD, CASH, NET_BANKING, WALLET, EMANDATE, OTHERS;
    }
}
