import { 
  PromiseRecord, 
  Department, 
  Category, 
  DashboardFilters, 
  DashboardMetrics, 
  DepartmentMetrics, 
  CategoryMetrics, 
  AuditLog, 
  WorkbookImport 
} from '@/types';
import { 
  IPromiseRepository, 
  IDepartmentRepository, 
  ICategoryRepository, 
  IAnalyticsRepository, 
  IImportRepository, 
  IAuditRepository 
} from '../interfaces';
import { 
  filterPromises, 
  calculateDashboardMetrics, 
  calculateDepartmentMetrics, 
  calculateCategoryMetrics 
} from '@/lib/analytics/metrics';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdsiftvejggcscmpoyqu.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
              'sb_publishable_-lRXiQ_N0Bxoyq7Vh5LY2w_gFL9duKY';
  return createSupabaseClient(url, key);
}

const listeners = new Set<() => void>();

function notifySubscribers() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Error in subscriber callback', e);
    }
  });
}

async function getServerDbPool() {
  if (typeof window === 'undefined' && process.env.DATABASE_URL) {
    try {
      const { getDbPool } = await import('@/lib/supabase/db');
      return getDbPool();
    } catch {
      return null;
    }
  }
  return null;
}

export class SupabasePromiseRepository implements IPromiseRepository {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  async getAll(): Promise<PromiseRecord[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('promises')
      .select('*, promise_departments(department_name, is_primary)')
      .order('id', { ascending: true });

    if (error) {
      throw new Error(`Failed to load promises from Supabase: ${error.message}`);
    }

    return (data || []).map((row: Record<string, unknown>) => this.mapRowToRecord(row));
  }

  async getById(id: number): Promise<PromiseRecord | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('promises')
      .select('*, promise_departments(department_name, is_primary)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch promise #${id}: ${error.message}`);
    }

    if (!data) return null;
    return this.mapRowToRecord(data as Record<string, unknown>);
  }

  async query(filters: Partial<DashboardFilters>): Promise<PromiseRecord[]> {
    const all = await this.getAll();
    return filterPromises(all, filters);
  }

  async create(
    promiseData: Omit<PromiseRecord, 'id' | 'updatedAt'>,
    modifiedBy = 'प्रशासनिक अधिकारी'
  ): Promise<PromiseRecord> {
    if (typeof window !== 'undefined') {
      const res = await fetch('/api/promises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...promiseData, modifiedBy }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Creation failed');
      }
      notifySubscribers();
      return data.data;
    }

    const pool = await getServerDbPool();
    if (pool) {
      const client = await pool.connect();
      let nextId = 1;
      try {
        await client.query('BEGIN');
        const maxRes = await client.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM promises');
        nextId = Number(maxRes.rows[0].next_id);

        await client.query(
          `INSERT INTO promises (
            id, title_hi, description_hi, category_hi, work_started, status, status_raw,
            political_importance, political_importance_raw, notes, ground_impact,
            public_perception, delay_reason, key_achievements, reference_link_1,
            reference_link_2, news_image_url, political_issue, official_confirmation_link,
            update_notes, source_sheet, source_row, version
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 1
          )`,
          [
            nextId,
            promiseData.title,
            promiseData.description || '',
            promiseData.category || 'विविध',
            promiseData.workStarted || false,
            promiseData.status,
            promiseData.statusRaw,
            promiseData.politicalImportance,
            promiseData.politicalImportanceRaw,
            promiseData.notes || null,
            promiseData.groundImpact || null,
            promiseData.publicPerception || null,
            promiseData.delayReason || null,
            promiseData.keyAchievements || null,
            promiseData.referenceLink1 || (promiseData.referenceLinks?.[0] || null),
            promiseData.referenceLink2 || (promiseData.referenceLinks?.[1] || null),
            promiseData.newsImage || null,
            promiseData.politicalIssue || null,
            promiseData.officialConfirmationLink || null,
            promiseData.updateNotes || null,
            promiseData.sourceSheet || 'All Promises',
            promiseData.sourceRow || 0,
          ]
        );

        const depts = promiseData.departments.length > 0 ? promiseData.departments : ['सामान्य प्रशासन विभाग'];
        for (let i = 0; i < depts.length; i++) {
          await client.query(
            'INSERT INTO promise_departments (promise_id, department_name, is_primary) VALUES ($1, $2, $3)',
            [nextId, depts[i], i === 0]
          );
        }

        await client.query(
          `INSERT INTO audit_logs (promise_id, field_name, old_value, new_value, modified_by, reason)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [nextId, 'RECORD_CREATED', null, promiseData.title, modifiedBy, 'नवीन संकल्प पत्र वादा प्रविष्टि']
        );

        await client.query('COMMIT');
        notifySubscribers();
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

      return (await this.getById(nextId))!;
    }

    const supabase = getSupabase();

    // Determine next ID
    const { data: maxIdData } = await supabase
      .from('promises')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    const nextId = maxIdData && maxIdData.length > 0 ? (maxIdData[0].id + 1) : 1;

    const rowPayload = {
      id: nextId,
      title_hi: promiseData.title,
      description_hi: promiseData.description || '',
      category_hi: promiseData.category || 'विविध',
      work_started: promiseData.workStarted || false,
      status: promiseData.status,
      status_raw: promiseData.statusRaw,
      political_importance: promiseData.politicalImportance,
      political_importance_raw: promiseData.politicalImportanceRaw,
      notes: promiseData.notes || null,
      ground_impact: promiseData.groundImpact || null,
      public_perception: promiseData.publicPerception || null,
      delay_reason: promiseData.delayReason || null,
      key_achievements: promiseData.keyAchievements || null,
      reference_link_1: promiseData.referenceLink1 || (promiseData.referenceLinks?.[0] || null),
      reference_link_2: promiseData.referenceLink2 || (promiseData.referenceLinks?.[1] || null),
      news_image_url: promiseData.newsImage || null,
      political_issue: promiseData.politicalIssue || null,
      official_confirmation_link: promiseData.officialConfirmationLink || null,
      update_notes: promiseData.updateNotes || null,
      source_sheet: promiseData.sourceSheet || 'All Promises',
      source_row: promiseData.sourceRow || 0,
      version: 1,
    };

    const { error: insertErr } = await supabase
      .from('promises')
      .insert(rowPayload);

    if (insertErr) {
      throw new Error(`Failed to create promise: ${insertErr.message}`);
    }

    // Insert departments
    const depts = promiseData.departments.length > 0 ? promiseData.departments : ['सामान्य प्रशासन विभाग'];
    const deptRows = depts.map((d, idx) => ({
      promise_id: nextId,
      department_name: d,
      is_primary: idx === 0,
    }));

    await supabase.from('promise_departments').insert(deptRows);

    // Record audit log
    await supabase.from('audit_logs').insert({
      promise_id: nextId,
      field_name: 'RECORD_CREATED',
      old_value: null,
      new_value: promiseData.title,
      modified_by: modifiedBy,
      reason: 'नवीन संकल्प पत्र वादा प्रविष्टि',
    });

    notifySubscribers();
    return (await this.getById(nextId))!;
  }

  async update(
    id: number,
    updates: Partial<PromiseRecord>,
    modifiedBy = 'सिस्टम उपयोगकर्ता',
    expectedVersion?: number
  ): Promise<PromiseRecord> {
    if (typeof window !== 'undefined') {
      const res = await fetch('/api/promises', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates, modifiedBy, expectedVersion }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Update failed');
      }
      notifySubscribers();
      return data.data;
    }

    const pool = await getServerDbPool();
    if (pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const checkRes = await client.query('SELECT version FROM promises WHERE id = $1', [id]);
        if (checkRes.rows.length === 0) {
          throw new Error(`Promise #${id} not found`);
        }
        const currentVersion = checkRes.rows[0].version;
        if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
          throw new Error(`Conflict: Record #${id} was modified by another user (expected v${expectedVersion}, found v${currentVersion}). Please refresh.`);
        }

        const setClauses: string[] = ['updated_at = NOW()', 'version = version + 1'];
        const values: unknown[] = [id];
        let pIndex = 2;

        if (updates.title !== undefined) {
          setClauses.push(`title_hi = $${pIndex++}`);
          values.push(updates.title);
        }
        if (updates.description !== undefined) {
          setClauses.push(`description_hi = $${pIndex++}`);
          values.push(updates.description);
        }
        if (updates.status !== undefined) {
          setClauses.push(`status = $${pIndex++}`);
          values.push(updates.status);
          if (updates.statusRaw) {
            setClauses.push(`status_raw = $${pIndex++}`);
            values.push(updates.statusRaw);
          }
        }
        if (updates.politicalImportance !== undefined) {
          setClauses.push(`political_importance = $${pIndex++}`);
          values.push(updates.politicalImportance);
          if (updates.politicalImportanceRaw) {
            setClauses.push(`political_importance_raw = $${pIndex++}`);
            values.push(updates.politicalImportanceRaw);
          }
        }
        if (updates.category !== undefined) {
          setClauses.push(`category_hi = $${pIndex++}`);
          values.push(updates.category);
        }
        if (updates.notes !== undefined) {
          setClauses.push(`notes = $${pIndex++}`);
          values.push(updates.notes);
        }
        if (updates.delayReason !== undefined) {
          setClauses.push(`delay_reason = $${pIndex++}`);
          values.push(updates.delayReason);
        }
        if (updates.groundImpact !== undefined) {
          setClauses.push(`ground_impact = $${pIndex++}`);
          values.push(updates.groundImpact);
        }
        if (updates.publicPerception !== undefined) {
          setClauses.push(`public_perception = $${pIndex++}`);
          values.push(updates.publicPerception);
        }

        const updateSql = `UPDATE promises SET ${setClauses.join(', ')} WHERE id = $1`;
        await client.query(updateSql, values);

        if (updates.departments && updates.departments.length > 0) {
          await client.query('DELETE FROM promise_departments WHERE promise_id = $1', [id]);
          for (let i = 0; i < updates.departments.length; i++) {
            await client.query(
              'INSERT INTO promise_departments (promise_id, department_name, is_primary) VALUES ($1, $2, $3)',
              [id, updates.departments[i], i === 0]
            );
          }
        }

        await client.query(
          `INSERT INTO audit_logs (promise_id, field_name, old_value, new_value, modified_by, reason)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, Object.keys(updates).join(', '), null, JSON.stringify(updates), modifiedBy, 'डैशबोर्ड संपादन']
        );

        await client.query('COMMIT');
        notifySubscribers();
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

      return (await this.getById(id))!;
    }

    const supabase = getSupabase();

    // Optimistic Concurrency Control check
    if (expectedVersion !== undefined) {
      const { data: currentRec } = await supabase
        .from('promises')
        .select('version')
        .eq('id', id)
        .single();

      if (currentRec && currentRec.version !== expectedVersion) {
        throw new Error(`Conflict: Record #${id} was modified by another user (expected v${expectedVersion}, found v${currentRec.version}). Please refresh.`);
      }
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) payload.title_hi = updates.title;
    if (updates.description !== undefined) payload.description_hi = updates.description;
    if (updates.status !== undefined) {
      payload.status = updates.status;
      if (updates.statusRaw) payload.status_raw = updates.statusRaw;
    }
    if (updates.politicalImportance !== undefined) {
      payload.political_importance = updates.politicalImportance;
      if (updates.politicalImportanceRaw) payload.political_importance_raw = updates.politicalImportanceRaw;
    }
    if (updates.category !== undefined) payload.category_hi = updates.category;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.delayReason !== undefined) payload.delay_reason = updates.delayReason;
    if (updates.groundImpact !== undefined) payload.ground_impact = updates.groundImpact;
    if (updates.publicPerception !== undefined) payload.public_perception = updates.publicPerception;

    let updateQuery = supabase
      .from('promises')
      .update(payload)
      .eq('id', id);

    if (expectedVersion !== undefined) {
      updateQuery = updateQuery.eq('version', expectedVersion);
    }

    const { error } = await updateQuery;
    if (error) {
      throw new Error(`Failed to update promise #${id}: ${error.message}`);
    }

    // Update departments if provided
    if (updates.departments && updates.departments.length > 0) {
      await supabase.from('promise_departments').delete().eq('promise_id', id);
      const deptRows = updates.departments.map((d, i) => ({
        promise_id: id,
        department_name: d,
        is_primary: i === 0,
      }));
      await supabase.from('promise_departments').insert(deptRows);
    }

    // Record audit log
    await supabase.from('audit_logs').insert({
      promise_id: id,
      field_name: Object.keys(updates).join(', '),
      old_value: null,
      new_value: JSON.stringify(updates),
      modified_by: modifiedBy,
      reason: 'डैशबोर्ड संपादन',
    });

    notifySubscribers();
    return (await this.getById(id))!;
  }

  async delete(id: number, modifiedBy = 'प्रशासनिक अधिकारी'): Promise<boolean> {
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/promises?id=${id}&modifiedBy=${encodeURIComponent(modifiedBy)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Deletion failed');
      }
      notifySubscribers();
      return true;
    }

    const pool = await getServerDbPool();
    if (pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const existing = await this.getById(id);
        if (!existing) {
          await client.query('ROLLBACK');
          return false;
        }

        await client.query('DELETE FROM promise_departments WHERE promise_id = $1', [id]);
        await client.query('DELETE FROM promises WHERE id = $1', [id]);

        await client.query(
          `INSERT INTO audit_logs (promise_id, field_name, old_value, new_value, modified_by, reason)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, 'RECORD_DELETED', existing.title, null, modifiedBy, 'वादा रिकॉर्ड विलोपन']
        );

        await client.query('COMMIT');
        notifySubscribers();
        return true;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    const supabase = getSupabase();

    const existing = await this.getById(id);
    if (!existing) return false;

    await supabase.from('promise_departments').delete().eq('promise_id', id);
    const { error } = await supabase.from('promises').delete().eq('id', id);
    if (error) throw error;

    await supabase.from('audit_logs').insert({
      promise_id: id,
      field_name: 'RECORD_DELETED',
      old_value: existing.title,
      new_value: null,
      modified_by: modifiedBy,
      reason: 'वादा रिकॉर्ड विलोपन',
    });

    notifySubscribers();
    return true;
  }

  async bulkUpsert(
    records: PromiseRecord[],
    modifiedBy = 'एक्सेल आयात सेवा (Merge Mode)'
  ): Promise<{ inserted: number; updated: number; unchanged: number }> {
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;

    for (const p of records) {
      const existing = await this.getById(p.id);
      if (!existing) {
        await this.create(p, modifiedBy);
        inserted++;
      } else {
        const hasChange = existing.title !== p.title || existing.status !== p.status || existing.notes !== p.notes;
        if (hasChange) {
          await this.update(p.id, p, modifiedBy);
          updated++;
        } else {
          unchanged++;
        }
      }
    }

    notifySubscribers();
    return { inserted, updated, unchanged };
  }

  async replaceDataset(
    records: PromiseRecord[],
    modifiedBy = 'एक्सेल आयात सेवा (Replace Mode)'
  ): Promise<number> {
    const pool = await getServerDbPool();
    if (pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM promise_departments');
        await client.query('DELETE FROM promises');

        for (const p of records) {
          await client.query(
            `INSERT INTO promises (
              id, title_hi, description_hi, category_hi, work_started, status, status_raw,
              political_importance, political_importance_raw, notes, ground_impact,
              public_perception, delay_reason, key_achievements, reference_link_1,
              reference_link_2, news_image_url, political_issue, official_confirmation_link,
              update_notes, source_sheet, source_row, version
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 1
            )`,
            [
              p.id,
              p.title,
              p.description || '',
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
              p.referenceLink1 || (p.referenceLinks?.[0] || null),
              p.referenceLink2 || (p.referenceLinks?.[1] || null),
              p.newsImage || null,
              p.politicalIssue || null,
              p.officialConfirmationLink || null,
              p.updateNotes || null,
              p.sourceSheet || 'All Promises',
              p.sourceRow || 0,
            ]
          );

          const depts = p.departments.length > 0 ? p.departments : ['सामान्य प्रशासन विभाग'];
          for (let i = 0; i < depts.length; i++) {
            await client.query(
              'INSERT INTO promise_departments (promise_id, department_name, is_primary) VALUES ($1, $2, $3)',
              [p.id, depts[i], i === 0]
            );
          }
        }

        await client.query(
          `INSERT INTO audit_logs (promise_id, field_name, old_value, new_value, modified_by, reason)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [0, 'DATASET_REPLACED', null, `${records.length} रिकॉर्ड्स`, modifiedBy, 'डेटासेट का पूर्ण प्रतिस्थापन']
        );

        await client.query('COMMIT');
        notifySubscribers();
        return records.length;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    const supabase = getSupabase();

    // Clear existing
    await supabase.from('promise_departments').delete().neq('promise_id', 0);
    await supabase.from('promises').delete().neq('id', 0);

    // Batch insert
    for (let i = 0; i < records.length; i += 50) {
      const chunk = records.slice(i, i + 50);
      const rows = chunk.map(p => ({
        id: p.id,
        title_hi: p.title,
        description_hi: p.description || '',
        category_hi: p.category || 'विविध',
        work_started: p.workStarted || false,
        status: p.status,
        status_raw: p.statusRaw,
        political_importance: p.politicalImportance,
        political_importance_raw: p.politicalImportanceRaw,
        notes: p.notes || null,
        ground_impact: p.groundImpact || null,
        public_perception: p.publicPerception || null,
        delay_reason: p.delayReason || null,
        key_achievements: p.keyAchievements || null,
        reference_link_1: p.referenceLink1 || (p.referenceLinks?.[0] || null),
        reference_link_2: p.referenceLink2 || (p.referenceLinks?.[1] || null),
        news_image_url: p.newsImage || null,
        political_issue: p.politicalIssue || null,
        official_confirmation_link: p.officialConfirmationLink || null,
        update_notes: p.updateNotes || null,
        source_sheet: p.sourceSheet || 'All Promises',
        source_row: p.sourceRow || 0,
        version: 1,
      }));

      await supabase.from('promises').insert(rows);

      // Depts
      const deptRows: { promise_id: number; department_name: string; is_primary: boolean }[] = [];
      chunk.forEach(p => {
        p.departments.forEach((d, idx) => {
          deptRows.push({
            promise_id: p.id,
            department_name: d,
            is_primary: idx === 0,
          });
        });
      });
      if (deptRows.length > 0) {
        await supabase.from('promise_departments').insert(deptRows);
      }
    }

    await supabase.from('audit_logs').insert({
      promise_id: 0,
      field_name: 'REPLACE_DATASET_EXECUTED',
      old_value: null,
      new_value: `${records.length} रिकॉर्ड्स`,
      modified_by: modifiedBy,
      reason: 'डेटासेट का पूर्ण प्रतिस्थापन',
    });

    notifySubscribers();
    return records.length;
  }

  private mapRowToRecord(row: Record<string, unknown>): PromiseRecord {
    const rawDepts = (row.promise_departments as { department_name: string; is_primary?: boolean }[]) || [];
    const depts = rawDepts.map(d => d.department_name);

    return {
      id: Number(row.id),
      title: String(row.title_hi || ''),
      description: String(row.description_hi || ''),
      departments: depts.length > 0 ? depts : ['सामान्य प्रशासन विभाग'],
      primaryDepartment: depts[0] || 'सामान्य प्रशासन विभाग',
      category: String(row.category_hi || 'विविध'),
      workStarted: Boolean(row.work_started),
      status: row.status as PromiseRecord['status'],
      statusRaw: String(row.status_raw || 'प्रारंभ नहीं'),
      politicalImportance: row.political_importance as PromiseRecord['politicalImportance'],
      politicalImportanceRaw: String(row.political_importance_raw || 'सीमित'),
      notes: row.notes ? String(row.notes) : null,
      groundImpact: row.ground_impact ? String(row.ground_impact) : null,
      publicPerception: row.public_perception ? String(row.public_perception) : null,
      delayReason: row.delay_reason ? String(row.delay_reason) : null,
      keyAchievements: row.key_achievements ? String(row.key_achievements) : null,
      referenceLinks: [row.reference_link_1, row.reference_link_2].filter(Boolean) as string[],
      referenceLink1: row.reference_link_1 ? String(row.reference_link_1) : null,
      referenceLink2: row.reference_link_2 ? String(row.reference_link_2) : null,
      newsImage: row.news_image_url ? String(row.news_image_url) : null,
      politicalIssue: row.political_issue ? String(row.political_issue) : null,
      officialConfirmationLink: row.official_confirmation_link ? String(row.official_confirmation_link) : null,
      updateNotes: row.update_notes ? String(row.update_notes) : null,
      sourceSheet: String(row.source_sheet || 'All Promises'),
      sourceRow: Number(row.source_row || 0),
      version: Number(row.version || 1),
      updatedAt: row.updated_at ? new Date(String(row.updated_at)).toISOString() : new Date().toISOString(),
    };
  }
}

export class SupabaseDepartmentRepository implements IDepartmentRepository {
  async getAll(): Promise<Department[]> {
    const supabase = getSupabase();
    const { data: depts, error } = await supabase
      .from('departments')
      .select('id, sno, name_hi')
      .order('sno', { ascending: true });

    if (error) throw error;

    // Get promise counts
    const promiseRepo = new SupabasePromiseRepository();
    const promises = await promiseRepo.getAll();
    const counts = new Map<string, number>();
    promises.forEach(p => {
      p.departments.forEach(d => {
        counts.set(d, (counts.get(d) || 0) + 1);
      });
    });

    return (depts || []).map((d: { id: string; sno: number; name_hi: string }) => ({
      id: d.id,
      sno: d.sno,
      name: d.name_hi,
      promiseCount: counts.get(d.name_hi) || 0,
    }));
  }

  async getMetrics(): Promise<DepartmentMetrics[]> {
    const promiseRepo = new SupabasePromiseRepository();
    const promises = await promiseRepo.getAll();
    return calculateDepartmentMetrics(promises);
  }

  async getByName(name: string): Promise<Department | null> {
    const all = await this.getAll();
    return all.find(d => d.name === name) || null;
  }

  async create(data: Omit<Department, 'id'>): Promise<Department> {
    const supabase = getSupabase();
    const { data: res, error } = await supabase
      .from('departments')
      .insert({ sno: data.sno, name_hi: data.name })
      .select()
      .single();

    if (error) throw error;
    return { id: res.id, sno: res.sno, name: res.name_hi };
  }

  async update(id: string, updates: Partial<Department>): Promise<Department> {
    const supabase = getSupabase();
    const payload: Record<string, unknown> = {};
    if (updates.name) payload.name_hi = updates.name;

    const { data: res, error } = await supabase
      .from('departments')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { id: res.id, sno: res.sno, name: res.name_hi };
  }

  async delete(id: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase.from('departments').delete().eq('id', id);
    return !error;
  }
}

export class SupabaseCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    const supabase = getSupabase();
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name_hi');

    if (error) throw error;

    const promiseRepo = new SupabasePromiseRepository();
    const promises = await promiseRepo.getAll();
    const counts = new Map<string, number>();
    promises.forEach(p => {
      if (p.category) counts.set(p.category, (counts.get(p.category) || 0) + 1);
    });

    return (categories || []).map((c: { id: string; name_hi: string }) => ({
      id: c.id,
      name: c.name_hi,
      promiseCount: counts.get(c.name_hi) || 0,
    }));
  }

  async getMetrics(): Promise<CategoryMetrics[]> {
    const promiseRepo = new SupabasePromiseRepository();
    const promises = await promiseRepo.getAll();
    return calculateCategoryMetrics(promises);
  }

  async getByName(name: string): Promise<Category | null> {
    const all = await this.getAll();
    return all.find(c => c.name === name) || null;
  }

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('categories')
      .insert({ name_hi: category.name })
      .select()
      .single();

    if (error) throw error;
    return { id: data.id, name: data.name_hi };
  }

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('categories')
      .update({ name_hi: updates.name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { id: data.id, name: data.name_hi };
  }

  async delete(id: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    return !error;
  }
}

export class SupabaseAnalyticsRepository implements IAnalyticsRepository {
  private promiseRepo = new SupabasePromiseRepository();

  async getOverviewMetrics(filters?: Partial<DashboardFilters>): Promise<DashboardMetrics> {
    const promises = await this.promiseRepo.query(filters || {});
    return calculateDashboardMetrics(promises);
  }

  async getDepartmentBreakdown(filters?: Partial<DashboardFilters>): Promise<DepartmentMetrics[]> {
    const promises = await this.promiseRepo.query(filters || {});
    return calculateDepartmentMetrics(promises);
  }

  async getCategoryBreakdown(filters?: Partial<DashboardFilters>): Promise<CategoryMetrics[]> {
    const promises = await this.promiseRepo.query(filters || {});
    return calculateCategoryMetrics(promises);
  }
}

export class SupabaseAuditRepository implements IAuditRepository {
  async getLogsByPromiseId(promiseId: number): Promise<AuditLog[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('promise_id', promiseId)
      .order('modified_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      promiseId: Number(r.promise_id),
      fieldName: String(r.field_name),
      oldValue: r.old_value ? String(r.old_value) : null,
      newValue: r.new_value ? String(r.new_value) : null,
      modifiedBy: String(r.modified_by || 'सिस्टम'),
      modifiedAt: new Date(String(r.modified_at)).toISOString(),
      reason: r.reason ? String(r.reason) : undefined,
    }));
  }

  async recordChange(log: Omit<AuditLog, 'id' | 'modifiedAt'>): Promise<AuditLog> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        promise_id: log.promiseId,
        field_name: log.fieldName,
        old_value: log.oldValue,
        new_value: log.newValue,
        modified_by: log.modifiedBy,
        reason: log.reason || null,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: String(data.id),
      promiseId: Number(data.promise_id),
      fieldName: String(data.field_name),
      oldValue: data.old_value ? String(data.old_value) : null,
      newValue: data.new_value ? String(data.new_value) : null,
      modifiedBy: String(data.modified_by || 'सिस्टम'),
      modifiedAt: new Date(String(data.modified_at)).toISOString(),
      reason: data.reason ? String(data.reason) : undefined,
    };
  }

  async getAllLogs(): Promise<AuditLog[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('modified_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return (data || []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      promiseId: Number(r.promise_id),
      fieldName: String(r.field_name),
      oldValue: r.old_value ? String(r.old_value) : null,
      newValue: r.new_value ? String(r.new_value) : null,
      modifiedBy: String(r.modified_by || 'सिस्टम'),
      modifiedAt: new Date(String(r.modified_at)).toISOString(),
      reason: r.reason ? String(r.reason) : undefined,
    }));
  }
}

export class SupabaseImportRepository implements IImportRepository {
  async getImportHistory(): Promise<WorkbookImport[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('workbook_imports')
      .select('*')
      .order('imported_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      filename: String(r.filename),
      importedAt: new Date(String(r.imported_at)).toISOString(),
      rowCount: Number(r.row_count),
      status: r.status as WorkbookImport['status'],
      errorCount: Number(r.error_count),
      mode: 'REPLACE' as const,
    }));
  }

  async recordImport(entry: Omit<WorkbookImport, 'id' | 'importedAt'>): Promise<WorkbookImport> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('workbook_imports')
      .insert({
        filename: entry.filename,
        row_count: entry.rowCount,
        success_count: entry.rowCount - entry.errorCount,
        error_count: entry.errorCount,
        status: entry.status,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: String(data.id),
      filename: String(data.filename),
      importedAt: new Date(String(data.imported_at)).toISOString(),
      rowCount: Number(data.row_count),
      status: data.status as WorkbookImport['status'],
      errorCount: Number(data.error_count),
      mode: entry.mode,
    };
  }
}
