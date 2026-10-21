# Production Deployment Guide: MP Manifesto Analysis Dashboard

This document details the complete production deployment procedure for deploying the **MP Manifesto Analysis Dashboard (मध्य प्रदेश संकल्प पत्र 2023 विश्लेषण प्रणाली)** to **Vercel** with a **Supabase PostgreSQL** cloud backend.

---

## 1. Prerequisites

- **GitHub Repository:** [https://github.com/heyvishhh/mp-menifesto](https://github.com/heyvishhh/mp-menifesto)
- **Supabase Account & Project:** Project created at [supabase.com](https://supabase.com)
- **Vercel Account:** Linked to your GitHub account at [vercel.com](https://vercel.com)

---

## 2. Supabase Cloud Configuration

### Step A: Database Migrations
Run the version-controlled SQL migrations located in `supabase/migrations/` in your Supabase SQL Editor:
1. **Initial Schema Migration:** `supabase/migrations/001_initial_schema.sql`  
   (Creates `promises`, `departments`, `categories`, `promise_departments`, `audit_logs`, `workbook_imports` tables, indexes, and triggers).
2. **Auth & RLS Migration:** `supabase/migrations/002_stage3_auth_rls.sql`  
   (Adds Optimistic Concurrency Control `version` column, `profiles` table, Row Level Security policies, and Storage buckets).

### Step B: Seed Baseline Data
To seed the 414 verified manifesto commitments, execute the automated migration script locally:

```bash
node scripts/migrate_and_seed.js
```

Verification queries in Supabase SQL Editor:
```sql
SELECT count(*) FROM promises; -- 414
SELECT count(*) FROM departments; -- 45
SELECT count(*) FROM categories; -- 10
SELECT count(*) FROM promise_departments; -- 508
```

### Step C: Provision the First Administrator
1. Go to **Supabase Dashboard -> Authentication -> Users**.
2. Click **Add User -> Create User** (e.g. `admin@mp.gov.in` with a secure password).
3. In **Supabase SQL Editor**, elevate the user's role to `ADMIN`:
```sql
UPDATE public.profiles
SET role = 'ADMIN'
WHERE email = 'admin@mp.gov.in';
```

---

## 3. Vercel Deployment Setup

### Step A: Import GitHub Repository
1. Navigate to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New... -> Project**.
3. Select the GitHub repository: **`heyvishhh/mp-menifesto`**.
4. In **Framework Preset**, select **Next.js**.
5. In **Build and Output Settings**, confirm:
   - **Build Command:** `next build`
   - **Install Command:** `npm install --legacy-peer-deps`

### Step B: Configure Environment Variables
Under the **Environment Variables** section in Vercel, configure the following variables for **Production**, **Preview**, and **Development**:

| Variable Name | Description | Example / Source |
|---|---|---|
| `NEXT_PUBLIC_APP_ENV` | Application environment | `production` |
| `NEXT_PUBLIC_ENABLE_DEV_MOCK_FALLBACK` | Toggle live database vs in-memory mock | `false` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Default language | `hi` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | `https://xdsiftvejggcscmpoyqu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous / public key | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret service role key (backend only) | From Project Settings -> API |
| `DATABASE_URL` | Direct PostgreSQL connection string | `postgresql://postgres:[password]@db.xdsiftvejggcscmpoyqu.supabase.co:5432/postgres` |
| `MAX_EXCEL_UPLOAD_SIZE_BYTES` | Upload limit (15MB) | `15728640` |

### Step C: Deploy
1. Click **Deploy**.
2. Vercel will clone the repository, install dependencies with `--legacy-peer-deps`, run Turbopack compilation, and generate all 13 production routes.
3. Upon completion, your application will be assigned a live production URL (e.g. `https://mp-menifesto.vercel.app`).

---

## 4. Post-Deployment Verification Checklist

1. **Public Dashboard:** Open the production URL. Confirm KPI cards show 414 total promises, 47 completed (11.4% completion rate), and dynamic charts render.
2. **Authentication:** Navigate to `/login`. Sign in using your administrator credentials. Confirm the header reflects your active administrative session.
3. **Editable Grid:** Go to `/promises`. Perform an inline edit (e.g. update notes or status). Verify the change persists across page refreshes.
4. **Excel Export:** Click **एक्सेल निर्यात** on `/promises`. Confirm the downloaded `.xlsx` file opens in Microsoft Excel/LibreOffice with government teal formatting and Devanagari Hindi text preserved.
5. **Excel Import Wizard:** Open `/admin`. Test workbook inspection and Mode B merge import.
