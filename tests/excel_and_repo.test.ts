import { describe, it, expect, beforeEach } from 'vitest';
import ExcelJS from 'exceljs';
import { 
  parseHeaders, 
  classifyWorksheet, 
  cleanText, 
  inspectWorkbook, 
  parsePromiseRecords, 
  generateImportPreview, 
  generateErrorReportCsv,
  STATUS_MAPPING,
  IMPORTANCE_MAPPING 
} from '../src/lib/excel/parser';
import { exportPromisesToExcel } from '../src/lib/excel/exporter';
import { DevPromiseRepository } from '../src/lib/repositories/dev/dev-repository';
import { PromiseRecord, ImportValidationError } from '../src/types';

describe('Excel Parser Module', () => {
  it('correctly cleans text, handles nulls, undefined, and ExcelJS rich-text', () => {
    expect(cleanText(null)).toBe('');
    expect(cleanText(undefined)).toBe('');
    expect(cleanText('  मध्य प्रदेश  ')).toBe('मध्य प्रदेश');
    expect(cleanText({ text: '  रिच टेक्स्ट  ' })).toBe('रिच टेक्स्ट');
  });

  it('detects duplicate headers and assigns deterministic indexed keys', () => {
    // Note: parseHeaders expects 1-indexed array from ExcelJS row (index 0 is unused)
    const rowValues = [
      undefined,
      'क्रमांक',
      'घोषणा / वादा',
      'Reference Link',
      'Reference Link',
      'टिप्पणी',
      'टिप्पणी',
      'अनपेक्षित स्तंभ'
    ];

    const { headers, duplicateHeaders } = parseHeaders(rowValues);

    expect(headers.length).toBe(7);
    expect(duplicateHeaders).toContain('Reference Link');
    expect(duplicateHeaders).toContain('टिप्पणी');

    const ref1 = headers.find(h => h.originalLabel === 'Reference Link' && !h.isDuplicate);
    const ref2 = headers.find(h => h.originalLabel === 'Reference Link' && h.isDuplicate);
    expect(ref1).toBeDefined();
    expect(ref2).toBeDefined();
    expect(ref1?.internalKey).toBe('reference_link');
    expect(ref2?.internalKey).toBe('reference_link__2');

    const note1 = headers.find(h => h.originalLabel === 'टिप्पणी' && !h.isDuplicate);
    const note2 = headers.find(h => h.originalLabel === 'टिप्पणी' && h.isDuplicate);
    expect(note1).toBeDefined();
    expect(note2).toBeDefined();
    expect(note2?.internalKey).toBe('टिप्पणी__2');
  });

  it('classifies worksheets based on heuristics and header inspection', () => {
    const primaryHeaders = ['क्रमांक', 'घोषणा / वादा', 'संबंधित मंत्रालय / विभाग', 'श्रेणी / क्षेत्र', 'वर्तमान क्रियान्वयन की स्थिति'];
    expect(classifyWorksheet('All Promises', primaryHeaders, 414)).toBe('PRIMARY_PROMISES');
    expect(classifyWorksheet('Master Sheet', primaryHeaders, 200)).toBe('PRIMARY_PROMISES');
    expect(classifyWorksheet('Sheet3', primaryHeaders, 30)).toBe('COHORT_SUBSET');
    expect(classifyWorksheet('Dept_Names', ['S.no', 'Name of Department'], 45)).toBe('DEPARTMENT_REFERENCE');
    expect(classifyWorksheet('Work_Distribution', ['S.No', 'Cohort POC', 'Department'], 50)).toBe('INTERNAL_WORKFLOW');
    expect(classifyWorksheet('Sheet14', ['Summary'], 0)).toBe('EMPTY_OR_PIVOT');
  });

  it('normalizes canonical Hindi statuses and rejects unknown statuses', () => {
    expect(STATUS_MAPPING['पूर्ण']).toBe('COMPLETED');
    expect(STATUS_MAPPING['completed']).toBe('COMPLETED');
    expect(STATUS_MAPPING['प्रगति पर']).toBe('IN_PROGRESS');
    expect(STATUS_MAPPING['in progress']).toBe('IN_PROGRESS');
    expect(STATUS_MAPPING['प्रारंभिक चरण']).toBe('INITIAL_STAGE');
    expect(STATUS_MAPPING['initial stage']).toBe('INITIAL_STAGE');
    expect(STATUS_MAPPING['प्रारंभ नहीं']).toBe('NOT_STARTED');
    expect(STATUS_MAPPING['not started']).toBe('NOT_STARTED');
    expect(STATUS_MAPPING['अज्ञात स्थिति']).toBeUndefined();
  });

  it('normalizes canonical political importance values', () => {
    expect(IMPORTANCE_MAPPING['उच्च']).toBe('HIGH');
    expect(IMPORTANCE_MAPPING['high']).toBe('HIGH');
    expect(IMPORTANCE_MAPPING['मध्यम']).toBe('MEDIUM');
    expect(IMPORTANCE_MAPPING['medium']).toBe('MEDIUM');
    expect(IMPORTANCE_MAPPING['सीमित']).toBe('LIMITED');
    expect(IMPORTANCE_MAPPING['low']).toBe('LIMITED');
  });

  it('inspects a multi-sheet Excel workbook buffer and identifies primary candidate', async () => {
    const wb = new ExcelJS.Workbook();

    // Sheet 1: Master
    const s1 = wb.addWorksheet('All Promises');
    s1.addRow(['क्रमांक', 'घोषणा / वादा', 'संबंधित मंत्रालय / विभाग', 'श्रेणी / क्षेत्र', 'वर्तमान क्रियान्वयन की स्थिति']);
    s1.addRow([1, 'लाडली बहना योजना', 'महिला एवं बाल विकास विभाग', 'नारी सशक्तिकरण', 'पूर्ण']);
    s1.addRow([2, 'किसान सम्मान निधि', 'किसान कल्याण विभाग', 'समृद्ध किसान', 'प्रगति पर']);

    // Sheet 2: Departments Reference
    const s2 = wb.addWorksheet('Dept_Names');
    s2.addRow(['S.no', 'Name of Department']);
    s2.addRow([1, 'महिला एवं बाल विकास विभाग']);
    s2.addRow([2, 'किसान कल्याण विभाग']);

    const buffer = await wb.xlsx.writeBuffer();
    const inspection = await inspectWorkbook(Buffer.from(buffer), 'test_manifesto.xlsx');

    expect(inspection.totalWorksheets).toBe(2);
    expect(inspection.primaryWorksheetName).toBe('All Promises');
    
    const primaryInfo = inspection.worksheets.find(w => w.name === 'All Promises');
    expect(primaryInfo).toBeDefined();
    expect(primaryInfo?.classification).toBe('PRIMARY_PROMISES');
    expect(primaryInfo?.rowCount).toBe(2);
    expect(primaryInfo?.columnCount).toBe(5);

    const deptInfo = inspection.worksheets.find(w => w.name === 'Dept_Names');
    expect(deptInfo?.classification).toBe('DEPARTMENT_REFERENCE');
    expect(deptInfo?.rowCount).toBe(2);
  });

  it('validates records, extracts unknown columns, skips blank rows, and reports errors', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('All Promises');
    
    ws.addRow([
      'क्रमांक', 
      'घोषणा / वादा', 
      'संक्षिप्त विवरण', 
      'संबंधित मंत्रालय / विभाग', 
      'श्रेणी / क्षेत्र', 
      'वर्तमान क्रियान्वयन की स्थिति',
      'राजनीतिक महत्व',
      'अतिरिक्त विशेष टिप्पणी' // Unknown column!
    ]);

    // Row 2: Valid record with unknown field
    ws.addRow([
      1, 
      'लाडली बहना आवास', 
      'आवास निर्माण सहायता', 
      'पंचायत एवं ग्रामीण विकास, महिला एवं बाल विकास', 
      'गरीब कल्याण', 
      'पूर्ण', 
      'उच्च',
      'विशेष प्राथमिकता परियोजना'
    ]);

    // Row 3: Missing Title (Invalid)
    ws.addRow([
      2, 
      '', 
      'विवरण', 
      'गृह विभाग', 
      'सुशासन', 
      'प्रगति पर', 
      'मध्यम',
      ''
    ]);

    // Row 4: Invalid Status (Invalid)
    ws.addRow([
      3, 
      'अवैध स्थिति वादा', 
      'विवरण', 
      'गृह विभाग', 
      'सुशासन', 
      'संशोधनाधीन', // Not a valid status! 
      'मध्यम',
      ''
    ]);

    // Row 5: Duplicate ID (Invalid)
    ws.addRow([
      1, 
      'डुप्लीकेट आईडी वाला वादा', 
      'विवरण', 
      'वित्त विभाग', 
      'अर्थव्यवस्था', 
      'प्रारंभ नहीं', 
      'सीमित',
      ''
    ]);

    // Row 6: Entirely blank row (should be skipped, not error)
    ws.addRow(['', '', '', '', '', '', '', '']);

    const buffer = await wb.xlsx.writeBuffer();
    const { records, errors } = await parsePromiseRecords(Buffer.from(buffer), 'All Promises');

    expect(records.length).toBe(1);
    expect(records[0].id).toBe(1);
    expect(records[0].title).toBe('लाडली बहना आवास');
    expect(records[0].status).toBe('COMPLETED');
    expect(records[0].departments).toContain('पंचायत एवं ग्रामीण विकास');
    expect(records[0].departments).toContain('महिला एवं बाल विकास');
    expect(records[0].unknownFields?.['अतिरिक्त विशेष टिप्पणी']).toBe('विशेष प्राथमिकता परियोजना');

    expect(errors.length).toBe(3);
    const missingTitleErr = errors.find(e => e.rowNumber === 3);
    const invalidStatusErr = errors.find(e => e.rowNumber === 4);
    const duplicateIdErr = errors.find(e => e.rowNumber === 5);

    expect(missingTitleErr?.code).toBe('MISSING_REQUIRED');
    expect(invalidStatusErr?.code).toBe('INVALID_STATUS');
    expect(duplicateIdErr?.code).toBe('DUPLICATE_ID');
  });

  it('generates an accurate import preview comparison (new, updated, unchanged, invalid)', () => {
    const existing: PromiseRecord[] = [
      {
        id: 1,
        title: 'पुराना वादा 1',
        description: 'विवरण 1',
        departments: ['गृह विभाग'],
        primaryDepartment: 'गृह विभाग',
        category: 'सुशासन',
        workStarted: true,
        status: 'IN_PROGRESS',
        statusRaw: 'प्रगति पर',
        politicalImportance: 'HIGH',
        politicalImportanceRaw: 'उच्च',
        referenceLinks: [],
        sourceSheet: 'All Promises',
        sourceRow: 2,
        updatedAt: '2026-10-21T00:00:00Z',
      },
      {
        id: 2,
        title: 'अपरिवर्तित वादा 2',
        description: 'विवरण 2',
        departments: ['वित्त विभाग'],
        primaryDepartment: 'वित्त विभाग',
        category: 'अर्थव्यवस्था',
        workStarted: true,
        status: 'COMPLETED',
        statusRaw: 'पूर्ण',
        politicalImportance: 'MEDIUM',
        politicalImportanceRaw: 'मध्यम',
        referenceLinks: [],
        sourceSheet: 'All Promises',
        sourceRow: 3,
        updatedAt: '2026-10-21T00:00:00Z',
      }
    ];

    const incoming: PromiseRecord[] = [
      // ID 1: Updated status from IN_PROGRESS to COMPLETED
      {
        ...existing[0],
        status: 'COMPLETED',
        statusRaw: 'पूर्ण',
      },
      // ID 2: Identical (unchanged)
      {
        ...existing[1],
      },
      // ID 3: Brand new record
      {
        id: 3,
        title: 'नया वादा 3',
        description: 'विवरण 3',
        departments: ['शिक्षा विभाग'],
        primaryDepartment: 'शिक्षा विभाग',
        category: 'शिक्षा',
        workStarted: false,
        status: 'NOT_STARTED',
        statusRaw: 'प्रारंभ नहीं',
        politicalImportance: 'LIMITED',
        politicalImportanceRaw: 'सीमित',
        referenceLinks: [],
        sourceSheet: 'All Promises',
        sourceRow: 4,
        updatedAt: '2026-10-22T00:00:00Z',
      }
    ];

    const preview = generateImportPreview(incoming, existing, [], 'All Promises');

    expect(preview.incomingTotal).toBe(3);
    expect(preview.existingTotal).toBe(2);
    expect(preview.newCount).toBe(1);
    expect(preview.updatedCount).toBe(1);
    expect(preview.unchangedCount).toBe(1);
    expect(preview.invalidCount).toBe(0);
    expect(preview.sampleNew[0].id).toBe(3);
    expect(preview.sampleUpdated[0].current.id).toBe(1);
    expect(preview.sampleUpdated[0].changedFields).toContain('status');
  });

  it('generates a downloadable CSV error report adhering to RFC 4180 escaping', () => {
    const errors: ImportValidationError[] = [
      {
        worksheet: 'All Promises',
        rowNumber: 15,
        column: 'वर्तमान क्रियान्वयन की स्थिति',
        originalValue: 'संशोधनाधीन, परीक्षण शेष',
        message: 'अमान्य स्थिति मान: "संशोधनाधीन"',
        code: 'INVALID_STATUS' as const,
      }
    ];

    const csv = generateErrorReportCsv(errors);
    expect(csv).toContain('Worksheet,Row Number,Column,Original Value,Error Code,Error Explanation');
    expect(csv).toContain('"All Promises",15,"वर्तमान क्रियान्वयन की स्थिति","संशोधनाधीन, परीक्षण शेष","INVALID_STATUS","अमान्य स्थिति मान: ""संशोधनाधीन"""');
  });
});

describe('DevPromiseRepository & Pub-Sub Data Layer', () => {
  let repo: DevPromiseRepository;

  beforeEach(() => {
    repo = new DevPromiseRepository();
  });

  it('creates, reads, updates, and deletes records with reactive pub-sub notification', async () => {
    let notifyCount = 0;
    const unsubscribe = repo.subscribe(() => {
      notifyCount++;
    });

    // 1. Create
    const created = await repo.create({
      title: 'परीक्षण वादा',
      description: 'परीक्षण विवरण',
      departments: ['ऊर्जा विभाग'],
      primaryDepartment: 'ऊर्जा विभाग',
      category: 'सुशासन',
      workStarted: true,
      status: 'IN_PROGRESS',
      statusRaw: 'प्रगति पर',
      politicalImportance: 'HIGH',
      politicalImportanceRaw: 'उच्च',
      referenceLinks: [],
      sourceSheet: 'All Promises',
      sourceRow: 999,
    });

    expect(created.id).toBeGreaterThan(0);
    expect(created.title).toBe('परीक्षण वादा');
    expect(notifyCount).toBe(1);

    // 2. Read
    const fetched = await repo.getById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(created.id);

    // 3. Update
    const updated = await repo.update(created.id, {
      status: 'COMPLETED',
      notes: 'कार्य पूर्ण हुआ।'
    });
    expect(updated.status).toBe('COMPLETED');
    expect(updated.notes).toBe('कार्य पूर्ण हुआ।');
    expect(notifyCount).toBe(2);

    // 4. Delete
    const deleted = await repo.delete(created.id);
    expect(deleted).toBe(true);
    expect(notifyCount).toBe(3);

    const postDelete = await repo.getById(created.id);
    expect(postDelete).toBeNull();

    unsubscribe();
  });

  it('executes Mode B (Merge Dataset) inserting new and updating modified records', async () => {
    const allBefore = await repo.getAll();
    const first = allBefore[0];

    const incomingRecords: PromiseRecord[] = [
      {
        ...first,
        notes: 'अद्यतन विलय टिप्पणी',
      },
      {
        id: 99999,
        title: 'विलय के माध्यम से नया वादा',
        description: 'विलय विवरण',
        departments: ['वित्त विभाग'],
        primaryDepartment: 'वित्त विभाग',
        category: 'अर्थव्यवस्था',
        workStarted: true,
        status: 'COMPLETED',
        statusRaw: 'पूर्ण',
        politicalImportance: 'HIGH',
        politicalImportanceRaw: 'उच्च',
        referenceLinks: [],
        sourceSheet: 'All Promises',
        sourceRow: 500,
        updatedAt: new Date().toISOString(),
      }
    ];

    const result = await repo.bulkUpsert(incomingRecords);
    expect(result.inserted).toBe(1);
    expect(result.updated).toBe(1);

    const updatedFirst = await repo.getById(first.id);
    expect(updatedFirst?.notes).toBe('अद्यतन विलय टिप्पणी');

    const insertedRecord = await repo.getById(99999);
    expect(insertedRecord?.title).toBe('विलय के माध्यम से नया वादा');

    // Clean up inserted test record
    await repo.delete(99999);
  });

  it('executes Mode A (Replace Dataset) replacing the entire active store atomically', async () => {
    const baselineRecords = await repo.getAll();

    const newDataset: PromiseRecord[] = [
      {
        id: 101,
        title: 'प्रतिस्थापन वादा 1',
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
        updatedAt: new Date().toISOString(),
      },
      {
        id: 102,
        title: 'प्रतिस्थापन वादा 2',
        description: 'विवरण',
        departments: ['राजस्व विभाग'],
        primaryDepartment: 'राजस्व विभाग',
        category: 'सुशासन',
        workStarted: false,
        status: 'NOT_STARTED',
        statusRaw: 'प्रारंभ नहीं',
        politicalImportance: 'MEDIUM',
        politicalImportanceRaw: 'मध्यम',
        referenceLinks: [],
        sourceSheet: 'All Promises',
        sourceRow: 3,
        updatedAt: new Date().toISOString(),
      }
    ];

    let notified = false;
    const unsub = repo.subscribe(() => {
      notified = true;
    });

    const count = await repo.replaceDataset(newDataset);
    expect(count).toBe(2);
    expect(notified).toBe(true);

    const allAfter = await repo.getAll();
    expect(allAfter.length).toBe(2);
    expect(allAfter.map(p => p.id)).toEqual([101, 102]);

    // Restore baseline dataset so subsequent tests or UI have original data
    await repo.replaceDataset(baselineRecords);
    const restored = await repo.getAll();
    expect(restored.length).toBe(baselineRecords.length);

    unsub();
  });
});

describe('Excel Exporter Module', () => {
  it('generates a valid, multi-sheet .xlsx workbook preserving Hindi and metadata', async () => {
    const promises: PromiseRecord[] = [
      {
        id: 1,
        title: 'लाडली बहना योजना',
        description: '₹1250 प्रतिमाह आर्थिक संबल',
        departments: ['महिला एवं बाल विकास विभाग'],
        primaryDepartment: 'महिला एवं बाल विकास विभाग',
        category: 'नारी सशक्तिकरण',
        workStarted: true,
        status: 'COMPLETED',
        statusRaw: 'पूर्ण',
        politicalImportance: 'HIGH',
        politicalImportanceRaw: 'उच्च',
        referenceLinks: ['https://mp.gov.in'],
        sourceSheet: 'All Promises',
        sourceRow: 2,
        updatedAt: '2026-10-21T00:00:00Z',
        unknownFields: { 'कस्टम_फील्ड': 'विशेष मूल्य' }
      }
    ];

    const departments = [
      { id: 'dept-1', sno: 1, name: 'महिला एवं बाल विकास विभाग', promiseCount: 1 }
    ];

    const buffer = await exportPromisesToExcel(promises, {
      title: 'मध्य प्रदेश संकल्प पत्र - परीक्षण निर्यात',
      filterDescription: 'परीक्षण रिकॉर्ड्स',
      departments,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);

    // Validate generated workbook by parsing it back with ExcelJS
    const reloaded = new ExcelJS.Workbook();
    // @ts-expect-error Buffer vs ArrayBuffer compatibility
    await reloaded.xlsx.load(buffer);

    expect(reloaded.worksheets.length).toBe(3);
    
    // Sheet 1: All Promises
    const s1 = reloaded.getWorksheet('All Promises');
    expect(s1).toBeDefined();
    expect(s1?.getCell('A2').value).toBe(1);
    expect(s1?.getCell('B2').value).toBe('लाडली बहना योजना');
    expect(s1?.getCell('G2').value).toBe('पूर्ण');
    
    // Check custom unknown field was exported into columns
    const headerRowValues = (s1?.getRow(1).values as string[]) || [];
    expect(headerRowValues).toContain('कस्टम_फील्ड');

    // Sheet 2: Dept_Names
    const s2 = reloaded.getWorksheet('Dept_Names');
    expect(s2).toBeDefined();
    expect(s2?.getCell('B2').value).toBe('महिला एवं बाल विकास विभाग');

    // Sheet 3: Metadata_Summary
    const s3 = reloaded.getWorksheet('Metadata_Summary');
    expect(s3).toBeDefined();
    expect(s3?.getCell('B2').value).toBe('मध्य प्रदेश संकल्प पत्र - परीक्षण निर्यात');
  });

  it('successfully inspects and parses the actual MP Manifesto Analysis.xlsx workbook', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'data', 'MP Manifesto Analysis.xlsx');

    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      
      // 1. Inspect workbook
      const inspection = await inspectWorkbook(fileBuffer, 'MP Manifesto Analysis.xlsx');
      expect(inspection.totalWorksheets).toBe(8);
      expect(inspection.primaryWorksheetName).toBe('All Promises');
      
      const primarySheet = inspection.worksheets.find(w => w.name === 'All Promises');
      expect(primarySheet).toBeDefined();
      expect(primarySheet?.rowCount).toBe(414);
      expect(primarySheet?.duplicateHeaders).toContain('Reference Link');
      expect(primarySheet?.duplicateHeaders).toContain('टिप्पणी');

      // 2. Parse primary promises
      const { records, errors } = await parsePromiseRecords(fileBuffer, 'All Promises');
      expect(records.length).toBe(414);
      expect(errors.length).toBe(0);

      // Status breakdown
      const completed = records.filter(r => r.status === 'COMPLETED').length;
      const inProgress = records.filter(r => r.status === 'IN_PROGRESS').length;
      const initialStage = records.filter(r => r.status === 'INITIAL_STAGE').length;
      const notStarted = records.filter(r => r.status === 'NOT_STARTED').length;

      expect(completed).toBe(47);
      expect(inProgress).toBe(244);
      expect(initialStage).toBe(62);
      expect(notStarted).toBe(61);
      expect(completed + inProgress + initialStage + notStarted).toBe(414);
    }
  });
});

