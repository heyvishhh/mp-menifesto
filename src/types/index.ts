export type PromiseStatus = 
  | 'COMPLETED'      // पूर्ण
  | 'IN_PROGRESS'    // प्रगति पर
  | 'INITIAL_STAGE'  // प्रारंभिक चरण
  | 'NOT_STARTED';   // प्रारंभ नहीं

export type PoliticalImportance = 
  | 'HIGH'     // उच्च
  | 'MEDIUM'   // मध्यम
  | 'LIMITED'; // सीमित

export interface PromiseRecord {
  id: number;
  title: string;
  description: string;
  departments: string[];
  primaryDepartment: string;
  category: string;
  workStarted: boolean;
  status: PromiseStatus;
  statusRaw: string;
  politicalImportance: PoliticalImportance;
  politicalImportanceRaw: string;
  notes?: string | null;
  groundImpact?: string | null;
  publicPerception?: string | null;
  delayReason?: string | null;
  keyAchievements?: string | null;
  referenceLinks: string[];
  referenceLink1?: string | null;
  referenceLink2?: string | null;
  newsImage?: string | null;
  politicalIssue?: string | null;
  officialConfirmationLink?: string | null;
  updateNotes?: string | null;
  sourceSheet: string;
  sourceRow: number;
  updatedAt: string;
  version?: number;
  /** Preserved unknown or extra columns from custom Excel imports */
  unknownFields?: Record<string, unknown>;
}

export interface Department {
  id: string;
  sno: number;
  name: string;
  nameEn?: string;
  promiseCount?: number;
}

export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  promiseCount?: number;
}

export interface DashboardFilters {
  searchQuery: string;
  department: string | 'ALL';
  category: string | 'ALL';
  status: PromiseStatus | 'ALL';
  politicalImportance: PoliticalImportance | 'ALL';
  workStarted: boolean | 'ALL';
}

export interface DashboardMetrics {
  totalPromises: number;
  completed: number;
  inProgress: number;
  initialStage: number;
  notStarted: number;
  workStartedCount: number;
  completionRate: number; // Formula: Completed / Total * 100
  pendingCount: number;   // Total - Completed
  highPriorityCount: number;
  highPriorityCompleted: number;
  highPriorityCompletionRate: number;
}

export interface DepartmentMetrics {
  department: string;
  totalPromises: number;
  completed: number;
  inProgress: number;
  initialStage: number;
  notStarted: number;
  completionRate: number;
  pendingPromises: number;
}

export interface CategoryMetrics {
  category: string;
  totalPromises: number;
  completed: number;
  inProgress: number;
  initialStage: number;
  notStarted: number;
  completionRate: number;
  pendingPromises: number;
}

export interface InsightFinding {
  id: string;
  type: 'FACT' | 'METRIC' | 'INTERPRETATION';
  category: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  actionFilter?: Partial<DashboardFilters>;
  stats?: { label: string; value: string | number }[];
}

export interface AuditLog {
  id: string;
  promiseId: number;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  modifiedBy: string;
  modifiedAt: string;
  reason?: string;
}

export interface WorkbookImport {
  id: string;
  filename: string;
  importedAt: string;
  rowCount: number;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  errorCount: number;
  mode?: ImportMode;
}

// ==========================================
// Stage 2: Excel Ingestion & Preview Types
// ==========================================

export type WorksheetClassification = 
  | 'PRIMARY_PROMISES'       // e.g. "All Promises"
  | 'DEPARTMENT_REFERENCE'   // e.g. "Dept_Names"
  | 'INTERNAL_WORKFLOW'      // e.g. "Work_Distribution"
  | 'COHORT_SUBSET'          // e.g. "Sheet3", "Sheet4", "Sheet5"
  | 'EMPTY_OR_PIVOT';        // e.g. "Pivot Table 1", "Sheet14"

export interface HeaderInfo {
  originalLabel: string;
  internalKey: string;
  columnIndex: number;
  isDuplicate: boolean;
}

export interface ParsedWorksheetInfo {
  name: string;
  classification: WorksheetClassification;
  rowCount: number;
  columnCount: number;
  headerRowIndex: number;
  headers: HeaderInfo[];
  duplicateHeaders: string[];
  emptyRowCount: number;
  sampleRows: Record<string, unknown>[];
  isPrimaryCandidate: boolean;
}

export interface WorkbookInspectionResult {
  filename: string;
  fileSizeBytes: number;
  worksheets: ParsedWorksheetInfo[];
  primaryWorksheetName: string | null;
  totalWorksheets: number;
}

export interface ImportValidationError {
  worksheet: string;
  rowNumber: number;
  column: string;
  originalValue: unknown;
  message: string;
  code: 'MISSING_REQUIRED' | 'INVALID_STATUS' | 'INVALID_TYPE' | 'DUPLICATE_ID' | 'INVALID_URL';
}

export interface ImportPreviewComparison {
  primarySheet: string;
  incomingTotal: number;
  existingTotal: number;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  invalidCount: number;
  errors: ImportValidationError[];
  sampleNew: PromiseRecord[];
  sampleUpdated: { current: PromiseRecord; incoming: PromiseRecord; changedFields: string[] }[];
  sampleInvalid: { rowNumber: number; raw: Record<string, unknown>; errors: string[] }[];
  validatedRecords: PromiseRecord[];
}

export type ImportMode = 'REPLACE' | 'MERGE';

export interface ImportExecutionResult {
  success: boolean;
  mode: ImportMode;
  appliedCount: number;
  insertedCount: number;
  updatedCount: number;
  unchangedCount: number;
  errorsCount: number;
  message: string;
  timestamp: string;
}
