const { Pool } = require('pg');

async function setup() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to database...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        updated_by TEXT DEFAULT 'admin'
      );
    `);
    console.log('Table app_settings created or verified successfully.');

    // Enable RLS and policies
    await pool.query(`
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
    `);
    console.log('RLS policies applied.');

    const res = await pool.query('SELECT * FROM app_settings WHERE key = $1', ['global_theme']);
    console.log('Current global_theme row:', res.rows[0] || 'None set yet');
  } catch (err) {
    console.error('Error in setup:', err);
  } finally {
    await pool.end();
  }
}

setup();
