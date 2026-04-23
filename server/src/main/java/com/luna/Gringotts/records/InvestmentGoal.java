package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "investment_goal", schema = "public")
public class InvestmentGoal {

    public InvestmentGoal() {}

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "investment_goal_seq_gen")
    @SequenceGenerator(name = "investment_goal_seq_gen", sequenceName = "investment_goal_seq", allocationSize = 1)
    Long id;

    @Column(nullable = false)
    String name;

    @Column(nullable = false)
    String icon = "🎯";

    @Column(nullable = false)
    String color = "#6366f1";

    @Column(name = "target_amount", nullable = false)
    @JsonProperty("target_amount")
    Double targetAmount;

    @Column(name = "current_amount", nullable = false)
    @JsonProperty("current_amount")
    Double currentAmount = 0.0;

    @Column(name = "monthly_contribution", nullable = false)
    @JsonProperty("monthly_contribution")
    Double monthlyContribution = 0.0;

    @Column(name = "annual_rate", nullable = false)
    @JsonProperty("annual_rate")
    Double annualRate = 8.0;

    @Column(columnDefinition = "text")
    String notes;

    @Transient
    @JsonProperty(value = "tags", access = JsonProperty.Access.WRITE_ONLY)
    List<TagRequest> tagsPayload;

    public static class TagRequest {
        public TagType type;
        public Long id;
    }

    public enum TagType { CATEGORY, SUBCATEGORY, ITEM }

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    @JsonProperty("created_at")
    LocalDateTime createdAt;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonProperty(value = "tags", access = JsonProperty.Access.READ_ONLY)
    List<InvestmentGoalTag> tags = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    User user;

    // ── Getters ───────────────────────────────────────────────────────────────

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getIcon() { return icon; }
    public String getColor() { return color; }
    public Double getTargetAmount() { return targetAmount; }
    public Double getCurrentAmount() { return currentAmount; }
    public Double getMonthlyContribution() { return monthlyContribution; }
    public Double getAnnualRate() { return annualRate; }
    public String getNotes() { return notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<InvestmentGoalTag> getTags() { return tags; }
    public List<TagRequest> getTagsPayload() { return tagsPayload; }
    public User getUser() { return user; }

    // ── Setters ───────────────────────────────────────────────────────────────

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setIcon(String icon) { this.icon = icon; }
    public void setColor(String color) { this.color = color; }
    public void setTargetAmount(Double targetAmount) { this.targetAmount = targetAmount; }
    public void setCurrentAmount(Double currentAmount) { this.currentAmount = currentAmount; }
    public void setMonthlyContribution(Double monthlyContribution) { this.monthlyContribution = monthlyContribution; }
    public void setAnnualRate(Double annualRate) { this.annualRate = annualRate; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setTags(List<InvestmentGoalTag> tags) { this.tags = tags; }
    public void setTagsPayload(List<TagRequest> tagsPayload) { this.tagsPayload = tagsPayload; }
    public void setUser(User user) { this.user = user; }
}
