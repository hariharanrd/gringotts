package com.luna.Gringotts.records;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "import_job", schema = "public")
public class ImportJob {

    public enum ImportJobStatus {
        PENDING, PROCESSING, COMPLETED, FAILED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private User user;

    @Column(name = "file_name", nullable = false)
    @JsonProperty("file_name")
    private String fileName;

    @Column(name = "format", nullable = false)
    private String format;

    @Column(name = "strategy", nullable = false)
    private String strategy;

    @Column(name = "column_mapping", nullable = false, columnDefinition = "text")
    @JsonProperty("column_mapping")
    private String columnMapping;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ImportJobStatus status = ImportJobStatus.PENDING;

    @Column(name = "imported_count")
    @JsonProperty("imported_count")
    private Integer importedCount = 0;

    @Column(name = "failed_count")
    @JsonProperty("failed_count")
    private Integer failedCount = 0;

    @Column(name = "failed_rows", columnDefinition = "text")
    @JsonProperty("failed_rows")
    private String failedRows;

    @Column(name = "error_message", columnDefinition = "text")
    @JsonProperty("error_message")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    @JsonProperty("completed_at")
    private LocalDateTime completedAt;

    public ImportJob() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getStrategy() {
        return strategy;
    }

    public void setStrategy(String strategy) {
        this.strategy = strategy;
    }

    public String getColumnMapping() {
        return columnMapping;
    }

    public void setColumnMapping(String columnMapping) {
        this.columnMapping = columnMapping;
    }

    public ImportJobStatus getStatus() {
        return status;
    }

    public void setStatus(ImportJobStatus status) {
        this.status = status;
    }

    public Integer getImportedCount() {
        return importedCount;
    }

    public void setImportedCount(Integer importedCount) {
        this.importedCount = importedCount;
    }

    public Integer getFailedCount() {
        return failedCount;
    }

    public void setFailedCount(Integer failedCount) {
        this.failedCount = failedCount;
    }

    public String getFailedRows() {
        return failedRows;
    }

    public void setFailedRows(String failedRows) {
        this.failedRows = failedRows;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}
