import { getDbPool } from '@/lib/supabase/db';
import { createAdminClient } from '@/lib/supabase/admin';
import { ThemeConfig } from './types';
import { DEFAULT_THEME_CONFIG } from './presets';
import { buildThemeConfig } from './colorUtils';

const SETTINGS_KEY = 'global_theme';

/**
 * Fetch the active global theme from PostgreSQL/Supabase.
 * Returns default Royal Teal if not found or on error.
 */
export async function getGlobalThemeFromDb(): Promise<ThemeConfig> {
  // 1. Try via direct PostgreSQL Pool
  try {
    const pool = getDbPool();
    const result = await pool.query(
      'SELECT value FROM app_settings WHERE key = $1 LIMIT 1',
      [SETTINGS_KEY]
    );

    if (result.rows.length > 0 && result.rows[0].value) {
      return buildThemeConfig(result.rows[0].value);
    }
  } catch (err) {
    console.warn('[Theme DB] Pool query fallback to Supabase client:', (err as Error).message);
  }

  // 2. Fallback via Supabase REST client
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (!error && data?.value) {
      return buildThemeConfig(data.value);
    }
  } catch (err) {
    console.warn('[Theme DB] Supabase fallback error:', (err as Error).message);
  }

  return DEFAULT_THEME_CONFIG;
}

/**
 * Save the global theme to PostgreSQL/Supabase app_settings.
 */
export async function saveGlobalThemeToDb(
  theme: ThemeConfig,
  updatedBy: string = 'admin'
): Promise<ThemeConfig> {
  const themePayload = {
    ...theme,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  let saved = false;

  // 1. Try PostgreSQL Pool
  try {
    const pool = getDbPool();
    await pool.query(
      `
      INSERT INTO app_settings (key, value, updated_at, updated_by)
      VALUES ($1, $2::jsonb, NOW(), $3)
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value,
          updated_at = NOW(),
          updated_by = EXCLUDED.updated_by
      `,
      [SETTINGS_KEY, JSON.stringify(themePayload), updatedBy]
    );
    saved = true;
  } catch (err) {
    console.warn('[Theme DB] Pool upsert failed, attempting Supabase client:', (err as Error).message);
  }

  // 2. Fallback to Supabase client if pool failed
  if (!saved) {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key: SETTINGS_KEY,
        value: themePayload,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      });

    if (error) {
      throw new Error(`Failed to save global theme: ${error.message}`);
    }
  }

  return themePayload;
}
