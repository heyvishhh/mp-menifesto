'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { importRepository, promiseRepository } from '@/lib/repositories';
import { 
  WorkbookImport, 
  WorkbookInspectionResult, 
  ImportPreviewComparison, 
  ImportMode, 
  ImportExecutionResult 
} from '@/types';
import { 
  ShieldCheck, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  History, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle, 
  FileText, 
  Layers, 
  Check, 
  AlertCircle
} from 'lucide-react';

export default function AdminDataManagementPage() {
  const [importHistory, setImportHistory] = useState<WorkbookImport[]>([]);
  const [datasetInfo, setDatasetInfo] = useState({
    totalPromises: 0,
    departmentsCount: 0,
    categoriesCount: 0,
  });

  // Import Workflow State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [inspectionResult, setInspectionResult] = useState<WorkbookInspectionResult | null>(null);
  const [previewResult, setPreviewResult] = useState<ImportPreviewComparison | null>(null);
  const [errorCsv, setErrorCsv] = useState<string | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('All Promises');
  const [importMode, setImportMode] = useState<ImportMode>('REPLACE');
  const [replaceConfirmed, setReplaceConfirmed] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ImportExecutionResult | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const loadDatasetStats = useCallback(async () => {
    const history = await importRepository.getImportHistory();
    setImportHistory(history);

    const promises = await promiseRepository.getAll();
    const depts = new Set<string>();
    const cats = new Set<string>();
    promises.forEach(p => {
      p.departments.forEach(d => depts.add(d));
      if (p.category) cats.add(p.category);
    });

    setDatasetInfo({
      totalPromises: promises.length,
      departmentsCount: depts.size,
      categoriesCount: cats.size,
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) loadDatasetStats();
    });

    const unsubscribe = promiseRepository.subscribe(() => {
      if (mounted) loadDatasetStats();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadDatasetStats]);

  // Handle file selection and parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setGeneralError('केवल .xlsx अथवा .xls प्रारूप की एक्सेल कार्यपुस्तिका समर्थित है।');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setGeneralError('फ़ाइल का आकार अधिकतम 15 MB तक ही अनुमत है।');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setGeneralError(null);
    setExecutionResult(null);
    setInspectionResult(null);
    setPreviewResult(null);
    setErrorCsv(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'inspect');

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'कार्यपुस्तिका विश्लेषण विफल रहा');
      }

      setInspectionResult(data.inspection);
      setPreviewResult(data.preview);
      setErrorCsv(data.errorCsv);
      if (data.inspection?.primaryWorksheetName) {
        setSelectedSheet(data.inspection.primaryWorksheetName);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'एक्सेल पार्सिंग में अप्रत्याशित त्रुटि';
      setGeneralError(msg);
    } finally {
      setIsParsing(false);
    }
  };

  // Re-inspect if user switches sheet
  const handleSheetSwitch = async (sheetName: string) => {
    if (!selectedFile) return;
    setSelectedSheet(sheetName);
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('action', 'inspect');
      formData.append('sheetName', sheetName);

      const res = await fetch('/api/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setPreviewResult(data.preview);
        setErrorCsv(data.errorCsv);
      }
    } catch (err: unknown) {
      console.error('Sheet switch inspection error', err);
    } finally {
      setIsParsing(false);
    }
  };

  // Execute Import (Apply Mode A or Mode B)
  const handleApplyImport = async () => {
    if (!selectedFile) return;

    if (importMode === 'REPLACE' && !replaceConfirmed) {
      setGeneralError('कृपया डेटासेट प्रतिस्थापन की पुष्टि के लिए चेकबॉक्स का चयन करें।');
      return;
    }

    setIsApplying(true);
    setGeneralError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('action', 'apply');
      formData.append('sheetName', selectedSheet);
      formData.append('mode', importMode);

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'आयात निष्पादन असफल रहा');
      }

      setExecutionResult(data.result);
      await loadDatasetStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'आयात लागू करने में विफलता';
      setGeneralError(msg);
    } finally {
      setIsApplying(false);
    }
  };

  // Download CSV Error Report
  const handleDownloadErrors = () => {
    if (!errorCsv) return;
    const blob = new Blob([errorCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `import_validation_errors_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
            <span>प्रशासन, एक्सेल अंतर्ग्रहण एवं डेटा प्रबंधन (Excel Ingestion & Data Layer)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            कार्यपुस्तिका विश्लेषण, बहु-शीट वर्गीकरण, पूर्वावलोकन, प्रतिस्थापन / विलय (Replace vs Merge) एवं सत्यापन
          </p>
        </div>

        <button
          onClick={() => window.open('/api/export', '_blank')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors"
        >
          <Download className="w-4 h-4 text-teal-700" />
          <span>संपूर्ण डेटासेट एक्सेल निर्यात (.xlsx)</span>
        </button>
      </div>

      {/* Dataset Health & Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            सक्रिय वादे (Active Dataset)
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {datasetInfo.totalPromises} वादे
          </div>
          <div className="text-xs text-slate-500 mt-1">
            स्रोत: <code>MP Manifesto Analysis.xlsx</code> (डेवलपमेंट रिपॉजिटरी)
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            संबद्ध विभाग व निकाय
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {datasetInfo.departmentsCount} विभाग
          </div>
          <div className="text-xs text-slate-500 mt-1">
            45 वैधानिक संदर्भ विभाग + संयुक्त अंतर-विभागीय दायित्व
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            प्राथमिक विकास क्षेत्र
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {datasetInfo.categoriesCount} श्रेणियां
          </div>
          <div className="text-xs text-slate-500 mt-1">
            समृद्ध किसान, सशक्त नारी, उत्तम शिक्षा इत्यादि
          </div>
        </div>
      </div>

      {/* Main Upload Box */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">
              नवीन एक्सेल कार्यपुस्तिका अपलोड करें (Upload Workbook)
            </h3>
          </div>
          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            चरण 2 लाइव पार्सर एवं प्रीव्यू
          </span>
        </div>

        {/* Drag and Drop File Input */}
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-teal-400 hover:bg-teal-50/20 transition-all cursor-pointer relative">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <FileSpreadsheet className="w-10 h-10 text-teal-600" />
            <p className="text-xs font-bold text-slate-800">
              {selectedFile ? `चयनित फ़ाइल: ${selectedFile.name}` : 'कार्यपुस्तिका फ़ाइल (.xlsx, .xls) यहाँ खींचें अथवा ब्राउज़ करें'}
            </p>
            <p className="text-[11px] text-slate-400">
              {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'अधिकतम फ़ाइल आकार: 15 MB | एकाधिक वर्कशीट पार्सिंग समर्थित'}
            </p>
          </div>
        </div>

        {isParsing && (
          <div className="flex items-center gap-2 text-xs text-teal-700 bg-teal-50 p-3 rounded-lg border border-teal-200">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>कार्यपुस्तिका का विश्लेषण, वर्कशीट वर्गीकरण एवं रिकॉर्ड सत्यापन जारी है...</span>
          </div>
        )}

        {generalError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{generalError}</span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* Step 4-6: Detected Worksheets & Classification Inspection */}
      {/* ======================================================== */}
      {inspectionResult && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-700" />
                <span>कार्यपुस्तिका संरचना एवं वर्कशीट वर्गीकरण (Detected Worksheets)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                कुल {inspectionResult.totalWorksheets} वर्कशीट्स पाई गईं। केवल प्राथमिक संकल्प पत्र शीट का ही आयात किया जाना चाहिए।
              </p>
            </div>
            <span className="text-xs text-slate-600 font-mono">
              {inspectionResult.filename} ({Math.round(inspectionResult.fileSizeBytes / 1024)} KB)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {inspectionResult.worksheets.map((sheet) => {
              const isSelected = selectedSheet === sheet.name;
              let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
              let badgeLabel = 'अनियमित / अप्रयुक्त';

              if (sheet.classification === 'PRIMARY_PROMISES') {
                badgeColor = 'bg-teal-50 text-teal-800 border-teal-300 font-bold';
                badgeLabel = 'प्राथमिक संकल्प रिकॉर्ड्स';
              } else if (sheet.classification === 'DEPARTMENT_REFERENCE') {
                badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
                badgeLabel = 'विभागीय संदर्भ मास्टर';
              } else if (sheet.classification === 'COHORT_SUBSET') {
                badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                badgeLabel = 'कोहॉर्ट उप-शीट (छोड़ें)';
              } else if (sheet.classification === 'INTERNAL_WORKFLOW') {
                badgeColor = 'bg-purple-50 text-purple-800 border-purple-200';
                badgeLabel = 'आंतरिक कार्य आबंटन';
              }

              return (
                <div
                  key={sheet.name}
                  onClick={() => handleSheetSwitch(sheet.name)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20 shadow-xs' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate" title={sheet.name}>
                      {sheet.name}
                    </span>
                    {sheet.isPrimaryCandidate && (
                      <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.5 rounded font-bold">
                        अनुशंसित
                      </span>
                    )}
                  </div>
                  <div className={`text-[10px] px-2 py-0.5 rounded border inline-block mb-2 ${badgeColor}`}>
                    {badgeLabel}
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <div>डेटा पंक्तियाँ: <b>{sheet.rowCount}</b> | कॉलम: <b>{sheet.columnCount}</b></div>
                    {sheet.duplicateHeaders.length > 0 && (
                      <div className="text-amber-700 text-[10px]">
                        डुप्लीकेट शीर्षक: {sheet.duplicateHeaders.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Step 7-9: Comparison & Validation Breakdown */}
      {/* ======================================================== */}
      {previewResult && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span>आयात पूर्वावलोकन एवं सत्यापन विश्लेषण (Import Preview)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                चयनित वर्कशीट: <b>{previewResult.primarySheet}</b> (आने वाले रिकॉर्ड्स: {previewResult.incomingTotal})
              </p>
            </div>

            {errorCsv && (
              <button
                onClick={handleDownloadErrors}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>त्रुटि रिपोर्ट डाउनलोड करें (CSV)</span>
              </button>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
              <div className="text-xs font-bold text-emerald-800">नवीन रिकॉर्ड्स (New)</div>
              <div className="text-xl font-bold text-emerald-900 mt-1">{previewResult.newCount}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">डेटाबेस में नए जोड़े जाएंगे</div>
            </div>

            <div className="bg-sky-50/80 p-3 rounded-xl border border-sky-200">
              <div className="text-xs font-bold text-sky-800">अद्यतन रिकॉर्ड्स (Updated)</div>
              <div className="text-xl font-bold text-sky-900 mt-1">{previewResult.updatedCount}</div>
              <div className="text-[10px] text-sky-600 mt-0.5">मौजूदा आईडी में बदलाव पाया गया</div>
            </div>

            <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-700">अपरिवर्तित (Unchanged)</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{previewResult.unchangedCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">पहले से यथावत मौजूद</div>
            </div>

            <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200">
              <div className="text-xs font-bold text-rose-800">अमान्य रिकॉर्ड्स (Invalid)</div>
              <div className="text-xl font-bold text-rose-900 mt-1">{previewResult.invalidCount}</div>
              <div className="text-[10px] text-rose-600 mt-0.5">सत्यापन त्रुटियों के कारण बहिष्कृत</div>
            </div>
          </div>

          {/* Validation Errors Table (if any) */}
          {previewResult.errors.length > 0 && (
            <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>सत्यापन त्रुटियाँ ({previewResult.errors.length}):</span>
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-rose-100 text-xs">
                {previewResult.errors.map((err, i) => (
                  <div key={i} className="py-1.5 flex items-start justify-between text-rose-800">
                    <span>पंक्ति <b>#{err.rowNumber}</b> [कॉलम: {err.column}]: {err.message}</span>
                    <span className="font-mono text-[10px] text-rose-600 uppercase bg-rose-100 px-1.5 py-0.5 rounded">
                      {err.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* Step 10-12: Import Mode Selector & Confirmation */}
          {/* ======================================================== */}
          <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              आयात मोड चयन (Select Import Mode)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Mode A: Replace */}
              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  importMode === 'REPLACE' 
                    ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs' 
                    : 'border-slate-200 bg-white/60 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="REPLACE"
                  checked={importMode === 'REPLACE'}
                  onChange={() => setImportMode('REPLACE')}
                  className="mt-1 text-teal-600 focus:ring-teal-500"
                />
                <div className="space-y-1">
                  <div className="font-bold text-xs text-slate-900">
                    मोड A: डेटासेट प्रतिस्थापन (REPLACE DATASET)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    सक्रिय डेटाबेस को चयनित वर्कशीट के {previewResult.validatedRecords.length} वैध रिकॉर्ड्स से पूर्णतः प्रतिस्थापित करता है।
                  </p>
                </div>
              </label>

              {/* Mode B: Merge */}
              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  importMode === 'MERGE' 
                    ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs' 
                    : 'border-slate-200 bg-white/60 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="MERGE"
                  checked={importMode === 'MERGE'}
                  onChange={() => setImportMode('MERGE')}
                  className="mt-1 text-teal-600 focus:ring-teal-500"
                />
                <div className="space-y-1">
                  <div className="font-bold text-xs text-slate-900">
                    मोड B: डेटासेट विलय (MERGE DATASET)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    क्रमांक (ID) के आधार पर मिलान करता है: नवीन रिकॉर्ड्स जोड़ता है ({previewResult.newCount}), मौजूदा रिकॉर्ड्स अद्यतित करता है ({previewResult.updatedCount}), और अन्य को सुरक्षित रखता है।
                  </p>
                </div>
              </label>
            </div>

            {/* Confirmation Checkbox for Replace Mode */}
            {importMode === 'REPLACE' && (
              <label className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceConfirmed}
                  onChange={(e) => setReplaceConfirmed(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-semibold">
                  मैं पुष्टि करता/करती हूँ कि वर्तमान डेटासेट को इस कार्यपुस्तिका से प्रतिस्थापित किया जाए।
                </span>
              </label>
            )}

            {/* Apply Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleApplyImport}
                disabled={isApplying || (importMode === 'REPLACE' && !replaceConfirmed)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>डेटासेट अद्यतित हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>आयात की पुष्टि करें एवं लागू करें ({importMode})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execution Final Report */}
      {executionResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <h3 className="text-sm font-bold">
              आयात सफलतापूर्वक संपन्न (Import Successfully Applied)
            </h3>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            {executionResult.message}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div className="bg-white/80 p-2 rounded border border-emerald-200">
              मोड: <b>{executionResult.mode}</b>
            </div>
            <div className="bg-white/80 p-2 rounded border border-emerald-200">
              नवीन जोड़े: <b>{executionResult.insertedCount}</b>
            </div>
            <div className="bg-white/80 p-2 rounded border border-emerald-200">
              अद्यतित: <b>{executionResult.updatedCount}</b>
            </div>
            <div className="bg-white/80 p-2 rounded border border-emerald-200">
              त्रुटियाँ: <b>{executionResult.errorsCount}</b>
            </div>
          </div>
        </div>
      )}

      {/* Import History Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-teal-700" />
          <span>कार्यपुस्तिका आयात इतिहास (Import History Audit)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="py-2.5 px-3">आयात आईडी</th>
                <th className="py-2.5 px-3">फ़ाइल का नाम</th>
                <th className="py-2.5 px-3">आयात तिथि व समय</th>
                <th className="py-2.5 px-3 text-center">मोड</th>
                <th className="py-2.5 px-3 text-center">रिकॉर्ड संख्या</th>
                <th className="py-2.5 px-3 text-center">स्थिति</th>
                <th className="py-2.5 px-3 text-center">त्रुटियाँ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {importHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {item.id}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {item.filename}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {new Date(item.importedAt).toLocaleString('hi-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.mode || 'REPLACE'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                    {item.rowCount}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-400">
                    {item.errorCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
