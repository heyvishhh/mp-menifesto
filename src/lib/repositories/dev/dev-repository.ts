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

// Raw baseline dataset extracted from MP Manifesto Analysis.xlsx
import rawDataset from '@/lib/data/manifesto_data.json';

// In-memory state holding records during runtime
let memoryPromises: PromiseRecord[] = (rawDataset.promises as unknown as PromiseRecord[]);

const memoryDepartments: Department[] = (rawDataset.canonicalDepartments || []).map((name, index) => ({
  id: `dept-${index + 1}`,
  sno: index + 1,
  name,
}));

const memoryAuditLogs: AuditLog[] = [
  {
    id: 'audit-init-1',
    promiseId: 1,
    fieldName: 'status',
    oldValue: 'IN_PROGRESS',
    newValue: 'COMPLETED',
    modifiedBy: 'विभागीय नोडल अधिकारी (WCD)',
    modifiedAt: '2026-08-19T14:32:00Z',
    reason: '19 अगस्त 2026 को ₹1.25 करोड़ बहनों के खातों में डीबीटी अंतरण पूर्ण हुआ।'
  },
  {
    id: 'audit-init-2',
    promiseId: 4,
    fieldName: 'notes',
    oldValue: null,
    newValue: '₹450 में गैस रिफिल की सब्सिडी DBT द्वारा जारी।',
    modifiedBy: 'खाद्य एवं नागरिक आपूर्ति विभाग',
    modifiedAt: '2026-08-20T11:15:00Z',
    reason: 'कैबिनेट स्वीकृति एवं जारी अनुदान आदेश का अद्यतन।'
  }
];

const memoryImports: WorkbookImport[] = [
  {
    id: 'import-init-1',
    filename: 'MP Manifesto Analysis.xlsx',
    importedAt: '2026-10-21T23:45:00Z',
    rowCount: 414,
    status: 'SUCCESS',
    errorCount: 0,
    mode: 'REPLACE'
  }
];

// Pub-Sub Event listeners for instantaneous dashboard reactivity
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

export class DevPromiseRepository implements IPromiseRepository {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  async getAll(): Promise<PromiseRecord[]> {
    return [...memoryPromises];
  }

  async getById(id: number): Promise<PromiseRecord | null> {
    const item = memoryPromises.find(p => p.id === id);
    return item ? { ...item } : null;
  }

  async query(filters: Partial<DashboardFilters>): Promise<PromiseRecord[]> {
    return filterPromises(memoryPromises, filters);
  }

  async create(promiseData: Omit<PromiseRecord, 'id' | 'updatedAt'>, modifiedBy = 'प्रशासनिक अधिकारी'): Promise<PromiseRecord> {
    const nextId = memoryPromises.length > 0 
      ? Math.max(...memoryPromises.map(p => p.id)) + 1 
      : 1;

    const newPromise: PromiseRecord = {
      ...promiseData,
      id: nextId,
      updatedAt: new Date().toISOString()
    };

    memoryPromises.push(newPromise);

    memoryAuditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      promiseId: nextId,
      fieldName: 'RECORD_CREATED',
      oldValue: null,
      newValue: newPromise.title,
      modifiedBy,
      modifiedAt: new Date().toISOString(),
      reason: 'नवीन संकल्प पत्र वादा प्रविष्टि'
    });

    notifySubscribers();
    return { ...newPromise };
  }

  async update(id: number, updates: Partial<PromiseRecord>, modifiedBy = 'सिस्टम उपयोगकर्ता', expectedVersion?: number): Promise<PromiseRecord> {
    const idx = memoryPromises.findIndex(p => p.id === id);
    if (idx === -1) {
      throw new Error(`Promise with ID ${id} not found`);
    }

    if (expectedVersion !== undefined && (memoryPromises[idx] as PromiseRecord & { version?: number }).version !== undefined) {
      const currentVer = (memoryPromises[idx] as PromiseRecord & { version?: number }).version;
      if (currentVer !== expectedVersion) {
        throw new Error(`Conflict: Record #${id} was modified by another user.`);
      }
    }

    const current = memoryPromises[idx];
    const updated: PromiseRecord = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Record audit logs for modified scalar fields
    for (const key of Object.keys(updates) as (keyof PromiseRecord)[]) {
      const oldVal = String(current[key] ?? '');
      const newVal = String(updates[key] ?? '');
      if (oldVal !== newVal) {
        memoryAuditLogs.unshift({
          id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          promiseId: id,
          fieldName: String(key),
          oldValue: oldVal || null,
          newValue: newVal || null,
          modifiedBy,
          modifiedAt: new Date().toISOString(),
          reason: updates.notes ? 'संशोधन एवं टिप्पणी अद्यतन' : undefined
        });
      }
    }

    memoryPromises[idx] = updated;
    notifySubscribers();
    return { ...updated };
  }

  async delete(id: number, modifiedBy = 'प्रशासनिक अधिकारी'): Promise<boolean> {
    const idx = memoryPromises.findIndex(p => p.id === id);
    if (idx === -1) return false;

    const removed = memoryPromises[idx];
    memoryPromises.splice(idx, 1);

    memoryAuditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      promiseId: id,
      fieldName: 'RECORD_DELETED',
      oldValue: removed.title,
      newValue: null,
      modifiedBy,
      modifiedAt: new Date().toISOString(),
      reason: 'रिकॉर्ड विलोपन'
    });

    notifySubscribers();
    return true;
  }

  /**
   * MODE B: MERGE DATASET
   * Inserts new records, updates matching records, leaves unrelated records unchanged
   */
  async bulkUpsert(
    records: PromiseRecord[],
    modifiedBy = 'एक्सेल आयात सेवा (Merge Mode)'
  ): Promise<{ inserted: number; updated: number; unchanged: number }> {
    const existingMap = new Map<number, number>();
    memoryPromises.forEach((p, idx) => existingMap.set(p.id, idx));

    let inserted = 0;
    let updated = 0;
    let unchanged = 0;

    for (const incoming of records) {
      const existingIdx = existingMap.get(incoming.id);

      if (existingIdx !== undefined) {
        const current = memoryPromises[existingIdx];
        // Check if anything changed
        const hasChange = 
          current.title !== incoming.title ||
          current.status !== incoming.status ||
          current.category !== incoming.category ||
          current.notes !== incoming.notes ||
          current.description !== incoming.description;

        if (hasChange) {
          memoryPromises[existingIdx] = {
            ...current,
            ...incoming,
            updatedAt: new Date().toISOString(),
          };
          updated++;
          memoryAuditLogs.unshift({
            id: `audit-${Date.now()}-${incoming.id}`,
            promiseId: incoming.id,
            fieldName: 'BULK_MERGE_UPDATE',
            oldValue: current.status,
            newValue: incoming.status,
            modifiedBy,
            modifiedAt: new Date().toISOString(),
            reason: 'एक्सेल विलय आयात के माध्यम से अद्यतन'
          });
        } else {
          unchanged++;
        }
      } else {
        // Insert new record
        memoryPromises.push({
          ...incoming,
          updatedAt: new Date().toISOString(),
        });
        inserted++;
        memoryAuditLogs.unshift({
          id: `audit-${Date.now()}-${incoming.id}`,
          promiseId: incoming.id,
          fieldName: 'BULK_MERGE_INSERT',
          oldValue: null,
          newValue: incoming.title,
          modifiedBy,
          modifiedAt: new Date().toISOString(),
          reason: 'एक्सेल विलय आयात के माध्यम से नवीन प्रविष्टि'
        });
      }
    }

    notifySubscribers();
    return { inserted, updated, unchanged };
  }

  /**
   * MODE A: REPLACE DATASET
   * Completely replaces active records with incoming validated dataset
   */
  async replaceDataset(
    records: PromiseRecord[],
    modifiedBy = 'एक्सेल आयात सेवा (Replace Mode)'
  ): Promise<number> {
    const oldCount = memoryPromises.length;
    memoryPromises = [...records];

    memoryAuditLogs.unshift({
      id: `audit-${Date.now()}-replace-all`,
      promiseId: 0,
      fieldName: 'DATASET_REPLACED',
      oldValue: `${oldCount} रिकॉर्ड्स`,
      newValue: `${records.length} रिकॉर्ड्स`,
      modifiedBy,
      modifiedAt: new Date().toISOString(),
      reason: 'संपूर्ण डेटासेट का नवीन कार्यपुस्तिका से प्रतिस्थापन (Atomic Dataset Replacement)'
    });

    notifySubscribers();
    return records.length;
  }
}

export class DevDepartmentRepository implements IDepartmentRepository {
  async getAll(): Promise<Department[]> {
    const deptMetrics = calculateDepartmentMetrics(memoryPromises);
    const metricMap = new Map(deptMetrics.map(m => [m.department, m.totalPromises]));

    return memoryDepartments.map((d) => ({
      ...d,
      promiseCount: metricMap.get(d.name) || 0,
    }));
  }

  async getMetrics(): Promise<DepartmentMetrics[]> {
    return calculateDepartmentMetrics(memoryPromises);
  }

  async getByName(name: string): Promise<Department | null> {
    const all = await this.getAll();
    return all.find(d => d.name === name) || null;
  }

  async create(data: Omit<Department, 'id'>): Promise<Department> {
    const newDept: Department = {
      ...data,
      id: `dept-${memoryDepartments.length + 1}`,
    };
    memoryDepartments.push(newDept);
    return newDept;
  }

  async update(id: string, updates: Partial<Department>): Promise<Department> {
    const idx = memoryDepartments.findIndex(d => d.id === id);
    if (idx === -1) throw new Error(`Department ${id} not found`);
    memoryDepartments[idx] = { ...memoryDepartments[idx], ...updates };
    return memoryDepartments[idx];
  }

  async delete(id: string): Promise<boolean> {
    const idx = memoryDepartments.findIndex(d => d.id === id);
    if (idx === -1) return false;
    memoryDepartments.splice(idx, 1);
    return true;
  }
}

export class DevCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    const catMetrics = calculateCategoryMetrics(memoryPromises);
    return catMetrics.map((c, index) => ({
      id: `cat-${index + 1}`,
      name: c.category,
      promiseCount: c.totalPromises,
    }));
  }

  async getMetrics(): Promise<CategoryMetrics[]> {
    return calculateCategoryMetrics(memoryPromises);
  }

  async getByName(name: string): Promise<Category | null> {
    const all = await this.getAll();
    return all.find(c => c.name === name) || null;
  }

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    return { ...category, id: `cat-${Date.now()}` };
  }

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    return { id, name: updates.name || '', ...updates };
  }

  async delete(id: string): Promise<boolean> {
    return Boolean(id);
  }
}

export class DevAnalyticsRepository implements IAnalyticsRepository {
  async getOverviewMetrics(filters?: Partial<DashboardFilters>): Promise<DashboardMetrics> {
    const filtered = filterPromises(memoryPromises, filters);
    return calculateDashboardMetrics(filtered);
  }

  async getDepartmentBreakdown(filters?: Partial<DashboardFilters>): Promise<DepartmentMetrics[]> {
    const filtered = filterPromises(memoryPromises, filters);
    return calculateDepartmentMetrics(filtered);
  }

  async getCategoryBreakdown(filters?: Partial<DashboardFilters>): Promise<CategoryMetrics[]> {
    const filtered = filterPromises(memoryPromises, filters);
    return calculateCategoryMetrics(filtered);
  }
}

export class DevImportRepository implements IImportRepository {
  async getImportHistory(): Promise<WorkbookImport[]> {
    return [...memoryImports];
  }

  async recordImport(entry: Omit<WorkbookImport, 'id' | 'importedAt'>): Promise<WorkbookImport> {
    const record: WorkbookImport = {
      ...entry,
      id: `import-${Date.now()}`,
      importedAt: new Date().toISOString(),
    };
    memoryImports.unshift(record);
    return record;
  }
}

export class DevAuditRepository implements IAuditRepository {
  async getLogsByPromiseId(promiseId: number): Promise<AuditLog[]> {
    return memoryAuditLogs.filter(a => a.promiseId === promiseId);
  }

  async getAllLogs(): Promise<AuditLog[]> {
    return [...memoryAuditLogs];
  }

  async recordChange(logData: Omit<AuditLog, 'id' | 'modifiedAt'>): Promise<AuditLog> {
    const log: AuditLog = {
      ...logData,
      id: `audit-${Date.now()}`,
      modifiedAt: new Date().toISOString(),
    };
    memoryAuditLogs.unshift(log);
    return log;
  }
}
