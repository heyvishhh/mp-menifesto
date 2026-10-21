import { describe, it, expect } from 'vitest';
import { 
  calculateDashboardMetrics, 
  calculateDepartmentMetrics, 
  filterPromises 
} from '../src/lib/analytics/metrics';
import { generateKeyInsights } from '../src/lib/analytics/insights';
import { PromiseRecord } from '../src/types';
import rawDataset from '../src/lib/data/manifesto_data.json';

describe('MP Manifesto Analytics Engine', () => {
  const datasetPromises = rawDataset.promises as unknown as PromiseRecord[];

  it('correctly calculates metrics for the entire 414 workbook dataset', () => {
    const metrics = calculateDashboardMetrics(datasetPromises);

    expect(metrics.totalPromises).toBe(414);
    expect(metrics.completed).toBe(47);
    expect(metrics.inProgress).toBe(244);
    expect(metrics.initialStage).toBe(62);
    expect(metrics.notStarted).toBe(61);

    // Sum check
    expect(metrics.completed + metrics.inProgress + metrics.initialStage + metrics.notStarted).toBe(414);

    // Completion Rate: 47 / 414 * 100 = 11.35% -> rounded to 11.4%
    expect(metrics.completionRate).toBe(11.4);

    // Pending Count: 414 - 47 = 367
    expect(metrics.pendingCount).toBe(367);
  });

  it('strictly handles empty promise array (zero denominator) without crashing', () => {
    const metrics = calculateDashboardMetrics([]);

    expect(metrics.totalPromises).toBe(0);
    expect(metrics.completed).toBe(0);
    expect(metrics.completionRate).toBe(0);
    expect(metrics.pendingCount).toBe(0);
  });

  it('never counts IN_PROGRESS promises as completed in the primary completion rate', () => {
    const testPromises: PromiseRecord[] = [
      {
        id: 1,
        title: 'वादा 1',
        description: 'विवरण',
        departments: ['गृह विभाग'],
        primaryDepartment: 'गृह विभाग',
        category: 'सुशासन',
        workStarted: true,
        status: 'COMPLETED',
        statusRaw: 'पूर्ण',
        politicalImportance: 'HIGH',
        politicalImportanceRaw: 'उच्च',
        referenceLinks: [],
        sourceSheet: 'All Promises',
        sourceRow: 2,
        updatedAt: '2026-10-21T00:00:00Z',
      },
      {
        id: 2,
        title: 'वादा 2',
        description: 'विवरण',
        departments: ['गृह विभाग'],
        primaryDepartment: 'गृह विभाग',
        category: 'सुशासन',
        workStarted: true,
        status: 'IN_PROGRESS',
        statusRaw: 'प्रगति पर',
        politicalImportance: 'MEDIUM',
        politicalImportanceRaw: 'मध्यम',
        referenceLinks: [],
        sourceSheet: 'All Promises',
        sourceRow: 3,
        updatedAt: '2026-10-21T00:00:00Z',
      },
    ];

    const metrics = calculateDashboardMetrics(testPromises);
    expect(metrics.totalPromises).toBe(2);
    expect(metrics.completed).toBe(1);
    expect(metrics.inProgress).toBe(1);
    // Completion rate must strictly be 1 / 2 * 100 = 50.0%
    expect(metrics.completionRate).toBe(50.0);
  });

  it('correctly handles multi-department relationships in department rollups', () => {
    const multiDeptPromise: PromiseRecord = {
      id: 999,
      title: 'संयुक्त वादा',
      description: 'विवरण',
      departments: ['विभाग क', 'विभाग ख'],
      primaryDepartment: 'विभाग क',
      category: 'विकास',
      workStarted: true,
      status: 'COMPLETED',
      statusRaw: 'पूर्ण',
      politicalImportance: 'HIGH',
      politicalImportanceRaw: 'उच्च',
      referenceLinks: [],
      sourceSheet: 'All Promises',
      sourceRow: 100,
      updatedAt: '2026-10-21T00:00:00Z',
    };

    const deptMetrics = calculateDepartmentMetrics([multiDeptPromise]);
    expect(deptMetrics.length).toBe(2);
    expect(deptMetrics.find(d => d.department === 'विभाग क')?.totalPromises).toBe(1);
    expect(deptMetrics.find(d => d.department === 'विभाग ख')?.totalPromises).toBe(1);
  });

  it('generates deterministic key insights distinguishing facts and metrics', () => {
    const insights = generateKeyInsights(datasetPromises);
    expect(insights.length).toBeGreaterThan(0);

    const fact = insights.find(i => i.type === 'FACT');
    const metric = insights.find(i => i.type === 'METRIC');

    expect(fact).toBeDefined();
    expect(metric).toBeDefined();
    expect(fact?.title).toBeDefined();
  });

  it('filters promises accurately by category, department, and search', () => {
    const filteredByCat = filterPromises(datasetPromises, { category: 'समृद्ध किसान' });
    expect(filteredByCat.length).toBe(83);

    const filteredByStatus = filterPromises(datasetPromises, { status: 'COMPLETED' });
    expect(filteredByStatus.length).toBe(47);

    const filteredBySearch = filterPromises(datasetPromises, { searchQuery: 'लाडली' });
    expect(filteredBySearch.length).toBeGreaterThan(0);
  });
});
