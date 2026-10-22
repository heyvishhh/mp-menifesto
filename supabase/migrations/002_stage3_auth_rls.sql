-- ====================================================================
-- MP Manifesto Analysis Dashboard - Stage 3 Migration: Auth, RLS & OCC
-- ====================================================================

-- 1. Add Optimistic Concurrency Control (OCC) column to promises
ALTER TABLE promises 
ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

-- 2. User Roles Enum (Idempotent)
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM (
        'ADMIN',
        'EDITOR',
        'VIEWER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Profiles Table linked to Supabase Auth (auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role_enum NOT NULL DEFAULT 'VIEWER',
    department_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant schema and type access to auth admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin, anon, authenticated, service_role;
GRANT USAGE ON TYPE public.user_role_enum TO supabase_auth_admin, anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin, service_role, postgres;

-- Trigger to create a profile automatically when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    default_role public.user_role_enum := 'VIEWER'::public.user_role_enum;
    extracted_role public.user_role_enum;
BEGIN
    BEGIN
        IF (NEW.raw_user_meta_data->>'role') IN ('ADMIN', 'EDITOR', 'VIEWER') THEN
            extracted_role := (NEW.raw_user_meta_data->>'role')::public.user_role_enum;
        ELSE
            extracted_role := default_role;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        extracted_role := default_role;
    END;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
        extracted_role
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role_enum AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Enable Row Level Security (RLS) on all public tables
ALTER TABLE promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE promise_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workbook_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Public Read Access (Citizen Transparency)
DROP POLICY IF EXISTS "Public can view promises" ON promises;
CREATE POLICY "Public can view promises"
    ON promises FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view departments" ON departments;
CREATE POLICY "Public can view departments"
    ON departments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories"
    ON categories FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view promise departments" ON promise_departments;
CREATE POLICY "Public can view promise departments"
    ON promise_departments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view workbook imports" ON workbook_imports;
CREATE POLICY "Public can view workbook imports"
    ON workbook_imports FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id OR public.get_current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id OR public.get_current_user_role() = 'ADMIN')
    WITH CHECK (auth.uid() = id OR public.get_current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (public.get_current_user_role() = 'ADMIN');

-- 6. RLS Policies: Authenticated Modifications (Admins & Editors)
DROP POLICY IF EXISTS "Editors and Admins can update promises" ON promises;
CREATE POLICY "Editors and Admins can update promises"
    ON promises FOR UPDATE
    USING (public.get_current_user_role() IN ('ADMIN', 'EDITOR'))
    WITH CHECK (public.get_current_user_role() IN ('ADMIN', 'EDITOR'));

DROP POLICY IF EXISTS "Admins and Editors can insert promises" ON promises;
CREATE POLICY "Admins and Editors can insert promises"
    ON promises FOR INSERT
    WITH CHECK (public.get_current_user_role() IN ('ADMIN', 'EDITOR'));

DROP POLICY IF EXISTS "Only Admins can delete promises" ON promises;
CREATE POLICY "Only Admins can delete promises"
    ON promises FOR DELETE
    USING (public.get_current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Admins manage departments" ON departments;
CREATE POLICY "Admins manage departments"
    ON departments FOR ALL
    USING (public.get_current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Admins manage categories" ON categories;
CREATE POLICY "Admins manage categories"
    ON categories FOR ALL
    USING (public.get_current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Admins and Editors manage promise_departments" ON promise_departments;
CREATE POLICY "Admins and Editors manage promise_departments"
    ON promise_departments FOR ALL
    USING (public.get_current_user_role() IN ('ADMIN', 'EDITOR'));

DROP POLICY IF EXISTS "Admins manage workbook_imports" ON workbook_imports;
CREATE POLICY "Admins manage workbook_imports"
    ON workbook_imports FOR ALL
    USING (public.get_current_user_role() = 'ADMIN');

-- Allow inserting audit logs from authenticated actions or service role
DROP POLICY IF EXISTS "Authenticated users can record audit logs" ON audit_logs;
CREATE POLICY "Authenticated users can record audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

-- 7. Supabase Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('manifesto-workbooks', 'manifesto-workbooks', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('manifesto-exports', 'manifesto-exports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Admins have full access to workbook bucket" ON storage.objects;
CREATE POLICY "Admins have full access to workbook bucket"
    ON storage.objects FOR ALL
    USING (bucket_id IN ('manifesto-workbooks', 'manifesto-exports') AND (auth.role() = 'service_role' OR public.get_current_user_role() = 'ADMIN'));
