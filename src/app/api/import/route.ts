import { NextRequest, NextResponse } from 'next/server';
import { 
  inspectWorkbook, 
  parsePromiseRecords, 
  generateImportPreview, 
  generateErrorReportCsv 
} from '@/lib/excel/parser';
import { promiseRepository, importRepository } from '@/lib/repositories';
import { ImportMode } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const action = (formData.get('action') as string) || 'inspect'; // 'inspect' | 'apply'
    const targetSheet = (formData.get('sheetName') as string) || undefined;
    const mode = (formData.get('mode') as ImportMode) || 'REPLACE';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'कार्यपुस्तिका फ़ाइल (.xlsx) संलग्न नहीं है।' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Inspect workbook structure across all sheets
    const inspection = await inspectWorkbook(buffer, file.name);

    // 2. Determine target sheet to parse
    const primarySheet = targetSheet || inspection.primaryWorksheetName || inspection.worksheets[0]?.name;
    if (!primarySheet) {
      return NextResponse.json(
        { success: false, error: 'कार्यपुस्तिका में कोई वैध वर्कशीट नहीं मिली।' },
        { status: 400 }
      );
    }

    // 3. Parse records and collect validation errors
    const { records, errors, sheetName } = await parsePromiseRecords(buffer, primarySheet);

    // 4. Compare with existing dataset
    const existingRecords = await promiseRepository.getAll();
    const preview = generateImportPreview(records, existingRecords, errors, sheetName);

    // If action is only preview/inspect, return analysis immediately
    if (action === 'inspect') {
      const errorCsv = errors.length > 0 ? generateErrorReportCsv(errors) : null;
      return NextResponse.json({
        success: true,
        inspection,
        preview,
        errorCsv,
      });
    }

    // If action is 'apply', execute import
    if (action === 'apply') {
      if (errors.length > 0 && mode === 'REPLACE' && records.length === 0) {
        return NextResponse.json(
          { success: false, error: 'डेटा सत्यापन विफल रहा। कोई भी रिकॉर्ड आयात नहीं किया जा सका।' },
          { status: 400 }
        );
      }

      let appliedCount = 0;
      let insertedCount = 0;
      let updatedCount = 0;
      let unchangedCount = 0;

      if (mode === 'REPLACE') {
        appliedCount = await promiseRepository.replaceDataset(records, `व्यवस्थापक आयात: ${file.name}`);
        insertedCount = appliedCount;
      } else {
        const result = await promiseRepository.bulkUpsert(records, `व्यवस्थापक विलय आयात: ${file.name}`);
        insertedCount = result.inserted;
        updatedCount = result.updated;
        unchangedCount = result.unchanged;
        appliedCount = insertedCount + updatedCount;
      }

      // 5. Store original workbook in Supabase Storage
      try {
        const { createAdminClient } = await import('@/lib/supabase/admin').catch(() => ({ createAdminClient: null }));
        if (createAdminClient) {
          const adminClient = createAdminClient();
          const storageFilename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          await adminClient.storage
            .from('manifesto-workbooks')
            .upload(storageFilename, buffer, {
              contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              upsert: true,
            });
        }
      } catch (storageErr) {
        console.warn('Storage archival notice:', storageErr);
      }

      // Record in import audit history
      await importRepository.recordImport({
        filename: file.name,
        rowCount: records.length,
        status: errors.length === 0 ? 'SUCCESS' : (records.length > 0 ? 'PARTIAL' : 'FAILED'),
        errorCount: errors.length,
        mode,
      });

      return NextResponse.json({
        success: true,
        result: {
          mode,
          appliedCount,
          insertedCount,
          updatedCount,
          unchangedCount,
          errorsCount: errors.length,
          message: mode === 'REPLACE' 
            ? `सफलतापूर्वक ${appliedCount} वादों से डेटासेट प्रतिस्थापित किया गया।` 
            : `विलय पूर्ण: ${insertedCount} नवीन जोड़े गए, ${updatedCount} अद्यतित किए गए, ${unchangedCount} अपरिवर्तित रहे।`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ success: false, error: 'अमान्य कार्रवाई' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Import processing error:', error);
    const msg = error instanceof Error ? error.message : 'आयात प्रक्रिया के दौरान आंतरिक त्रुटि उत्पन्न हुई।';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
