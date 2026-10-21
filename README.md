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

## ⚠️ Development Persistence Limitations

> [!IMPORTANT]
> **Current Persistence Mode: In-Memory Development Repository (`DevPromiseRepository`)**
> 
> In **Stage 2**, the application persists changes, new records, edits, and Excel imports in runtime server memory seeded with the complete baseline dataset of **414 manifesto promises** extracted from `data/MP Manifesto Analysis.xlsx`.
> 
> **Limitations in Stage 2:**
> 1. Changes exist in runtime server/browser memory; restarting the Node.js server process will re-initialize records back to the baseline 414 records.
> 2. Multi-user concurrent writes are not backed by database row locking.
> 3. Browser sessions that lose connection will reload data from the dev repository.
> 
> **Stage 3 Roadmap:**
> In **Stage 3**, `DevPromiseRepository` will be swapped with `SupabasePromiseRepository` using the existing TypeScript repository interfaces (`IPromiseRepository`), connecting directly to Supabase PostgreSQL with Row Level Security (RLS), real-time WebSockets, and persistent audit log tables. Zero UI code refactoring will be required.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js:** v18.0.0 or later (v24 LTS recommended)
- **npm:** v9.0.0 or later

### Installation

```bash
# 1. Clone or navigate to the repository
cd "mp manifesto"

# 2. Install dependencies
npm install

# 3. Copy environment configuration
cp .env.example .env.local

# 4. Run tests
npm test

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

```bash
# 1. Run Vitest Unit & Integration Test Suite (20 tests)
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
│   │   │   ├── promises/route.ts      # REST API for query, update, create, delete
│   │   │   ├── analytics/route.ts     # Aggregated KPI rollups API
│   │   │   ├── import/route.ts        # Multi-sheet inspection & Mode A/B import API
│   │   │   └── export/route.ts        # Styled multi-sheet .xlsx generation API
│   │   ├── globals.css                # Tailwind theme & Devanagari typography
│   │   └── layout.tsx                 # Root layout with Noto Sans Devanagari font
│   ├── components/
│   │   ├── layout/                    # Sidebar, Header, FilterBar, DevBanner
│   │   ├── dashboard/                 # KpiCard, StatusBadge, ImportanceBadge
│   │   ├── charts/                    # ECharts Donut, Bar, Completion Rankings
│   │   └── tables/                    # AgPromiseGrid, AddPromiseModal, DeleteConfirmModal
│   ├── lib/
│   │   ├── analytics/                 # Metrics, Rollups & Deterministic Insights
│   │   ├── excel/                     # parser.ts (ExcelJS parsing/diff) & exporter.ts
│   │   ├── repositories/              # Repository interfaces & DevPromiseRepository
│   │   ├── validation/                # Zod schemas for promises & import options
│   │   ├── context/                   # FilterContext for shared dashboard filters
│   │   └── data/                      # manifesto_data.json (414 extracted records)
│   └── types/                         # Complete domain models & TypeScript interfaces
├── data/
│   └── MP Manifesto Analysis.xlsx     # Original 414-promise Excel workbook
├── docs/
│   ├── WORKBOOK_ANALYSIS.md           # Stage 1 workbook inspection report
│   ├── ARCHITECTURE.md                # System architecture specification
│   └── DATA_MODEL.md                  # Database models & PostgreSQL schema
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql     # Stage 3 Supabase PostgreSQL migration
└── tests/
    ├── analytics.test.ts              # KPI, rollups, and insight unit tests
    └── excel_and_repo.test.ts         # Excel parser, duplicate headers, merge/replace & exporter tests
```

---

## 🛣️ Roadmap: Next Step (Stage 3)

- **Supabase Cloud Integration:** Implement `SupabasePromiseRepository` implementing `IPromiseRepository`.
- **Database Persistence:** Execute migration `supabase/migrations/001_initial_schema.sql` on Supabase PostgreSQL.
- **Row-Level Security (RLS):** Authenticated departmental nodal officer role-based access control.
- **Audit Logging Table:** Persist all field-level updates to `audit_logs` in PostgreSQL.
- **Production Deployment:** Configure environment variables and deploy to Vercel.
