-- ====================================================================
-- MP Manifesto Analysis Dashboard - Initial Supabase / Postgres Schema
-- Stage 3 Database Migration
-- ====================================================================

-- 1. Create Custom Enumerated Types
CREATE TYPE promise_status_enum AS ENUM (
    'COMPLETED',     -- पूर्ण
    'IN_PROGRESS',   -- प्रगति पर
    'INITIAL_STAGE', -- प्रारंभिक चरण
    'NOT_STARTED'    -- प्रारंभ नहीं
);

CREATE TYPE political_importance_enum AS ENUM (
    'HIGH',    -- उच्च
    'MEDIUM',  -- मध्यम
    'LIMITED'  -- सीमित
);

-- 2. Master Departments Reference Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sno INT UNIQUE,
    name_hi TEXT NOT NULL UNIQUE,
    name_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Master Categories Reference Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_hi TEXT NOT NULL UNIQUE,
    name_en TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Promises Table (Core Operational Entity)
CREATE TABLE IF NOT EXISTS promises (
    id INT PRIMARY KEY, -- 1..414 matching original workbook क्रमांक
    title_hi TEXT NOT NULL,
    description_hi TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    category_hi TEXT NOT NULL,
    work_started BOOLEAN NOT NULL DEFAULT FALSE,
    status promise_status_enum NOT NULL DEFAULT 'NOT_STARTED',
    status_raw TEXT NOT NULL,
    political_importance political_importance_enum NOT NULL DEFAULT 'LIMITED',
    political_importance_raw TEXT NOT NULL,
    notes TEXT,
    ground_impact TEXT,
    public_perception TEXT,
    delay_reason TEXT,
    key_achievements TEXT,
    reference_link_1 TEXT,
    reference_link_2 TEXT,
    news_image_url TEXT,
    political_issue TEXT,
    official_confirmation_link TEXT,
    update_notes TEXT,
    source_sheet TEXT DEFAULT 'All Promises',
    source_row INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Junction Table for Multi-Department Relationships
CREATE TABLE IF NOT EXISTS promise_departments (
    promise_id INT NOT NULL REFERENCES promises(id) ON DELETE CASCADE,
    department_name TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (promise_id, department_name)
);

-- 6. Audit Log Table for Inline Editing History
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promise_id INT NOT NULL REFERENCES promises(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    modified_by TEXT NOT NULL DEFAULT 'anonymous',
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

-- 7. Workbook Import History Table
CREATE TABLE IF NOT EXISTS workbook_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    imported_by TEXT,
    row_count INT NOT NULL,
    success_count INT NOT NULL,
    error_count INT NOT NULL DEFAULT 0,
    errors JSONB DEFAULT '[]'::JSONB,
    status TEXT NOT NULL DEFAULT 'COMPLETED'
);

-- 8. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_promises_status ON promises(status);
CREATE INDEX IF NOT EXISTS idx_promises_category ON promises(category_hi);
CREATE INDEX IF NOT EXISTS idx_promises_importance ON promises(political_importance);
CREATE INDEX IF NOT EXISTS idx_promises_work_started ON promises(work_started);
CREATE INDEX IF NOT EXISTS idx_promise_depts_name ON promise_departments(department_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_promise ON audit_logs(promise_id, modified_at DESC);

-- 9. Auto-update Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER trigger_update_promises_updated_at
BEFORE UPDATE ON promises
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
