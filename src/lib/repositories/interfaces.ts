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

export interface IPromiseRepository {
  getAll(): Promise<PromiseRecord[]>;
  getById(id: number): Promise<PromiseRecord | null>;
  query(filters: Partial<DashboardFilters>): Promise<PromiseRecord[]>;
  create(promise: Omit<PromiseRecord, 'id' | 'updatedAt'>, modifiedBy?: string): Promise<PromiseRecord>;
  update(id: number, updates: Partial<PromiseRecord>, modifiedBy?: string, expectedVersion?: number): Promise<PromiseRecord>;
  delete(id: number, modifiedBy?: string): Promise<boolean>;
  bulkUpsert(promises: PromiseRecord[], modifiedBy?: string): Promise<{ inserted: number; updated: number; unchanged: number }>;
  replaceDataset(promises: PromiseRecord[], modifiedBy?: string): Promise<number>;
  subscribe(listener: () => void): () => void;
}

export interface IDepartmentRepository {
  getAll(): Promise<Department[]>;
  getMetrics(): Promise<DepartmentMetrics[]>;
  getByName(name: string): Promise<Department | null>;
  create(department: Omit<Department, 'id'>): Promise<Department>;
  update(id: string, updates: Partial<Department>): Promise<Department>;
  delete(id: string): Promise<boolean>;
}

export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getMetrics(): Promise<CategoryMetrics[]>;
  getByName(name: string): Promise<Category | null>;
  create(category: Omit<Category, 'id'>): Promise<Category>;
  update(id: string, updates: Partial<Category>): Promise<Category>;
  delete(id: string): Promise<boolean>;
}

export interface IAnalyticsRepository {
  getOverviewMetrics(filters?: Partial<DashboardFilters>): Promise<DashboardMetrics>;
  getDepartmentBreakdown(filters?: Partial<DashboardFilters>): Promise<DepartmentMetrics[]>;
  getCategoryBreakdown(filters?: Partial<DashboardFilters>): Promise<CategoryMetrics[]>;
}

export interface IImportRepository {
  getImportHistory(): Promise<WorkbookImport[]>;
  recordImport(entry: Omit<WorkbookImport, 'id' | 'importedAt'>): Promise<WorkbookImport>;
}

export interface IAuditRepository {
  getLogsByPromiseId(promiseId: number): Promise<AuditLog[]>;
  recordChange(log: Omit<AuditLog, 'id' | 'modifiedAt'>): Promise<AuditLog>;
  getAllLogs(): Promise<AuditLog[]>;
}
