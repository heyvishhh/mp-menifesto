import { 
  PromiseRecord, 
  DashboardFilters, 
  DashboardMetrics, 
  DepartmentMetrics, 
  CategoryMetrics,
  PromiseStatus,
  PoliticalImportance
} from '@/types';

/**
 * Canonical configuration for Promise Statuses
 */
export const STATUS_CONFIG: Record<PromiseStatus, {
  labelHi: string;
  labelEn: string;
  color: string;
  bgLight: string;
  borderColor: string;
  badgeClass: string;
}> = {
  COMPLETED: {
    labelHi: 'पूर्ण',
    labelEn: 'Completed',
    color: '#059669', // Emerald
    bgLight: '#ecfdf5',
    borderColor: '#a7f3d0',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
  IN_PROGRESS: {
    labelHi: 'प्रगति पर',
    labelEn: 'In Progress',
    color: '#0284c7', // Sky Blue
    bgLight: '#f0f9ff',
    borderColor: '#bae6fd',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  },
  INITIAL_STAGE: {
    labelHi: 'प्रारंभिक चरण',
    labelEn: 'Initial Stage',
    color: '#d97706', // Amber
    bgLight: '#fffbeb',
    borderColor: '#fde68a',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  NOT_STARTED: {
    labelHi: 'प्रारंभ नहीं',
    labelEn: 'Not Started',
    color: '#64748b', // Slate
    bgLight: '#f8fafc',
    borderColor: '#e2e8f0',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};

export const IMPORTANCE_CONFIG: Record<PoliticalImportance, {
  labelHi: string;
  labelEn: string;
  badgeClass: string;
  color: string;
}> = {
  HIGH: {
    labelHi: 'उच्च',
    labelEn: 'High Priority',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    color: '#e11d48',
  },
  MEDIUM: {
    labelHi: 'मध्यम',
    labelEn: 'Medium Priority',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    color: '#6366f1',
  },
  LIMITED: {
    labelHi: 'सीमित',
    labelEn: 'Limited / Standard',
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
    color: '#94a3b8',
  },
};

/**
 * Filter promise records based on DashboardFilters
 */
export function filterPromises(promises: PromiseRecord[], filters?: Partial<DashboardFilters>): PromiseRecord[] {
  if (!filters) return promises;

  return promises.filter(p => {
    // 1. Search Query
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchId = p.id.toString() === q;
      const matchCat = p.category.toLowerCase().includes(q);
      const matchDepts = p.departments.some(d => d.toLowerCase().includes(q));
      const matchNotes = p.notes ? p.notes.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchDesc && !matchId && !matchCat && !matchDepts && !matchNotes) {
        return false;
      }
    }

    // 2. Department filter (checks whether department is in promise's departments array)
    if (filters.department && filters.department !== 'ALL') {
      if (!p.departments.includes(filters.department)) {
        return false;
      }
    }

    // 3. Category filter
    if (filters.category && filters.category !== 'ALL') {
      if (p.category !== filters.category) {
        return false;
      }
    }

    // 4. Status filter
    if (filters.status && filters.status !== 'ALL') {
      if (p.status !== filters.status) {
        return false;
      }
    }

    // 5. Political Importance filter
    if (filters.politicalImportance && filters.politicalImportance !== 'ALL') {
      if (p.politicalImportance !== filters.politicalImportance) {
        return false;
      }
    }

    // 6. Work started filter
    if (filters.workStarted !== undefined && filters.workStarted !== 'ALL') {
      if (p.workStarted !== filters.workStarted) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculate executive KPI metrics from an array of promises
 * Formula: Completion Rate = Completed Promises / Total Promises * 100
 */
export function calculateDashboardMetrics(promises: PromiseRecord[]): DashboardMetrics {
  const total = promises.length;
  if (total === 0) {
    return {
      totalPromises: 0,
      completed: 0,
      inProgress: 0,
      initialStage: 0,
      notStarted: 0,
      workStartedCount: 0,
      completionRate: 0,
      pendingCount: 0,
      highPriorityCount: 0,
      highPriorityCompleted: 0,
      highPriorityCompletionRate: 0,
    };
  }

  let completed = 0;
  let inProgress = 0;
  let initialStage = 0;
  let notStarted = 0;
  let workStartedCount = 0;
  let highPriorityCount = 0;
  let highPriorityCompleted = 0;

  for (const p of promises) {
    if (p.status === 'COMPLETED') completed++;
    else if (p.status === 'IN_PROGRESS') inProgress++;
    else if (p.status === 'INITIAL_STAGE') initialStage++;
    else if (p.status === 'NOT_STARTED') notStarted++;

    if (p.workStarted) workStartedCount++;

    if (p.politicalImportance === 'HIGH') {
      highPriorityCount++;
      if (p.status === 'COMPLETED') highPriorityCompleted++;
    }
  }

  const completionRate = Math.round((completed / total) * 1000) / 10;
  const highPriorityCompletionRate = highPriorityCount > 0 
    ? Math.round((highPriorityCompleted / highPriorityCount) * 1000) / 10 
    : 0;

  return {
    totalPromises: total,
    completed,
    inProgress,
    initialStage,
    notStarted,
    workStartedCount,
    completionRate,
    pendingCount: total - completed,
    highPriorityCount,
    highPriorityCompleted,
    highPriorityCompletionRate,
  };
}

/**
 * Aggregate promise statistics grouped by Department
 */
export function calculateDepartmentMetrics(promises: PromiseRecord[]): DepartmentMetrics[] {
  const map = new Map<string, {
    total: number;
    completed: number;
    inProgress: number;
    initialStage: number;
    notStarted: number;
  }>();

  for (const p of promises) {
    for (const dept of p.departments) {
      let stats = map.get(dept);
      if (!stats) {
        stats = { total: 0, completed: 0, inProgress: 0, initialStage: 0, notStarted: 0 };
        map.set(dept, stats);
      }
      stats.total++;
      if (p.status === 'COMPLETED') stats.completed++;
      else if (p.status === 'IN_PROGRESS') stats.inProgress++;
      else if (p.status === 'INITIAL_STAGE') stats.initialStage++;
      else if (p.status === 'NOT_STARTED') stats.notStarted++;
    }
  }

  const result: DepartmentMetrics[] = [];
  map.forEach((stats, department) => {
    const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 1000) / 10 : 0;
    result.push({
      department,
      totalPromises: stats.total,
      completed: stats.completed,
      inProgress: stats.inProgress,
      initialStage: stats.initialStage,
      notStarted: stats.notStarted,
      completionRate: rate,
      pendingPromises: stats.total - stats.completed,
    });
  });

  // Sort by total promises descending
  return result.sort((a, b) => b.totalPromises - a.totalPromises);
}

/**
 * Aggregate promise statistics grouped by Category
 */
export function calculateCategoryMetrics(promises: PromiseRecord[]): CategoryMetrics[] {
  const map = new Map<string, {
    total: number;
    completed: number;
    inProgress: number;
    initialStage: number;
    notStarted: number;
  }>();

  for (const p of promises) {
    const cat = p.category || 'अन्य श्रेणी';
    let stats = map.get(cat);
    if (!stats) {
      stats = { total: 0, completed: 0, inProgress: 0, initialStage: 0, notStarted: 0 };
      map.set(cat, stats);
    }
    stats.total++;
    if (p.status === 'COMPLETED') stats.completed++;
    else if (p.status === 'IN_PROGRESS') stats.inProgress++;
    else if (p.status === 'INITIAL_STAGE') stats.initialStage++;
    else if (p.status === 'NOT_STARTED') stats.notStarted++;
  }

  const result: CategoryMetrics[] = [];
  map.forEach((stats, category) => {
    const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 1000) / 10 : 0;
    result.push({
      category,
      totalPromises: stats.total,
      completed: stats.completed,
      inProgress: stats.inProgress,
      initialStage: stats.initialStage,
      notStarted: stats.notStarted,
      completionRate: rate,
      pendingPromises: stats.total - stats.completed,
    });
  });

  return result.sort((a, b) => b.totalPromises - a.totalPromises);
}
