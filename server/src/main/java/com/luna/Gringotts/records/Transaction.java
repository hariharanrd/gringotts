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

    @Column(name = "payment_mode")
    @JsonProperty("payment_mode")
    String paymentMode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_card_id")
    @JsonProperty("credit_card")
    CreditCard creditCard;

    @Column(name = "imported")
    Boolean imported = false;

    @Column(name = "include_in_budget")
    @JsonProperty("include_in_budget")
    Boolean includeInBudget = true;


    @Column(name = "created_by")
    @JsonProperty("created_by")
    String createdBy = "USER"; // "USER" or "SCHEDULE"

    @Column(name = "schedule_id")
    @JsonProperty("schedule_id")
    Long scheduleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funding_goal_id")
    @JsonProperty("funding_goal")
    InvestmentGoal fundingGoal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funding_loan_id")
    @JsonProperty("funding_loan")
    Loan fundingLoan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id")
    @JsonProperty("loan")
    Loan loan;

    @Column(name = "loan_payment_type")
    @JsonProperty("loan_payment_type")
    String loanPaymentType; // "EMI" or "PART_PAYMENT"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    @JsonProperty("group")
    TransactionGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_category_id")
    @JsonProperty("group_category")
    GroupCategory groupCategory;

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

    @JsonProperty("user")
    public java.util.Map<String, Object> getUserDetails() {
        if (user == null) {
            return null;
        }
        java.util.Map<String, Object> details = new java.util.HashMap<>();
        details.put("id", user.getId());
        details.put("username", user.getUsername());
        details.put("display_name", user.getDisplayName() != null && !user.getDisplayName().isEmpty() ? user.getDisplayName() : user.getUsername());
        return details;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public InvestmentGoal getFundingGoal() {
        return fundingGoal;
    }

    public void setFundingGoal(InvestmentGoal fundingGoal) {
        this.fundingGoal = fundingGoal;
    }

    public Loan getFundingLoan() {
        return fundingLoan;
    }

    public void setFundingLoan(Loan fundingLoan) {
        this.fundingLoan = fundingLoan;
    }

    @JsonProperty("funding_loan_id")
    public Long getFundingLoanId() {
        return fundingLoan != null ? fundingLoan.getId() : null;
    }

    @JsonProperty("funding_loan_name")
    public String getFundingLoanName() {
        return fundingLoan != null ? fundingLoan.getName() : null;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(Long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }

    public CreditCard getCreditCard() {
        return creditCard;
    }

    public void setCreditCard(CreditCard creditCard) {
        this.creditCard = creditCard;
    }

    public Boolean getIncludeInBudget() {
        return includeInBudget;
    }

    public void setIncludeInBudget(Boolean includeInBudget) {
        this.includeInBudget = includeInBudget;
    }

    @JsonProperty("type")

    public String getType() {
        if (this instanceof Expense) return "EXPENSE";
        if (this instanceof Income) return "INCOME";
        if (this instanceof Saving) return "SAVING";
        if (this instanceof Revolving) return "REVOLVING";
        return null;
    }

    public Loan getLoan() {
        return loan;
    }

    public void setLoan(Loan loan) {
        this.loan = loan;
    }

    public String getLoanPaymentType() {
        return loanPaymentType;
    }

    public void setLoanPaymentType(String loanPaymentType) {
        this.loanPaymentType = loanPaymentType;
    }

    @JsonProperty("loan_id")
    public Long getLoanId() {
        return loan != null ? loan.getId() : null;
    }

    @JsonProperty("loan_name")
    public String getLoanName() {
        return loan != null ? loan.getName() : null;
    }

    public TransactionGroup getGroup() {
        return group;
    }

    public void setGroup(TransactionGroup group) {
        this.group = group;
    }

    public GroupCategory getGroupCategory() {
        return groupCategory;
    }

    public void setGroupCategory(GroupCategory groupCategory) {
        this.groupCategory = groupCategory;
    }
}
