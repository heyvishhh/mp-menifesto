import ExcelJS from 'exceljs';
import { 
  PromiseRecord, 
  PromiseStatus, 
  PoliticalImportance, 
  WorksheetClassification, 
  ParsedWorksheetInfo, 
  WorkbookInspectionResult, 
  ImportValidationError, 
  ImportPreviewComparison,
  HeaderInfo 
} from '@/types';

// Canonical status mappings discovered in MP Manifesto Analysis workbook
export const STATUS_MAPPING: Record<string, PromiseStatus> = {
  'पूर्ण': 'COMPLETED',
  'completed': 'COMPLETED',
  'प्रगति पर': 'IN_PROGRESS',
  'in progress': 'IN_PROGRESS',
  'in-progress': 'IN_PROGRESS',
  'प्रारंभिक चरण': 'INITIAL_STAGE',
  'initial stage': 'INITIAL_STAGE',
  'प्रारंभ नहीं': 'NOT_STARTED',
  'not started': 'NOT_STARTED',
  'not-started': 'NOT_STARTED',
};

export const IMPORTANCE_MAPPING: Record<string, PoliticalImportance> = {
  'उच्च': 'HIGH',
  'high': 'HIGH',
  'मध्यम': 'MEDIUM',
  'medium': 'MEDIUM',
  'सीमित': 'LIMITED',
  'limited': 'LIMITED',
  'low': 'LIMITED',
};

/**
 * Normalizes text: trims spaces, collapses internal whitespace
 */
export function cleanText(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object' && val !== null && 'text' in val) {
    // ExcelJS RichText or hyperlink object
    return String((val as { text: unknown }).text || '').trim();
  }
  return String(val).trim();
}

/**
 * Classify a worksheet based on its detected headers and name
 */
export function classifyWorksheet(name: string, headers: string[], rowCount: number): WorksheetClassification {
  if (rowCount === 0) return 'EMPTY_OR_PIVOT';

  const lowerName = name.toLowerCase();
  const headerStr = headers.map(h => h.toLowerCase()).join(' ');

  if (lowerName.includes('pivot') || lowerName.includes('sheet14')) {
    return 'EMPTY_OR_PIVOT';
  }

  // Work distribution / cohort POC check (prioritized over generic department reference)
  if (lowerName.includes('work_distribution') || headerStr.includes('poc') || headerStr.includes('cohort')) {
    return 'INTERNAL_WORKFLOW';
  }

  // Dept_Names check
  if (lowerName.includes('dept') || (headerStr.includes('name of department') || headerStr.includes('department'))) {
    if (headerStr.includes('s.no') || headerStr.includes('sno') || headerStr.includes('क्रमांक')) {
      return 'DEPARTMENT_REFERENCE';
    }
  }

  // Primary Promises check
  const hasSerial = headerStr.includes('क्रमांक') || headerStr.includes('serial') || headerStr.includes('id');
  const hasPromise = headerStr.includes('घोषणा') || headerStr.includes('वादा') || headerStr.includes('promise');
  const hasDept = headerStr.includes('विभाग') || headerStr.includes('मंत्रालय') || headerStr.includes('department');
  const hasCategory = headerStr.includes('श्रेणी') || headerStr.includes('क्षेत्र') || headerStr.includes('category');
  const hasStatus = headerStr.includes('स्थिति') || headerStr.includes('status');

  if ((hasPromise || hasSerial) && hasDept && (hasCategory || hasStatus)) {
    if (lowerName.includes('all') || lowerName.includes('master') || rowCount > 100) {
      return 'PRIMARY_PROMISES';
    }
    // If it has all fields but only a subset of rows (like Sheet3, Sheet4, Sheet5)
    return 'COHORT_SUBSET';
  }

  return 'COHORT_SUBSET';
}

/**
 * Detect headers and resolve duplicates while retaining original labels.
 * Gracefully supports both 0-indexed and ExcelJS 1-indexed arrays.
 */
export function parseHeaders(rowValues: (string | null | undefined)[]): {
  headers: HeaderInfo[];
  duplicateHeaders: string[];
} {
  const headers: HeaderInfo[] = [];
  const duplicateHeaders: string[] = [];
  const seenCounts = new Map<string, number>();

  // If the array begins with an unused slot (like ExcelJS row.values), start from index 1.
  // Otherwise, start from index 0 and 1-index the columns.
  const isOneIndexed = rowValues.length > 1 && (rowValues[0] === undefined || rowValues[0] === null || rowValues[0] === '');
  const startIndex = isOneIndexed ? 1 : 0;

  for (let i = startIndex; i < rowValues.length; i++) {
    const val = rowValues[i];
    const label = cleanText(val);
    if (!label) continue;

    const lower = label.toLowerCase().replace(/[^a-z0-9_\u0900-\u097F]/g, '_');
    const count = seenCounts.get(lower) || 0;
    seenCounts.set(lower, count + 1);

    let internalKey = lower;
    let isDuplicate = false;

    if (count > 0) {
      internalKey = `${lower}__${count + 1}`;
      isDuplicate = true;
      if (!duplicateHeaders.includes(label)) {
        duplicateHeaders.push(label);
      }
    }

    const colIndex = isOneIndexed ? i : i + 1;

    headers.push({
      originalLabel: label,
      internalKey,
      columnIndex: colIndex,
      isDuplicate,
    });
  }

  return { headers, duplicateHeaders };
}

/**
 * Inspect an Excel workbook buffer and generate metadata for all worksheets
 */
export async function inspectWorkbook(
  buffer: ArrayBuffer | Buffer,
  filename = 'workbook.xlsx'
): Promise<WorkbookInspectionResult> {
  const workbook = new ExcelJS.Workbook();
  // @ts-expect-error ExcelJS Buffer vs ArrayBuffer compatibility
  await workbook.xlsx.load(buffer);

  const worksheets: ParsedWorksheetInfo[] = [];
  let detectedPrimarySheet: string | null = null;

  workbook.eachSheet((worksheet) => {
    let headerRowIdx = 1;
    let detectedHeaders: HeaderInfo[] = [];
    let duplicateHeaders: string[] = [];
    let emptyRows = 0;
    const sampleRows: Record<string, unknown>[] = [];

    // Find actual header row (look within first 5 rows for signature columns)
    for (let r = 1; r <= Math.min(5, worksheet.rowCount); r++) {
      const row = worksheet.getRow(r);
      const rowVals: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        rowVals.push(cleanText(cell.value));
      });

      const { headers, duplicateHeaders: dups } = parseHeaders(rowVals);
      const headerStr = headers.map(h => h.originalLabel.toLowerCase()).join(' ');

      if (
        headerStr.includes('घोषणा') || 
        headerStr.includes('क्रमांक') || 
        headerStr.includes('name of department') || 
        headerStr.includes('poc')
      ) {
        headerRowIdx = r;
        detectedHeaders = headers;
        duplicateHeaders = dups;
        break;
      }
    }

    // If no signature header found, default to row 1
    if (detectedHeaders.length === 0 && worksheet.rowCount > 0) {
      const row = worksheet.getRow(1);
      const rowVals: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        rowVals.push(cleanText(cell.value));
      });
      const parsed = parseHeaders(rowVals);
      detectedHeaders = parsed.headers;
      duplicateHeaders = parsed.duplicateHeaders;
    }

    // Extract sample data rows (up to 5 rows)
    const totalDataRows = Math.max(0, worksheet.rowCount - headerRowIdx);
    for (let r = headerRowIdx + 1; r <= worksheet.rowCount; r++) {
      const row = worksheet.getRow(r);
      let hasData = false;
      const rowObj: Record<string, unknown> = {};

      detectedHeaders.forEach((h) => {
        const cell = row.getCell(h.columnIndex);
        const cellVal = cell.value;
        const valStr = cleanText(cellVal);
        if (valStr !== '') hasData = true;
        rowObj[h.internalKey] = valStr;
      });

      if (!hasData) {
        emptyRows++;
      } else if (sampleRows.length < 5) {
        sampleRows.push(rowObj);
      }
    }

    const classification = classifyWorksheet(
      worksheet.name,
      detectedHeaders.map(h => h.originalLabel),
      totalDataRows - emptyRows
    );

    const isPrimary = classification === 'PRIMARY_PROMISES';
    if (isPrimary && !detectedPrimarySheet) {
      detectedPrimarySheet = worksheet.name;
    }

    worksheets.push({
      name: worksheet.name,
      classification,
      rowCount: totalDataRows - emptyRows,
      columnCount: detectedHeaders.length,
      headerRowIndex: headerRowIdx,
      headers: detectedHeaders,
      duplicateHeaders,
      emptyRowCount: emptyRows,
      sampleRows,
      isPrimaryCandidate: isPrimary,
    });
  });

  return {
    filename,
    fileSizeBytes: buffer.byteLength,
    worksheets,
    primaryWorksheetName: detectedPrimarySheet,
    totalWorksheets: worksheets.length,
  };
}

/**
 * Parse primary promise records from a designated worksheet
 */
export async function parsePromiseRecords(
  buffer: ArrayBuffer | Buffer,
  targetSheetName?: string
): Promise<{
  records: PromiseRecord[];
  errors: ImportValidationError[];
  sheetName: string;
}> {
  const workbook = new ExcelJS.Workbook();
  // @ts-expect-error ExcelJS Buffer vs ArrayBuffer compatibility
  await workbook.xlsx.load(buffer);

  // Find target worksheet
  let worksheet = targetSheetName ? workbook.getWorksheet(targetSheetName) : null;
  if (!worksheet) {
    // Fallback: look for "All Promises" or first sheet
    worksheet = workbook.getWorksheet('All Promises') || workbook.worksheets[0];
  }

  if (!worksheet) {
    throw new Error('Workbook contains no readable worksheets.');
  }

  const sheetName = worksheet.name;
  let headerRowIdx = 1;
  let headers: HeaderInfo[] = [];

  for (let r = 1; r <= Math.min(5, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r);
    const rowVals: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      rowVals.push(cleanText(cell.value));
    });
    const parsed = parseHeaders(rowVals);
    const headerStr = parsed.headers.map(h => h.originalLabel).join(' ');
    if (headerStr.includes('घोषणा') || headerStr.includes('क्रमांक')) {
      headerRowIdx = r;
      headers = parsed.headers;
      break;
    }
  }

  if (headers.length === 0) {
    const rowVals: string[] = [];
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (c) => rowVals.push(cleanText(c.value)));
    headers = parseHeaders(rowVals).headers;
  }

  const records: PromiseRecord[] = [];
  const errors: ImportValidationError[] = [];
  const seenIds = new Set<number>();

  for (let r = headerRowIdx + 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const rowData: Record<string, string> = {};
    const unknownData: Record<string, unknown> = {};
    let hasAnyData = false;

    headers.forEach((h) => {
      const cell = row.getCell(h.columnIndex);
      const textVal = cleanText(cell.value);
      if (textVal !== '') hasAnyData = true;

      const normLabel = h.originalLabel.toLowerCase().trim();
      // Match known fields
      if (normLabel.includes('क्रमांक') || normLabel === 'id' || normLabel === 'serial') {
        rowData.id = textVal;
      } else if (normLabel.includes('घोषणा') || normLabel.includes('वादा') || normLabel === 'title') {
        rowData.title = textVal;
      } else if (normLabel.includes('संक्षिप्त') || normLabel.includes('विवरण') || normLabel === 'description') {
        rowData.description = textVal;
      } else if (normLabel.includes('विभाग') || normLabel.includes('मंत्रालय') || normLabel === 'department') {
        rowData.department = textVal;
      } else if (normLabel.includes('श्रेणी') || normLabel.includes('क्षेत्र') || normLabel === 'category') {
        rowData.category = textVal;
      } else if (normLabel.includes('प्रारंभ होने की स्थिति') || normLabel === 'work_started') {
        rowData.workStarted = textVal;
      } else if (normLabel.includes('ज़मीनी') || normLabel.includes('प्रभाव') || normLabel.includes('ground')) {
        rowData.groundImpact = textVal;
      } else if (normLabel.includes('वर्तमान क्रियान्वयन') || normLabel.includes('क्रियान्वयन की स्थिति') || normLabel.includes('क्रियान्वयन') || normLabel.includes('status') || normLabel === 'स्थिति') {
        rowData.status = textVal;
      } else if (normLabel.includes('महत्व') || normLabel === 'importance') {
        rowData.importance = textVal;
      } else if (normLabel.includes('जन-प्रतिक्रिया') || normLabel.includes('धारणा')) {
        rowData.publicPerception = textVal;
      } else if (normLabel.includes('लंबित') && normLabel.includes('कारण')) {
        rowData.delayReason = textVal;
      } else if (normLabel.includes('उपलब्धियाँ') || normLabel.includes('achievements')) {
        rowData.keyAchievements = textVal;
      } else if (normLabel.includes('reference link') || normLabel.includes('संदर्भ')) {
        if (!rowData.referenceLink1) rowData.referenceLink1 = textVal;
        else rowData.referenceLink2 = textVal;
      } else if (normLabel.includes('news image')) {
        rowData.newsImage = textVal;
      } else if (normLabel.includes('चुनावी') || normLabel.includes('मुद्दा')) {
        rowData.politicalIssue = textVal;
      } else if (normLabel.includes('पुष्टि')) {
        rowData.officialConfirmationLink = textVal;
      } else if (normLabel === 'टिप्पणी' || normLabel === 'notes' || normLabel.startsWith('टिप्पणी')) {
        if (!rowData.notes) rowData.notes = textVal;
        else rowData.updateNotes = textVal;
      } else {
        // Unknown or custom field: preserve!
        unknownData[h.originalLabel] = textVal;
      }
    });

    if (!hasAnyData) continue; // skip blank row

    // Validation 1: Required Serial / ID
    const rawIdStr = rowData.id;
    if (!rawIdStr) {
      errors.push({
        worksheet: sheetName,
        rowNumber: r,
        column: 'क्रमांक (ID)',
        originalValue: null,
        message: 'पंक्ति में क्रमांक (ID) अनुपस्थित है।',
        code: 'MISSING_REQUIRED',
      });
      continue;
    }

    const pId = Math.round(Number(rawIdStr));
    if (isNaN(pId) || pId <= 0) {
      errors.push({
        worksheet: sheetName,
        rowNumber: r,
        column: 'क्रमांक (ID)',
        originalValue: rawIdStr,
        message: `अवैध क्रमांक मान: '${rawIdStr}'। धनात्मक पूर्णांक अपेक्षित है।`,
        code: 'INVALID_TYPE',
      });
      continue;
    }

    if (seenIds.has(pId)) {
      errors.push({
        worksheet: sheetName,
        rowNumber: r,
        column: 'क्रमांक (ID)',
        originalValue: pId,
        message: `डुप्लीकेट क्रमांक (ID: #${pId}) पूर्व पंक्ति में पहले से मौजूद है।`,
        code: 'DUPLICATE_ID',
      });
      continue;
    }
    seenIds.add(pId);

    // Validation 2: Required Title
    const title = rowData.title;
    if (!title) {
      errors.push({
        worksheet: sheetName,
        rowNumber: r,
        column: 'घोषणा / वादा',
        originalValue: null,
        message: 'घोषणा / वादा शीर्षक रिक्त नहीं हो सकता।',
        code: 'MISSING_REQUIRED',
      });
      continue;
    }

    // Validation 3: Status Normalization
    const rawStatus = rowData.status || 'प्रारंभ नहीं';
    const statusKey = STATUS_MAPPING[rawStatus.trim()] || STATUS_MAPPING[rawStatus.toLowerCase().trim()];
    if (!statusKey) {
      errors.push({
        worksheet: sheetName,
        rowNumber: r,
        column: 'वर्तमान क्रियान्वयन की स्थिति',
        originalValue: rawStatus,
        message: `अमान्य स्थिति मान: '${rawStatus}'। मान्य स्थितियां: 'पूर्ण', 'प्रगति पर', 'प्रारंभिक चरण', 'प्रारंभ नहीं'।`,
        code: 'INVALID_STATUS',
      });
      continue;
    }

    // Importance Normalization
    const rawImportance = rowData.importance || 'सीमित';
    const importanceKey = IMPORTANCE_MAPPING[rawImportance.trim()] || IMPORTANCE_MAPPING[rawImportance.toLowerCase().trim()] || 'LIMITED';

    // Departments parsing
    const deptStr = rowData.department || 'अनिर्दिष्ट विभाग';
    const deptList = deptStr
      .split(/[,/\n]+/)
      .map(d => d.trim())
      .filter(d => d.length > 0);

    const refLinks = [rowData.referenceLink1, rowData.referenceLink2].filter(Boolean) as string[];

    records.push({
      id: pId,
      title,
      description: rowData.description || '',
      departments: deptList.length > 0 ? deptList : ['सामान्य प्रशासन विभाग'],
      primaryDepartment: deptList[0] || 'सामान्य प्रशासन विभाग',
      category: rowData.category || 'विविध',
      workStarted: (rowData.workStarted || '').trim() === 'हाँ' || statusKey !== 'NOT_STARTED',
      status: statusKey,
      statusRaw: rawStatus,
      politicalImportance: importanceKey,
      politicalImportanceRaw: rawImportance,
      notes: rowData.notes || null,
      groundImpact: rowData.groundImpact || null,
      publicPerception: rowData.publicPerception || null,
      delayReason: rowData.delayReason || null,
      keyAchievements: rowData.keyAchievements || null,
      referenceLinks: refLinks,
      referenceLink1: rowData.referenceLink1 || null,
      referenceLink2: rowData.referenceLink2 || null,
      newsImage: rowData.newsImage || null,
      politicalIssue: rowData.politicalIssue || null,
      officialConfirmationLink: rowData.officialConfirmationLink || null,
      updateNotes: rowData.updateNotes || null,
      sourceSheet: sheetName,
      sourceRow: r,
      updatedAt: new Date().toISOString(),
      unknownFields: Object.keys(unknownData).length > 0 ? unknownData : undefined,
    });
  }

  return { records, errors, sheetName };
}

/**
 * Compare incoming records against active dataset to prepare preview stats
 */
export function generateImportPreview(
  incomingRecords: PromiseRecord[],
  existingRecords: PromiseRecord[],
  errors: ImportValidationError[],
  sheetName: string
): ImportPreviewComparison {
  const existingMap = new Map<number, PromiseRecord>(existingRecords.map(p => [p.id, p]));

  const sampleNew: PromiseRecord[] = [];
  const sampleUpdated: { current: PromiseRecord; incoming: PromiseRecord; changedFields: string[] }[] = [];
  let unchangedCount = 0;

  incomingRecords.forEach((incoming) => {
    const existing = existingMap.get(incoming.id);
    if (!existing) {
      if (sampleNew.length < 5) sampleNew.push(incoming);
    } else {
      const changed: string[] = [];
      if (existing.title !== incoming.title) changed.push('title');
      if (existing.status !== incoming.status) changed.push('status');
      if (existing.category !== incoming.category) changed.push('category');
      if (existing.notes !== incoming.notes) changed.push('notes');
      if (existing.delayReason !== incoming.delayReason) changed.push('delayReason');
      if (existing.description !== incoming.description) changed.push('description');

      if (changed.length > 0) {
        if (sampleUpdated.length < 5) {
          sampleUpdated.push({ current: existing, incoming, changedFields: changed });
        }
      } else {
        unchangedCount++;
      }
    }
  });

  const updatedCount = incomingRecords.filter(inc => {
    const ext = existingMap.get(inc.id);
    if (!ext) return false;
    return ext.title !== inc.title || ext.status !== inc.status || ext.category !== inc.category || ext.notes !== inc.notes;
  }).length;

  const newCount = incomingRecords.filter(inc => !existingMap.has(inc.id)).length;

  return {
    primarySheet: sheetName,
    incomingTotal: incomingRecords.length,
    existingTotal: existingRecords.length,
    newCount,
    updatedCount,
    unchangedCount,
    invalidCount: errors.length,
    errors,
    sampleNew,
    sampleUpdated,
    sampleInvalid: errors.slice(0, 5).map(e => ({
      rowNumber: e.rowNumber,
      raw: { column: e.column, originalValue: e.originalValue },
      errors: [e.message],
    })),
    validatedRecords: incomingRecords,
  };
}

/**
 * Generate CSV error report string
 */
export function generateErrorReportCsv(errors: ImportValidationError[]): string {
  const headers = ['Worksheet', 'Row Number', 'Column', 'Original Value', 'Error Code', 'Error Explanation'];
  const rows = errors.map(e => [
    `"${e.worksheet.replace(/"/g, '""')}"`,
    e.rowNumber,
    `"${e.column.replace(/"/g, '""')}"`,
    `"${String(e.originalValue ?? '').replace(/"/g, '""')}"`,
    `"${e.code}"`,
    `"${e.message.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}
