package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "credit_card_bill", schema = "public")
public class CreditCardBill {

    public CreditCardBill() {}

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "credit_card_bill_seq_gen")
    @SequenceGenerator(name = "credit_card_bill_seq_gen", sequenceName = "credit_card_bill_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_card_id", nullable = false)
    @JsonProperty("credit_card_id")
    private CreditCard creditCard;

    @Column(name = "billing_month", nullable = false)
    @JsonProperty("billing_month")
    private Integer billingMonth;

    @Column(name = "billing_year", nullable = false)
    @JsonProperty("billing_year")
    private Integer billingYear;

    @Column(name = "amount_due", nullable = false)
    @JsonProperty("amount_due")
    private Double amountDue = 0.0;

    @Column(name = "amount_paid", nullable = false)
    @JsonProperty("amount_paid")
    private Double amountPaid = 0.0;

    @Column(name = "payment_status", nullable = false)
    @JsonProperty("payment_status")
    private String paymentStatus = "UNPAID";

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CreditCard getCreditCard() { return creditCard; }
    public void setCreditCard(CreditCard creditCard) { this.creditCard = creditCard; }
    public Integer getBillingMonth() { return billingMonth; }
    public void setBillingMonth(Integer billingMonth) { this.billingMonth = billingMonth; }
    public Integer getBillingYear() { return billingYear; }
    public void setBillingYear(Integer billingYear) { this.billingYear = billingYear; }
    public Double getAmountDue() { return amountDue; }
    public void setAmountDue(Double amountDue) { this.amountDue = amountDue; }
    public Double getAmountPaid() { return amountPaid; }
    public void setAmountPaid(Double amountPaid) { this.amountPaid = amountPaid; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
