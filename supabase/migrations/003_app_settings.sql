-- ====================================================================
-- MP Manifesto Analysis Dashboard - Migration 003: App Settings & Global Theme
-- ====================================================================

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT DEFAULT 'admin'
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view app_settings" ON app_settings;
CREATE POLICY "Public can view app_settings"
    ON app_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can insert or update app_settings" ON app_settings;
CREATE POLICY "Public can insert or update app_settings"
    ON app_settings FOR ALL
    USING (true)
    WITH CHECK (true);
