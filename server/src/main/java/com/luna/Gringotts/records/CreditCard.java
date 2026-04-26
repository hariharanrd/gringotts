package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "credit_card", schema = "public")
public class CreditCard {

    public CreditCard() {}
    public CreditCard(Long id) { this.id = id; }

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "credit_card_seq_gen")
    @SequenceGenerator(name = "credit_card_seq_gen", sequenceName = "credit_card_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false)
    private String nickname;

    @Column(nullable = false)
    private String issuer;

    @Column(name = "billing_date", nullable = false)
    @JsonProperty("billing_date")
    private Integer billingDate;

    @Column(name = "due_date", nullable = false)
    @JsonProperty("due_date")
    private Integer dueDate;

    @Column(name = "credit_limit", nullable = false)
    @JsonProperty("credit_limit")
    private Double creditLimit;

    @Column(name = "threshold_percentage", nullable = false)
    @JsonProperty("threshold_percentage")
    private Integer thresholdPercentage = 80;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public String getIssuer() { return issuer; }
    public void setIssuer(String issuer) { this.issuer = issuer; }
    public Integer getBillingDate() { return billingDate; }
    public void setBillingDate(Integer billingDate) { this.billingDate = billingDate; }
    public Integer getDueDate() { return dueDate; }
    public void setDueDate(Integer dueDate) { this.dueDate = dueDate; }
    public Double getCreditLimit() { return creditLimit; }
    public void setCreditLimit(Double creditLimit) { this.creditLimit = creditLimit; }
    public Integer getThresholdPercentage() { return thresholdPercentage; }
    public void setThresholdPercentage(Integer thresholdPercentage) { this.thresholdPercentage = thresholdPercentage; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
