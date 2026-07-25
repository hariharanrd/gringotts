package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "group_budget_category_allocation", schema = "public")
public class GroupBudgetCategoryAllocation {

    public GroupBudgetCategoryAllocation() {}

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gbca_seq_gen")
    @SequenceGenerator(name = "gbca_seq_gen", sequenceName = "group_budget_category_allocation_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_budget_id", nullable = false)
    @JsonIgnore
    private GroupBudget groupBudget;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "group_category_id", nullable = false)
    @OnDelete(action = OnDeleteAction.RESTRICT)
    @JsonProperty("group_category")
    private GroupCategory groupCategory;

    @Column(name = "allocated_amount", nullable = false)
    @JsonProperty("allocated_amount")
    private Double allocatedAmount;

    // ── Getters ───────────────────────────────────────────────────────────────

    public Long getId() { return id; }
    public GroupBudget getGroupBudget() { return groupBudget; }
    public GroupCategory getGroupCategory() { return groupCategory; }
    public Double getAllocatedAmount() { return allocatedAmount; }

    // ── Setters ───────────────────────────────────────────────────────────────

    public void setId(Long id) { this.id = id; }
    public void setGroupBudget(GroupBudget groupBudget) { this.groupBudget = groupBudget; }
    public void setGroupCategory(GroupCategory groupCategory) { this.groupCategory = groupCategory; }
    public void setAllocatedAmount(Double allocatedAmount) { this.allocatedAmount = allocatedAmount; }
}
