package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;


@Entity
@Table(name = "transaction_group", schema = "public")
public class TransactionGroup {

    public TransactionGroup() {}

    public TransactionGroup(Long id) {
        this.id = id;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "transaction_group_seq_gen")
    @SequenceGenerator(name = "transaction_group_seq_gen", sequenceName = "transaction_group_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false)
    private String type = "CUSTOM"; // TRIP, EVENT, PROJECT, PERSONAL, CUSTOM

    private String icon;

    private String color;

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, CLOSED

    @Column(name = "allows_expense", nullable = false)
    private boolean allowsExpense = true;

    @Column(name = "allows_income", nullable = false)
    private boolean allowsIncome = true;

    @Column(name = "allows_saving", nullable = false)
    private boolean allowsSaving = true;

    @Column(name = "allows_revolving", nullable = false)
    private boolean allowsRevolving = true;

    @Column(columnDefinition = "text")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String thumbnail;

    @Column(nullable = false)
    private boolean shared = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    // Getters and Setters
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @JsonProperty("allows_expense")
    public boolean isAllowsExpense() {
        return allowsExpense;
    }

    public void setAllowsExpense(boolean allowsExpense) {
        this.allowsExpense = allowsExpense;
    }

    @JsonProperty("allows_income")
    public boolean isAllowsIncome() {
        return allowsIncome;
    }

    public void setAllowsIncome(boolean allowsIncome) {
        this.allowsIncome = allowsIncome;
    }

    @JsonProperty("allows_saving")
    public boolean isAllowsSaving() {
        return allowsSaving;
    }

    public void setAllowsSaving(boolean allowsSaving) {
        this.allowsSaving = allowsSaving;
    }

    @JsonProperty("allows_revolving")
    public boolean isAllowsRevolving() {
        return allowsRevolving;
    }

    public void setAllowsRevolving(boolean allowsRevolving) {
        this.allowsRevolving = allowsRevolving;
    }

    public String getThumbnail() {
        return thumbnail;
    }

    public void setThumbnail(String thumbnail) {
        this.thumbnail = thumbnail;
    }

    public boolean isShared() {
        return shared;
    }

    public void setShared(boolean shared) {
        this.shared = shared;
    }
}
