package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "group_budget", schema = "public")
public class GroupBudget {

    public GroupBudget() {}

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "group_budget_seq_gen")
    @SequenceGenerator(name = "group_budget_seq_gen", sequenceName = "group_budget_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private TransactionGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(name = "budget_type", nullable = false)
    @JsonProperty("budget_type")
    private String budgetType = "OVERALL"; // OVERALL, RECURRING_MONTHLY

    @Column
    private Integer month;

    @Column
    private Integer year;

    @Column(name = "total_amount", nullable = false)
    @JsonProperty("total_amount")
    private Double totalAmount;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "groupBudget", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<GroupBudgetCategoryAllocation> allocations = new ArrayList<>();

    // ── Getters ───────────────────────────────────────────────────────────────

    public Long getId() { return id; }
    public TransactionGroup getGroup() { return group; }
    public User getUser() { return user; }
    public String getName() { return name; }
    public String getBudgetType() { return budgetType; }
    public Integer getMonth() { return month; }
    public Integer getYear() { return year; }
    public Double getTotalAmount() { return totalAmount; }
    public String getNotes() { return notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<GroupBudgetCategoryAllocation> getAllocations() { return allocations; }

    // ── Setters ───────────────────────────────────────────────────────────────

    public void setId(Long id) { this.id = id; }
    public void setGroup(TransactionGroup group) { this.group = group; }
    public void setUser(User user) { this.user = user; }
    public void setName(String name) { this.name = name; }
    public void setBudgetType(String budgetType) { this.budgetType = budgetType; }
    public void setMonth(Integer month) { this.month = month; }
    public void setYear(Integer year) { this.year = year; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setAllocations(List<GroupBudgetCategoryAllocation> allocations) { this.allocations = allocations; }

    @JsonProperty("group_id")
    public Long getGroupId() {
        return group != null ? group.getId() : null;
    }
}
