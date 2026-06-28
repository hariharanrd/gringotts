-- Migration: Create import_job table for async CSV/Excel imports
CREATE TABLE import_job (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    file_name         VARCHAR(255) NOT NULL,
    format            VARCHAR(10) NOT NULL,           -- 'CSV' or 'XLSX'
    strategy          VARCHAR(20) NOT NULL,           -- 'CREATE_IF_MISSING' or 'STRICT'
    column_mapping    TEXT NOT NULL,                  -- JSON string mapping target fields to column indices
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, PROCESSING, COMPLETED, FAILED
    imported_count    INT DEFAULT 0,
    failed_count      INT DEFAULT 0,
    failed_rows       TEXT,                           -- JSON array of row index and failure reasons
    error_message     TEXT,                           -- High-level parsing error message if job fails completely
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at      TIMESTAMP
);

CREATE INDEX idx_import_job_user ON import_job(user_id);

ALTER TABLE import_job ENABLE ROW LEVEL SECURITY;
