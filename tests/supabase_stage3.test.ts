import { describe, it, expect, beforeAll } from 'vitest';
import { SupabasePromiseRepository, SupabaseDepartmentRepository, SupabaseAnalyticsRepository } from '../src/lib/repositories/supabase/supabase-repository';
import { exportPromisesToExcel } from '../src/lib/excel/exporter';

describe('Stage 3: Supabase PostgreSQL Persistence & Concurrency', () => {
  const promiseRepo = new SupabasePromiseRepository();
  const deptRepo = new SupabaseDepartmentRepository();
  const analyticsRepo = new SupabaseAnalyticsRepository();

  beforeAll(async () => {
    // Ensure DATABASE_URL is loaded from .env.local if not already set in environment
    if (!process.env.DATABASE_URL) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, 'utf8');
          const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
          if (match) process.env.DATABASE_URL = match[1];
        }
      } catch {}
    }
  });

  it('reads all 414 seeded manifesto records from live Supabase PostgreSQL', async () => {
    const promises = await promiseRepo.getAll();
    expect(promises.length).toBe(414);

    const first = promises.find(p => p.id === 1);
    expect(first).toBeDefined();
    expect(first?.title).toContain('लाडली बहना');
    expect(first?.departments.length).toBeGreaterThan(0);
    expect(first?.status).toBe('COMPLETED');
  });

  it('aggregates live database metrics accurately from PostgreSQL', async () => {
    const metrics = await analyticsRepo.getOverviewMetrics();
    expect(metrics.totalPromises).toBe(414);
    expect(metrics.completed).toBe(47);
    expect(metrics.inProgress).toBe(244);
    expect(metrics.initialStage).toBe(62);
    expect(metrics.notStarted).toBe(61);
    expect(metrics.completionRate).toBe(11.4);

    const depts = await deptRepo.getAll();
    expect(depts.length).toBe(45);
    expect(depts[0].promiseCount).toBeGreaterThan(0);
  });

  it('handles record updates, version incrementation, and audit log tracking in PostgreSQL', async () => {
    // 1. Fetch record 1
    const original = await promiseRepo.getById(1);
    expect(original).not.toBeNull();

    const currentNotes = original?.notes || '';
    const testNote = `परीक्षण टिप्पणी [अद्यतन: ${Date.now()}]`;

    // 2. Update with OCC
    const updated = await promiseRepo.update(1, { notes: testNote }, 'परीक्षण नोडल अधिकारी');
    expect(updated.notes).toBe(testNote);

    // 3. Verify in database
    const refetched = await promiseRepo.getById(1);
    expect(refetched?.notes).toBe(testNote);

    // 4. Test stale update rejection (OCC conflict)
    await expect(
      promiseRepo.update(1, { notes: 'stale update attempt' }, 'अवैध संपादन', 999999)
    ).rejects.toThrow(/Conflict: Record #1 was modified by another user/);

    // 5. Restore original notes
    await promiseRepo.update(1, { notes: currentNotes }, 'सिस्टम पुनर्स्थापना');
  }, 30000);

  it('generates an Excel export reflecting the live database records', async () => {
    const promises = await promiseRepo.getAll();
    const depts = await deptRepo.getAll();

    const buffer = await exportPromisesToExcel(promises, {
      title: 'मध्य प्रदेश संकल्प पत्र - लाइव डेटाबेस निर्यात',
      departments: depts,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(5000);
  });
});
