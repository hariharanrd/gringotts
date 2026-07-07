package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "budget", schema = "public")
@Filter(name = "tenantFilter", condition = "user_id = :userId")
public class Budget {

    public Budget() {}

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "budget_seq_gen")
    @SequenceGenerator(name = "budget_seq_gen", sequenceName = "budget_seq", allocationSize = 1)
    Long id;

    @Column(nullable = false)
    String name;

    @Column
    Integer month;  // null for master budget

    @Column
    Integer year;   // null for master budget

    @Column(name = "is_master", nullable = false)
    @JsonProperty("is_master")
    Boolean isMaster = false;

    @Column(name = "total_amount", nullable = false)
    @JsonProperty("total_amount")
    Double totalAmount;

    @Column(name = "estimated_savings", nullable = false)
    @JsonProperty("estimated_savings")
    Double estimatedSavings = 0.0;

    @Column(columnDefinition = "text")
    String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    @JsonProperty("created_at")
    LocalDateTime createdAt;

    @OneToMany(mappedBy = "budget", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    List<BudgetCategoryAllocation> allocations = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    User user;

    // ── Getters ───────────────────────────────────────────────────────────────

    public Long getId() { return id; }
    public String getName() { return name; }
    public Integer getMonth() { return month; }
    public Integer getYear() { return year; }
    public Boolean getIsMaster() { return isMaster; }
    public Double getTotalAmount() { return totalAmount; }
    public Double getEstimatedSavings() { return estimatedSavings; }
    public String getNotes() { return notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<BudgetCategoryAllocation> getAllocations() { return allocations; }

    // ── Setters ───────────────────────────────────────────────────────────────

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setMonth(Integer month) { this.month = month; }
    public void setYear(Integer year) { this.year = year; }
    public void setIsMaster(Boolean isMaster) { this.isMaster = isMaster; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public void setEstimatedSavings(Double estimatedSavings) { this.estimatedSavings = estimatedSavings; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setAllocations(List<BudgetCategoryAllocation> allocations) { this.allocations = allocations; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
