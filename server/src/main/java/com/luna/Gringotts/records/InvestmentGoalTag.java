package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "investment_goal_tag", schema = "public")
public class InvestmentGoalTag {

    public InvestmentGoalTag() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonIgnore
    InvestmentGoal goal;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    Category category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subcategory_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    SubCategory subCategory;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    Item item;

    // ── Getters ───────────────────────────────────────────────────────────────

    public Long getId() { return id; }
    public InvestmentGoal getGoal() { return goal; }
    public Category getCategory() { return category; }
    public SubCategory getSubCategory() { return subCategory; }
    public Item getItem() { return item; }

    // ── Setters ───────────────────────────────────────────────────────────────

    public void setId(Long id) { this.id = id; }
    public void setGoal(InvestmentGoal goal) { this.goal = goal; }
    public void setCategory(Category category) { this.category = category; }
    public void setSubCategory(SubCategory subCategory) { this.subCategory = subCategory; }
    public void setItem(Item item) { this.item = item; }
}
