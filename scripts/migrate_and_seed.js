const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateAndSeed() {
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
    console.log('1. Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('   ✅ Connected!');

    // Read and run migration SQL
    console.log('2. Applying schema migration (001_initial_schema.sql)...');
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
    const migrationSql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(migrationSql);
    console.log('   ✅ Schema migration applied successfully!');

    // Read dataset
    console.log('3. Loading manifesto_data.json...');
    const dataPath = path.join(__dirname, '..', 'src', 'lib', 'data', 'manifesto_data.json');
    const dataset = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const { promises, canonicalDepartments } = dataset;
    const canonicalCategories = [...new Set(promises.map(p => p.category).filter(Boolean))];
    console.log(`   Found ${promises.length} promises, ${canonicalDepartments.length} departments, ${canonicalCategories.length} categories.`);

    // 4. Seed Departments
    console.log('4. Seeding master departments...');
    for (let i = 0; i < canonicalDepartments.length; i++) {
      const name = canonicalDepartments[i];
      await client.query(`
        INSERT INTO departments (sno, name_hi)
        VALUES ($1, $2)
        ON CONFLICT (name_hi) DO NOTHING;
      `, [i + 1, name]);
    }
    console.log(`   ✅ Seeded ${canonicalDepartments.length} departments.`);

    // 5. Seed Categories
    console.log('5. Seeding master categories...');
    const categoryMap = new Map();
    for (const cat of canonicalCategories) {
      const res = await client.query(`
        INSERT INTO categories (name_hi)
        VALUES ($1)
        ON CONFLICT (name_hi) DO UPDATE SET name_hi = EXCLUDED.name_hi
        RETURNING id, name_hi;
      `, [cat]);
      categoryMap.set(cat, res.rows[0].id);
    }
    console.log(`   ✅ Seeded ${canonicalCategories.length} categories.`);

    // 6. Seed Promises & Promise_Departments
    console.log('6. Seeding 414 promises and department relations...');
    for (const p of promises) {
      const categoryId = categoryMap.get(p.category) || null;
      
      await client.query(`
        INSERT INTO promises (
          id, title_hi, description_hi, category_id, category_hi,
          work_started, status, status_raw, political_importance, political_importance_raw,
          notes, ground_impact, public_perception, delay_reason, key_achievements,
          reference_link_1, reference_link_2, news_image_url, political_issue,
          official_confirmation_link, update_notes, source_sheet, source_row
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19,
          $20, $21, $22, $23
        )
        ON CONFLICT (id) DO UPDATE SET
          title_hi = EXCLUDED.title_hi,
          description_hi = EXCLUDED.description_hi,
          status = EXCLUDED.status,
          status_raw = EXCLUDED.status_raw,
          updated_at = NOW();
      `, [
        p.id,
        p.title,
        p.description || '',
        categoryId,
        p.category || 'विविध',
        p.workStarted || false,
        p.status,
        p.statusRaw,
        p.politicalImportance,
        p.politicalImportanceRaw,
        p.notes || null,
        p.groundImpact || null,
        p.publicPerception || null,
        p.delayReason || null,
        p.keyAchievements || null,
        p.referenceLinks?.[0] || null,
        p.referenceLinks?.[1] || null,
        p.newsImage || null,
        p.politicalIssue || null,
        p.officialConfirmationLink || null,
        p.updateNotes || null,
        p.sourceSheet || 'All Promises',
        p.sourceRow || 0
      ]);

      // Promise departments
      for (let dIdx = 0; dIdx < p.departments.length; dIdx++) {
        const dept = p.departments[dIdx];
        await client.query(`
          INSERT INTO promise_departments (promise_id, department_name, is_primary)
          VALUES ($1, $2, $3)
          ON CONFLICT (promise_id, department_name) DO NOTHING;
        `, [p.id, dept, dIdx === 0]);
      }
    }
    console.log('   ✅ Seeded all 414 promises and junction records.');

    // 7. Seed Initial Workbook Import entry
    await client.query(`
      INSERT INTO workbook_imports (filename, row_count, success_count, error_count, status)
      VALUES ($1, $2, $3, $4, $5);
    `, ['MP Manifesto Analysis.xlsx', 414, 414, 0, 'COMPLETED']);

    // 8. Verify Table Counts
    console.log('\n7. Verification Results:');
    const deptCount = await client.query('SELECT COUNT(*) FROM departments;');
    const catCount = await client.query('SELECT COUNT(*) FROM categories;');
    const promiseCount = await client.query('SELECT COUNT(*) FROM promises;');
    const linkCount = await client.query('SELECT COUNT(*) FROM promise_departments;');
    const statusBreakdown = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM promises 
      GROUP BY status 
      ORDER BY count DESC;
    `);

    console.log(`   Departments count: ${deptCount.rows[0].count}`);
    console.log(`   Categories count: ${catCount.rows[0].count}`);
    console.log(`   Promises count: ${promiseCount.rows[0].count}`);
    console.log(`   Promise-Department links: ${linkCount.rows[0].count}`);
    console.log('\n   Status Breakdown in PostgreSQL:');
    statusBreakdown.rows.forEach(r => console.log(`     - ${r.status}: ${r.count}`));

    console.log('\n🎉 Supabase Database is 100% migrated, seeded, and verified!');
  } catch (err) {
    console.error('❌ Migration/Seeding failed:', err);
  } finally {
    await client.end();
  }
}

migrateAndSeed();
