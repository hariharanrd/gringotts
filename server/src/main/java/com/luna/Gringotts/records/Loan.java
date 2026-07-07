package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "loan", schema = "public")
@Filter(name = "tenantFilter", condition = "user_id = :userId")
public class Loan {

    public Loan() {}
    public Loan(Long id) { this.id = id; }

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "loan_seq_gen")
    @SequenceGenerator(name = "loan_seq_gen", sequenceName = "loan_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String lender;

    @Column(name = "principal_amount", nullable = false)
    @JsonProperty("principal_amount")
    private Double principalAmount;

    @Column(name = "annual_rate", nullable = false)
    @JsonProperty("annual_rate")
    private Double annualRate;

    @Column(name = "tenure_months", nullable = false)
    @JsonProperty("tenure_months")
    private Integer tenureMonths;

    @Column(name = "start_date", nullable = false)
    @JsonProperty("start_date")
    private LocalDate startDate;

    @Column(name = "emi_amount", nullable = false)
    @JsonProperty("emi_amount")
    private Double emiAmount;

    @Column(name = "emis_paid", nullable = false)
    @JsonProperty("emis_paid")
    private Integer emisPaid = 0;

    @Column(name = "is_closed", nullable = false)
    @JsonProperty("is_closed")
    private Boolean isClosed = false;

    @Column(name = "closed_at")
    @JsonProperty("closed_at")
    private LocalDateTime closedAt;

    @Column(columnDefinition = "text")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_category_id")
    @JsonProperty("expense_category")
    private Category expenseCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_subcategory_id")
    @JsonProperty("expense_subcategory")
    private SubCategory expenseSubCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_item_id")
    @JsonProperty("expense_item")
    private Item expenseItem;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLender() { return lender; }
    public void setLender(String lender) { this.lender = lender; }

    public Double getPrincipalAmount() { return principalAmount; }
    public void setPrincipalAmount(Double principalAmount) { this.principalAmount = principalAmount; }

    public Double getAnnualRate() { return annualRate; }
    public void setAnnualRate(Double annualRate) { this.annualRate = annualRate; }

    public Integer getTenureMonths() { return tenureMonths; }
    public void setTenureMonths(Integer tenureMonths) { this.tenureMonths = tenureMonths; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public Double getEmiAmount() { return emiAmount; }
    public void setEmiAmount(Double emiAmount) { this.emiAmount = emiAmount; }

    public Integer getEmisPaid() { return emisPaid; }
    public void setEmisPaid(Integer emisPaid) { this.emisPaid = emisPaid; }

    public Boolean getIsClosed() { return isClosed; }
    public void setIsClosed(Boolean isClosed) { this.isClosed = isClosed; }

    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Category getExpenseCategory() { return expenseCategory; }
    public void setExpenseCategory(Category expenseCategory) { this.expenseCategory = expenseCategory; }

    public SubCategory getExpenseSubCategory() { return expenseSubCategory; }
    public void setExpenseSubCategory(SubCategory expenseSubCategory) { this.expenseSubCategory = expenseSubCategory; }

    public Item getExpenseItem() { return expenseItem; }
    public void setExpenseItem(Item expenseItem) { this.expenseItem = expenseItem; }
}
