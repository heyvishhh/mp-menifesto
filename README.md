# MP Manifesto Analysis Dashboard (मध्य प्रदेश संकल्प पत्र 2023 विश्लेषण प्रणाली)

An enterprise-grade analytics, audit, and monitoring web application replacing the legacy Microsoft Power BI dashboard for reviewing the 414 election manifesto promises of the Madhya Pradesh state government.

Built with **Next.js 16 (Turbopack)**, **React 19**, **TypeScript 5**, **Tailwind CSS**, **AG Grid Community**, **ExcelJS**, **Apache ECharts**, **Lucide Icons**, and an extensible **Data Access Layer** ready for **Supabase PostgreSQL**.

---

## 🌟 Stage 2 Completed Features

### 1. Robust Excel Workbook Parser (`src/lib/excel/parser.ts`)
- **Multi-Sheet Inspection:** Automatically inspects all worksheets in `.xlsx` and `.xls` workbooks, extracts detected row/column counts, empty rows, header rows, and sample rows.
- **Smart Worksheet Classification:** Categorizes worksheets into `PRIMARY_PROMISES` (`All Promises`), `DEPARTMENT_REFERENCE` (`Dept_Names`), `INTERNAL_WORKFLOW` (`Work_Distribution`), `COHORT_SUBSET` (`Sheet3`, `Sheet4`, `Sheet5`), and `EMPTY_OR_PIVOT` (`Sheet14`).
- **Duplicate Header Disambiguation:** Resolves duplicate column headers (such as duplicate `Reference Link` or `टिप्पणी` columns in the source workbook) into unique internal identifiers (`reference_link`, `reference_link__2`, `notes`, `update_notes`) while preserving original display labels in metadata.
- **No Lost Columns:** Any unknown or unexpected source columns are automatically captured in the `unknownFields` record and preserved through exports.
- **Data Validation & RFC 4180 Error Reports:** Validates ID uniqueness, mandatory title fields, valid Hindi status values, and department associations. Generates downloadable CSV error reports.

### 2. Import Workflow & Modes (`src/app/(dashboard)/admin/page.tsx`)
- **12-Step Functional Import Wizard:**
  1. Drag & drop or file selection of Excel workbook.
  2. File format and size validation.
  3. Server-side workbook parsing and multi-sheet inspection.
  4. Worksheet classification review and target sheet selection.
  5. Row, column, and empty-cell summary statistics.
  6. Sample records preview table.
  7. Detected column headers and suggested field mappings.
  8. Intelligent diff calculation comparing against active records: **New**, **Updated**, **Unchanged**, and **Invalid** records.
  9. Validation error display with downloadable CSV error report.
  10. Explicit import confirmation.
  11. Atomic application through the configured repository.
  12. Final execution summary and audit provenance tracking.
- **Mode A: Replace Dataset:** Atomically replaces the active in-memory dataset with validated records from the primary worksheet (requires explicit checkbox confirmation to prevent accidental loss).
- **Mode B: Merge Dataset:** Matches incoming records against existing records by ID. Inserts new records, updates modified fields, and leaves unmodified records untouched without row-number collisions.

### 3. Editable AG Grid Community (`src/components/tables/AgPromiseGrid.tsx`)
- **Inline Cell Editing:** Edit promise titles, descriptions, notes, delay reasons, and statuses directly in table cells.
- **Controlled Dropdown Editors:** Dropdown cell editors for Status (`COMPLETED`, `IN_PROGRESS`, `INITIAL_STAGE`, `NOT_STARTED`) and Political Importance (`HIGH`, `MEDIUM`, `LIMITED`).
- **Safety Guards:** Accidental deletion is prevented via `DeleteConfirmModal` requiring explicit user confirmation before record deletion.
- **Add Promise Modal:** Bilingual modal (`AddPromiseModal`) with Zod-backed input validation for adding new manifesto promises.
- **Table Controls:** Multi-row selection, live full-text search, column sorting, pagination, and direct links to record detail views (`/promises/[id]`).

### 4. Single Source of Truth Analytics & Pub-Sub Reactivity
- **Deterministic Analytics Engine (`src/lib/analytics/metrics.ts`):** All KPI cards, donut charts, bar charts, completion rate rankings, and department/category breakdowns compute from a single canonical formula:
  $$\text{Completion Rate} = \frac{\text{Completed Promises}}{\text{Total Promises}} \times 100$$
- **Real-Time Reactive Refresh:** `DevPromiseRepository` implements a pub-sub listener mechanism (`subscribe`). Any cell edit, added promise, deleted promise, or Excel import immediately pushes updates to all dashboard pages without requiring a manual browser reload.
- **Filter Synchronization (`FilterContext`):** Department, category, status, and search filters synchronize seamlessly across KPI cards, charts, and data grids.

### 5. Multi-Sheet Styled Excel Exporter (`src/lib/excel/exporter.ts`)
- **Government Dark Teal Theme:** Formatted with official state portal dark teal branding (`#0f766e`), bold white headers, and thin borders.
- **Multi-Sheet Structure:**
  1. `All Promises`: Primary dataset with all standard fields, Devanagari Hindi text preserved, and any custom `unknownFields` dynamically added as extra columns.
  2. `Dept_Names`: Department master reference list with linked promise counts.
  3. `Metadata_Summary`: Executive KPI statistics, export timestamp, applied filter criteria, and official completion rate.
- **Export Options:** Export all current records, filtered subsets, or selected records via `/api/export`.

---

## 🌟 Stage 3 Production Architecture & Features

### 1. Live Supabase PostgreSQL Persistence
- **414 Manifesto Promises Seeded:** Live PostgreSQL database populated with all 414 promises, 45 departments, 10 categories, and 508 relational department associations.
- **Transactional Consistency:** Database modifications (`create`, `update`, `delete`, `replaceDataset`, `bulkUpsert`) run within atomic SQL transactions (`BEGIN ... COMMIT`) via direct server connection pooling (`src/lib/supabase/db.ts`).
- **Optimistic Concurrency Control (OCC):** Prevents silent overwrite conflicts using integer `version` checking. Stale updates return HTTP 409 Conflict.
- **Live Audit Trail:** All field-level updates, dataset replacements, and deletions are permanently recorded in the `audit_logs` table.

### 2. Authentication & Row Level Security (RLS)
- **Supabase Auth Integration:** Login view (`src/app/(auth)/login/page.tsx`) with state portal styling, session listener in header (`src/components/layout/Header.tsx`), and secure cookie session storage via `@supabase/ssr`.
- **Role-Based Access Control (RBAC):** `ADMIN`, `EDITOR`, and `VIEWER` roles enforced via database RLS policies (`supabase/migrations/002_stage3_auth_rls.sql`) and Next.js server route handlers.
- **Zero Secret Leakage:** Database passwords and service role keys are kept strictly on the server; the browser client only uses publishable anonymous keys or delegates mutations to authenticated route handlers (`/api/promises`, `/api/import`).

### 3. Cloud Storage & Workbook Archival
- **Supabase Storage Buckets:** Private bucket `manifesto-workbooks` for immutable raw Excel workbook uploads, and `manifesto-exports` for generated reports.
- **Import History & Versioning:** Tracks import jobs in `workbook_imports` with status, row counts, and diff analysis.

### 4. Vercel Deployment Ready
- **Vercel Configuration:** `vercel.json` configured with legacy peer dependency resolution and Turbopack builds.
- **Comprehensive Documentation:** `docs/DEPLOYMENT.md` and `docs/SECURITY.md` cover exact deployment procedures.

---

## 🧪 Testing & Verification

```bash
# 1. Run Vitest Unit & Integration Test Suite (24 tests including live DB & OCC)
npm test

# 2. Run TypeScript Strict Type Checking (0 errors)
npx tsc --noEmit

# 3. Run ESLint Validation (0 errors, 0 warnings)
npm run lint

# 4. Compile Production Build (Turbopack)
npm run build
```

---

## 📁 Repository Structure

```
mp-manifesto/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx         # Government-themed Supabase Auth Login
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Shared dashboard shell (Sidebar + Header + FilterBar)
│   │   │   ├── page.tsx               # 1. Executive Overview Dashboard (Charts + KPIs)
│   │   │   ├── promises/
│   │   │   │   ├── page.tsx           # 2. Editable AG Grid All Promises Table
│   │   │   │   └── [id]/page.tsx      # 7. Promise Details View & Audit History
│   │   │   ├── analysis/page.tsx      # 3. Multi-Dimensional Statistical Drilldowns
│   │   │   ├── departments/page.tsx   # 4. Department Performance Matrix & Drawer
│   │   │   ├── categories/page.tsx    # 5. Category Breakdown Scorecards
│   │   │   ├── insights/page.tsx      # 6. Deterministic Key Insights Engine
│   │   │   └── admin/page.tsx         # 8. 12-Step Excel Import Wizard & Provenance
│   │   ├── api/
│   │   │   ├── promises/route.ts      # REST API for query, update, create, delete (OCC)
│   │   │   ├── analytics/route.ts     # Aggregated KPI rollups API
│   │   │   ├── import/route.ts        # Multi-sheet inspection & Mode A/B import API
│   │   │   └── export/route.ts        # Styled multi-sheet .xlsx generation API
│   │   ├── globals.css                # Tailwind theme & Devanagari typography
│   │   └── layout.tsx                 # Root layout with Noto Sans Devanagari font
│   ├── components/
│   │   ├── layout/                    # Sidebar, Header (with Auth), FilterBar, DevBanner
│   │   ├── dashboard/                 # KpiCard, StatusBadge, ImportanceBadge
│   │   ├── charts/                    # ECharts Donut, Bar, Completion Rankings
│   │   └── tables/                    # AgPromiseGrid, AddPromiseModal, DeleteConfirmModal
│   ├── lib/
│   │   ├── analytics/                 # Metrics, Rollups & Deterministic Insights
│   │   ├── excel/                     # parser.ts (ExcelJS parsing/diff) & exporter.ts
│   │   ├── repositories/              # Repository interfaces & Supabase/Dev implementations
│   │   │   ├── supabase/              # Supabase PostgreSQL persistence & OCC
│   │   │   └── dev/                   # Dev mock fallback
│   │   ├── supabase/                  # client.ts, server.ts, admin.ts, db.ts (pg pool)
│   │   ├── validation/                # Zod schemas for promises & import options
│   │   ├── context/                   # FilterContext for shared dashboard filters
│   │   └── data/                      # manifesto_data.json (414 extracted records)
│   └── types/                         # Complete domain models & TypeScript interfaces
├── data/
│   └── MP Manifesto Analysis.xlsx     # Original 414-promise Excel workbook
├── docs/
│   ├── WORKBOOK_ANALYSIS.md           # Stage 1 workbook inspection report
│   ├── ARCHITECTURE.md                # System architecture specification
│   ├── DATA_MODEL.md                  # Database models & PostgreSQL schema
│   ├── DEPLOYMENT.md                  # Supabase & Vercel deployment walkthrough
│   └── SECURITY.md                    # RBAC, RLS policies & credential protection
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql     # Initial tables, indexes & schema
│       └── 002_stage3_auth_rls.sql    # Stage 3 Auth, Profiles, RLS, Storage & OCC
├── vercel.json                        # Vercel deployment configuration
└── tests/
    ├── analytics.test.ts              # KPI, rollups, and insight unit tests
    ├── excel_and_repo.test.ts         # Excel parser, duplicate headers, merge/replace & exporter tests
    └── supabase_stage3.test.ts        # Live Supabase DB read, OCC conflict, and audit tests
```

