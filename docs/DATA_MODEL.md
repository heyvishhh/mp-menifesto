# MP Manifesto Analysis Dashboard - Data Model & Schema Specification

## 1. Core Domain Types & Enums

### 1.1 Canonical Implementation Status (`PromiseStatus`)
The application defines four canonical implementation statuses derived directly from Column G (`वर्तमान क्रियान्वयन की स्थिति`) of the source workbook:

```typescript
export type PromiseStatus = 
  | 'COMPLETED'      // पूर्ण (47 records in baseline)
  | 'IN_PROGRESS'    // प्रगति पर (244 records in baseline)
  | 'INITIAL_STAGE'  // प्रारंभिक चरण (62 records in baseline)
  | 'NOT_STARTED';   // प्रारंभ नहीं (61 records in baseline)

export const PROMISE_STATUS_CONFIG: Record<PromiseStatus, {
  labelHindi: string;
  labelEnglish: string;
  color: string;
  bgLight: string;
  borderColor: string;
  badgeClass: string;
  progressWeight: number; // For weighted index calculations if needed
}> = {
  COMPLETED: {
    labelHindi: 'पूर्ण',
    labelEnglish: 'Completed',
    color: '#059669', // Emerald 600
    bgLight: '#ecfdf5', // Emerald 50
    borderColor: '#a7f3d0',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    progressWeight: 1.0,
  },
  IN_PROGRESS: {
    labelHindi: 'प्रगति पर',
    labelEnglish: 'In Progress',
    color: '#0284c7', // Sky 600
    bgLight: '#f0f9ff', // Sky 50
    borderColor: '#bae6fd',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    progressWeight: 0.5,
  },
  INITIAL_STAGE: {
    labelHindi: 'प्रारंभिक चरण',
    labelEnglish: 'Initial Stage',
    color: '#d97706', // Amber 600
    bgLight: '#fffbeb', // Amber 50
    borderColor: '#fde68a',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    progressWeight: 0.2,
  },
  NOT_STARTED: {
    labelHindi: 'प्रारंभ नहीं',
    labelEnglish: 'Not Started',
    color: '#64748b', // Slate 500
    bgLight: '#f8fafc', // Slate 50
    borderColor: '#e2e8f0',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    progressWeight: 0.0,
  },
};
```

### 1.2 Political Importance (`PoliticalImportance`)
Derived directly from Column H (`राजनीतिक महत्व`):

```typescript
export type PoliticalImportance = 
  | 'HIGH'     // उच्च (137 records)
  | 'MEDIUM'   // मध्यम (170 records)
  | 'LIMITED'; // सीमित (107 records)

export const POLITICAL_IMPORTANCE_CONFIG: Record<PoliticalImportance, {
  labelHindi: string;
  labelEnglish: string;
  badgeClass: string;
}> = {
  HIGH: {
    labelHindi: 'उच्च',
    labelEnglish: 'High Priority',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
  },
  MEDIUM: {
    labelHindi: 'मध्यम',
    labelEnglish: 'Medium Priority',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  LIMITED: {
    labelHindi: 'सीमित',
    labelEnglish: 'Standard / Limited',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
  },
};
```

---

## 2. Entity Interfaces

### 2.1 Promise Entity (`PromiseRecord`)
```typescript
export interface PromiseRecord {
  /** Unique primary identifier (1..414 in baseline) */
  id: number;
  
  /** Manifesto commitment title in Hindi (Col B: घोषणा / वादा) */
  title: string;
  
  /** Detailed description or numerical targets (Col C: संक्षिप्त विवरण) */
  description: string;
  
  /** List of associated department names in Hindi (Col D: संबंधित मंत्रालय / विभाग) */
  departments: string[];
  
  /** Primary lead department */
  primaryDepartment: string;
  
  /** Thematic category (Col E: श्रेणी / क्षेत्र) */
  category: string;
  
  /** Whether implementation work has commenced (Col F: कार्य प्रारंभ होने की स्थिति) */
  workStarted: boolean;
  
  /** Normalized canonical implementation status */
  status: PromiseStatus;
  
  /** Verbatim original status string from Excel */
  statusRaw: string;
  
  /** Priority tier */
  politicalImportance: PoliticalImportance;
  
  /** Verbatim original importance string */
  politicalImportanceRaw: string;
  
  /** Detailed operational notes or budget allocations (Col I: टिप्पणी) */
  notes?: string | null;
  
  /** Ground implementation feedback (Col J: ज़मीनी क्रियान्वयन एवं प्रभाव) */
  groundImpact?: string | null;
  
  /** Public sentiment assessment (Col K: जन-प्रतिक्रिया / सार्वजनिक धारणा) */
  publicPerception?: string | null;
  
  /** Explicit delay root-cause if pending (Col L: यदि कार्य लंबित है तो प्रमुख कारण) */
  delayReason?: string | null;
  
  /** Milestone achievements (Col M: प्रमुख उपलब्धियाँ) */
  keyAchievements?: string | null;
  
  /** Reference hyperlinks (Col N & O: Reference Link) */
  referenceLinks: string[];
  referenceLink1?: string | null;
  referenceLink2?: string | null;
  
  /** Media clippings or photographic proof (Col P: News Image) */
  newsImage?: string | null;
  
  /** Political or electoral debate issue notes (Col Q: चुनावी/राजनीतिक मुद्दा) */
  politicalIssue?: string | null;
  
  /** Official government order / press release URL (Col R: अधिकारिक पुष्टि लिंक) */
  officialConfirmationLink?: string | null;
  
  /** Update notes (Col S: टिप्पणी) */
  updateNotes?: string | null;
  
  /** Worksheet origin name for audit tracking */
  sourceSheet: string;
  
  /** Source row number in original Excel workbook */
  sourceRow: number;
  
  /** ISO timestamp of last modification */
  updatedAt: string;
}
```

### 2.2 Department & Category Reference Models
```typescript
export interface Department {
  id: string;
  sno: number;
  name: string;        // Hindi department name from Dept_Names
  nameEn?: string;     // Optional English transliteration
  code?: string;       // e.g. "KISAAN_KALYAN"
}

export interface Category {
  id: string;
  name: string;        // e.g. "समृद्ध किसान"
  nameEn?: string;     // e.g. "Prosperous Farmer"
  description?: string;
}
```

### 2.3 Dashboard Filter State (`DashboardFilters`)
```typescript
export interface DashboardFilters {
  searchQuery: string;
  department: string | 'ALL';
  category: string | 'ALL';
  status: PromiseStatus | 'ALL';
  politicalImportance: PoliticalImportance | 'ALL';
  workStarted: boolean | 'ALL';
}
```

### 2.4 Metrics & Aggregations
```typescript
export interface DashboardMetrics {
  totalPromises: number;
  completed: number;
  inProgress: number;
  initialStage: number;
  notStarted: number;
  workStartedCount: number;
  completionRate: number; // Completed / Total * 100
  pendingCount: number;    // In Progress + Initial Stage + Not Started
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
```

### 2.5 Audit Log Model (`AuditLog`)
```typescript
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
```

---

## 3. Relational Database Schema (Supabase / PostgreSQL)

For Stage 3 implementation, the schema is formalized below:

```sql
-- Enums
CREATE TYPE promise_status_enum AS ENUM ('COMPLETED', 'IN_PROGRESS', 'INITIAL_STAGE', 'NOT_STARTED');
CREATE TYPE political_importance_enum AS ENUM ('HIGH', 'MEDIUM', 'LIMITED');

-- Master Departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sno INT UNIQUE,
    name_hi TEXT NOT NULL UNIQUE,
    name_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_hi TEXT NOT NULL UNIQUE,
    name_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Core Promises Table
CREATE TABLE promises (
    id INT PRIMARY KEY, -- 1..414 matching workbook serial number
    title_hi TEXT NOT NULL,
    description_hi TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    category_hi TEXT NOT NULL,
    work_started BOOLEAN NOT NULL DEFAULT FALSE,
    status promise_status_enum NOT NULL DEFAULT 'NOT_STARTED',
    status_raw TEXT NOT NULL,
    political_importance political_importance_enum NOT NULL DEFAULT 'LIMITED',
    political_importance_raw TEXT NOT NULL,
    notes TEXT,
    ground_impact TEXT,
    public_perception TEXT,
    delay_reason TEXT,
    key_achievements TEXT,
    reference_link_1 TEXT,
    reference_link_2 TEXT,
    news_image_url TEXT,
    political_issue TEXT,
    official_confirmation_link TEXT,
    update_notes TEXT,
    source_sheet TEXT DEFAULT 'All Promises',
    source_row INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-Many junction for departments
CREATE TABLE promise_departments (
    promise_id INT REFERENCES promises(id) ON DELETE CASCADE,
    department_name TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (promise_id, department_name)
);

-- Audit History
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promise_id INT REFERENCES promises(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    modified_by TEXT NOT NULL,
    modified_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_promises_status ON promises(status);
CREATE INDEX idx_promises_category ON promises(category_hi);
CREATE INDEX idx_promises_importance ON promises(political_importance);
CREATE INDEX idx_promise_depts_name ON promise_departments(department_name);
```
