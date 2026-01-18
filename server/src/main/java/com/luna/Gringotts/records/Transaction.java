package com.luna.Gringotts.records;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.data.annotation.ReadOnlyProperty;

@Entity
@Table(name = "transaction", schema = "public")
@Inheritance(strategy = InheritanceType.JOINED)
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "transaction_seq_gen")
    @SequenceGenerator(name = "transaction_seq_gen", sequenceName = "transaction_seq", allocationSize = 1)
    Long id;

    @Column(nullable = false)
    Long value;

    @Column(nullable = false)
    String description;

    @Column(name = "transaction_time", nullable = false)
    @JsonProperty("transaction_time")
    LocalDateTime transactionTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    @ReadOnlyProperty
    LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "category")
    Category category;

    @ManyToOne
    @JoinColumn(name = "subcategory")
    @JsonProperty("subcategory")
    SubCategory subCategory;

    @ManyToOne
    @JoinColumn(name = "item")
    Item item;

    @Column(columnDefinition = "text")
    String notes;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public Long getValue() {
        return value;
    }

    public void setValue(Long value) {
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
}
