package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "budget_category_allocation", schema = "public")
public class BudgetCategoryAllocation {

    public BudgetCategoryAllocation() {}

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "bca_seq_gen")
    @SequenceGenerator(name = "bca_seq_gen", sequenceName = "budget_category_allocation_seq", allocationSize = 1)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_id", nullable = false)
    @JsonIgnore
    Budget budget;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    Category category;

    @Column(name = "allocated_amount", nullable = false)
    @JsonProperty("allocated_amount")
    Double allocatedAmount;

    // ── Getters ───────────────────────────────────────────────────────────────

    public Long getId() { return id; }
    public Budget getBudget() { return budget; }
    public Category getCategory() { return category; }
    public Double getAllocatedAmount() { return allocatedAmount; }

    // ── Setters ───────────────────────────────────────────────────────────────

    public void setId(Long id) { this.id = id; }
    public void setBudget(Budget budget) { this.budget = budget; }
    public void setCategory(Category category) { this.category = category; }
    public void setAllocatedAmount(Double allocatedAmount) { this.allocatedAmount = allocatedAmount; }
}
