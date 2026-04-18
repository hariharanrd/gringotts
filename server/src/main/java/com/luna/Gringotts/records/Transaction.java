package com.luna.Gringotts.records;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.data.annotation.ReadOnlyProperty;

@Entity
@Table(name = "transaction", schema = "public")
@Inheritance(strategy = InheritanceType.JOINED)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type", visible = true)
@JsonSubTypes({
        @JsonSubTypes.Type(value = Expense.class, name = "EXPENSE"),
        @JsonSubTypes.Type(value = Income.class, name = "INCOME"),
        @JsonSubTypes.Type(value = Saving.class, name = "SAVING"),
        @JsonSubTypes.Type(value = Revolving.class, name = "REVOLVING")
})
public class Transaction {

    public Transaction() {

    }

    public Transaction(String refNo, LocalDateTime date, String description, Double value) {
        this.referenceNo = refNo;
        this.transactionTime = date;
        this.description = description;
        this.value = value;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "transaction_seq_gen")
    @SequenceGenerator(name = "transaction_seq_gen", sequenceName = "transaction_seq", allocationSize = 1)
    Long id;

    @Column(nullable = false)
    Double value;

    @Column(nullable = false)
    String description;

    @Column(name = "reference_number")
    String referenceNo;

    @Column(name = "transaction_time", nullable = false)
    @JsonProperty("transaction_time")
    LocalDateTime transactionTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    @ReadOnlyProperty
    LocalDateTime createdAt = LocalDateTime.now();

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

    @Column(columnDefinition = "text")
    String notes;

    @Column(name = "imported")
    Boolean imported = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    User user;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getValue() {
        return value;
    }

    public void setValue(Double value) {
        this.value = value;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getTransactionTime() {
        return transactionTime;
    }

    public void setTransactionTime(LocalDateTime transactionTime) {
        this.transactionTime = transactionTime;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getReferenceNo() {
        return referenceNo;
    }

    public void setReferenceNo(String referenceNo) {
        this.referenceNo = referenceNo;
    }

    public Boolean getImported() {
        return imported;
    }

    public void setImported(Boolean imported) {
        this.imported = imported;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @JsonProperty("type")
    public String getType() {
        if (this instanceof Expense) return "EXPENSE";
        if (this instanceof Income) return "INCOME";
        if (this instanceof Saving) return "SAVING";
        if (this instanceof Revolving) return "REVOLVING";
        return null;
    }
}
