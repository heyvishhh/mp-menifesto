# Security Architecture & Data Protection Specification

This document outlines the security architecture, authorization model, and data protection controls implemented for the **MP Manifesto Analysis Dashboard (मध्य प्रदेश संकल्प पत्र 2023 विश्लेषण प्रणाली)**.

---

## 1. Threat Model & Security Principles

1. **Least Privilege:** Public users possess read-only visibility into manifesto metrics and promises. Destructive operations (record deletion, dataset replacement) are restricted to verified `ADMIN` users.
2. **Defense in Depth:** Access control is enforced at both the Next.js API layer (server-side authentication checks) and the database layer (PostgreSQL Row Level Security policies).
3. **Secret Isolation:** Service role keys and PostgreSQL connection strings are strictly confined to server-side Route Handlers and backend background jobs. They are never transmitted or bundled into client-side JavaScript.
4. **Optimistic Concurrency Control (OCC):** Prevents lost updates during simultaneous administrative editing sessions via an integer `version` column.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Resource / Action | PUBLIC (Citizen) | VIEWER (Departmental Staff) | EDITOR (Nodal Officer) | ADMIN (CM Dashboard Cell) |
|---|---|---|---|---|
| View Overview Dashboard | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| View All Promises Table | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Search, Filter & Drilldown | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Export Excel Reports | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| View Promise Audit History | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed |
| Inline Cell Editing | ❌ Blocked | ❌ Blocked | ✅ Allowed (OCC Checked) | ✅ Allowed |
| Add New Promise | ❌ Blocked | ❌ Blocked | ✅ Allowed | ✅ Allowed |
| Delete Promise | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed (Two-Step Confirm) |
| Upload & Replace Dataset | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed |
| Upload & Merge Dataset | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed |
| Access Storage Workbooks | ❌ Blocked | ❌ Blocked | ❌ Blocked | ✅ Allowed |

---

## 3. Database Row Level Security (RLS)

RLS is enabled across all tables in `supabase/migrations/002_stage3_auth_rls.sql`:

```sql
-- Public Read Access
CREATE POLICY "Public can view promises" ON promises FOR SELECT USING (true);
CREATE POLICY "Public can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);

-- Authenticated Role Checks
CREATE POLICY "Editors and Admins can update promises" 
    ON promises FOR UPDATE 
    USING (public.get_current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY "Only Admins can delete promises" 
    ON promises FOR DELETE 
    USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "Admins can view audit logs" 
    ON audit_logs FOR SELECT 
    USING (public.get_current_user_role() = 'ADMIN');
```

---

## 4. Optimistic Concurrency Control (OCC)

When updating a promise record:
1. Client sends the current expected `version` number.
2. Server executes update with `version` validation:
   ```sql
   UPDATE promises 
   SET title_hi = $1, version = version + 1, updated_at = NOW() 
   WHERE id = $2 AND version = $3;
   ```
3. If another user modified the record in the interim, the version mismatch causes a `409 Conflict` response:
   ```json
   {
     "success": false,
     "error": "Conflict: Record was modified by another user. Please refresh."
   }
   ```

---

## 5. Storage Security & File Upload Hardening

- **Private Buckets:** Source workbooks are uploaded to private bucket `manifesto-workbooks`.
- **Validation:** Uploaded files are validated on the server for `.xlsx`/`.xls` file signatures, maximum file size (`MAX_EXCEL_UPLOAD_SIZE_BYTES = 15728640`), and sanitization of filenames against path traversal.
