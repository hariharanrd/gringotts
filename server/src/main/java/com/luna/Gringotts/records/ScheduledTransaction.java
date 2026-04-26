package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "scheduled_transaction", schema = "public")
public class ScheduledTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "scheduled_transaction_seq_gen")
    @SequenceGenerator(name = "scheduled_transaction_seq_gen", sequenceName = "scheduled_transaction_seq", allocationSize = 1)
    Long id;

    @Column(nullable = false)
    String name;

    @Column(name = "transaction_type", nullable = false)
    @JsonProperty("transaction_type")
    String transactionType; // EXPENSE, INCOME, SAVING

    @Column(nullable = false)
    Double amount;

    @Column(columnDefinition = "text")
    String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category")
    Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subcategory")
    @JsonProperty("subcategory")
    SubCategory subCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item")
    Item item;

    @Column(name = "payment_mode")
    @JsonProperty("payment_mode")
    String paymentMode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_card_id")
    @JsonProperty("credit_card_id")
    CreditCard creditCard;

    @Column(name = "is_in")
    @JsonProperty("is_in")
    Boolean isIn;

    @Column(name = "frequency", nullable = false)
    String frequency; // ONE_TIME, DAILY, MONTHLY, YEARLY

    @Column(name = "start_date", nullable = false)
    @JsonProperty("start_date")
    LocalDate startDate;

    @Column(name = "end_date")
    @JsonProperty("end_date")
    LocalDate endDate;

    @Column(name = "next_run_date")
    @JsonProperty("next_run_date")
    LocalDate nextRunDate;

    @Column(name = "last_run_date")
    @JsonProperty("last_run_date")
    LocalDate lastRunDate;

    @Column(name = "is_active")
    @JsonProperty("is_active")
    Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    @JsonProperty("created_at")
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    LocalDateTime updatedAt;

    public ScheduledTransaction() {

    }

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public SubCategory getSubCategory() {
        return subCategory;
    }

    public void setSubCategory(SubCategory subCategory) {
        this.subCategory = subCategory;
    }

    public Item getItem() {
        return item;
    }

    public void setItem(Item item) {
        this.item = item;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }

    public Boolean getIsIn() {
        return isIn;
    }

    public void setIsIn(Boolean isIn) {
        this.isIn = isIn;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public LocalDate getNextRunDate() {
        return nextRunDate;
    }

    public void setNextRunDate(LocalDate nextRunDate) {
        this.nextRunDate = nextRunDate;
    }

    public LocalDate getLastRunDate() {
        return lastRunDate;
    }

    public void setLastRunDate(LocalDate lastRunDate) {
        this.lastRunDate = lastRunDate;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public CreditCard getCreditCard() {
        return creditCard;
    }

    public void setCreditCard(CreditCard creditCard) {
        this.creditCard = creditCard;
    }
}
