const fs = require('fs');
const path = require('path');

async function testConnection() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (match) connectionString = match[1];
    }
  }

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not set. Please define DATABASE_URL in .env.local or environment.');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL at db.xdsiftvejggcscmpoyqu.supabase.co...');
    await client.connect();
    console.log('✅ Connection successful!');

    const resVer = await client.query('SELECT version();');
    console.log('Database Version:', resVer.rows[0].version);

    const resTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\nExisting Tables in public schema:');
    if (resTables.rows.length === 0) {
      console.log('  (No public tables found yet - ready for migration)');
    } else {
      resTables.rows.forEach(r => console.log(`  - ${r.table_name}`));
    }
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
  } finally {
    await client.end();
  }
}

testConnection();
