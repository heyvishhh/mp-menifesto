'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { promiseRepository, auditRepository } from '@/lib/repositories';
import { PromiseRecord, AuditLog } from '@/types';
import { StatusBadge, ImportanceBadge } from '@/components/dashboard/StatusBadge';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  ExternalLink, 
  FileText, 
  History, 
  Link as LinkIcon, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

function PromiseDetailContent() {
  const params = useParams();
  const promiseId = Number(params?.id);

  const [promise, setPromise] = useState<PromiseRecord | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    async function loadDetail() {
      if (!promiseId || isNaN(promiseId)) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const record = await promiseRepository.getById(promiseId);
        if (!record) {
          setNotFound(true);
        } else {
          setPromise(record);
          const logs = await auditRepository.getLogsByPromiseId(promiseId);
          setAuditLogs(logs);
        }
      } catch (err) {
        console.error('Failed to load promise details', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [promiseId]);

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">संकल्प विवरण लोड हो रहा है...</p>
      </div>
    );
  }

  if (notFound || !promise) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center max-w-lg mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">संकल्प वादा नहीं मिला</h2>
        <p className="text-xs text-slate-500">
          क्रमांक #{promiseId} से संबंधित कोई रिकॉर्ड उपलब्ध नहीं है। कृपया सूची में पुनः खोजें।
        </p>
        <Link
          href="/promises"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>समस्त वादों की सूची पर वापस जाएं</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/promises"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>समस्त वादों की सूची पर वापस जाएं</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>अंतिम अद्यतन: <b>{new Date(promise.updatedAt).toLocaleDateString('hi-IN')}</b></span>
        </div>
      </div>

      {/* Main Promise Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-md">
              संकल्प #{promise.id}
            </span>
            <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
              {promise.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={promise.status} showEnglish />
            <ImportanceBadge importance={promise.politicalImportance} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 leading-tight">
            {promise.title}
          </h1>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-lg border border-slate-100">
            {promise.description}
          </p>
        </div>

        {/* Associated Departments Grid */}
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-teal-700" />
            <span>संबद्ध मंत्रालय / विभाग ({promise.departments.length})</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {promise.departments.map((dept, idx) => (
              <span
                key={idx}
                className="text-xs bg-teal-50 text-teal-900 border border-teal-200 px-3 py-1 rounded-lg font-medium"
              >
                {dept}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column Detail Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Implementation Status & Notes */}
        <div className="lg:col-span-8 space-y-5">
          {/* Notes & Cabinet Sanctions */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-700" />
              <span>क्रियान्वयन स्थिति एवं आधिकारिक टिप्पणियाँ (Implementation Notes)</span>
            </h3>

            {promise.notes ? (
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                {promise.notes}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                कोई अतिरिक्त प्रशासनिक टिप्पणी दर्ज नहीं है।
              </p>
            )}

            {promise.updateNotes && (
              <div className="mt-3 p-3 rounded-lg bg-teal-50/60 border border-teal-200 text-xs text-teal-950">
                <span className="font-semibold block mb-0.5">अद्यतन स्थिति (Update Notes):</span>
                {promise.updateNotes}
              </div>
            )}
          </div>

          {/* Pending Delay Reason (if any) */}
          {promise.delayReason && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>लंबित होने का प्रमुख कारण (Reason for Delay / Pending Bottleneck)</span>
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                {promise.delayReason}
              </p>
            </div>
          )}

          {/* Key Achievements */}
          {promise.keyAchievements && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>प्रमुख उपलब्धियाँ (Key Achievements)</span>
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {promise.keyAchievements}
              </p>
            </div>
          )}

          {/* Audit History (Extensible for Stage 2 & 3) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-700" />
                <span>ऑडिट लॉग एवं संशोधन इतिहास (Audit History)</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {auditLogs.length} संशोधन दर्ज
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                मूल डेटासेट अंतर्ग्रहण के पश्चात कोई मैनुअल संशोधन नहीं किया गया है।
              </p>
            ) : (
              <div className="space-y-2.5">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                      <span className="font-semibold text-slate-700">{log.modifiedBy}</span>
                      <span>{new Date(log.modifiedAt).toLocaleString('hi-IN')}</span>
                    </div>
                    <div className="text-slate-800">
                      फ़ील्ड <b>{log.fieldName}</b>: <span className="line-through text-slate-400">{log.oldValue || 'रिक्त'}</span> → <b className="text-teal-800">{log.newValue}</b>
                    </div>
                    {log.reason && (
                      <div className="text-[11px] text-slate-500 mt-1 italic">
                        कारण: {log.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: References, Links & Workbook Origin */}
        <div className="lg:col-span-4 space-y-5">
          {/* Reference Links Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-teal-700" />
              <span>संदर्भ एवं पुष्टि लिंक</span>
            </h3>

            <div className="space-y-2">
              {promise.referenceLinks.length > 0 ? (
                promise.referenceLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-100 text-xs text-teal-800 font-medium transition-colors"
                  >
                    <span className="truncate max-w-[200px]">संदर्भ लिंक #{idx + 1}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">
                  कोई बाहरी संदर्भ लिंक संलग्न नहीं है।
                </p>
              )}

              {promise.officialConfirmationLink && (
                <a
                  href={promise.officialConfirmationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs text-emerald-900 font-semibold transition-colors mt-2"
                >
                  <span>अधिकारिक पुष्टि लिंक</span>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                </a>
              )}
            </div>
          </div>

          {/* Dataset Provenance */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-2.5 text-xs">
            <h3 className="text-sm font-bold text-slate-900">
              डेटा स्रोत उत्पत्ति (Provenance)
            </h3>
            <div className="divide-y divide-slate-100">
              <div className="py-1.5 flex justify-between text-slate-600">
                <span>स्रोत कार्यपुस्तिका:</span>
                <span className="font-semibold text-slate-800">MP Manifesto Analysis.xlsx</span>
              </div>
              <div className="py-1.5 flex justify-between text-slate-600">
                <span>वर्कशीट:</span>
                <span className="font-semibold text-slate-800">{promise.sourceSheet}</span>
              </div>
              <div className="py-1.5 flex justify-between text-slate-600">
                <span>एक्सेल पंक्ति सं.:</span>
                <span className="font-semibold text-slate-800">पंक्ति #{promise.sourceRow}</span>
              </div>
              <div className="py-1.5 flex justify-between text-slate-600">
                <span>कार्य प्रारंभ:</span>
                <span className={`font-semibold ${promise.workStarted ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {promise.workStarted ? 'हाँ' : 'नहीं'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PromiseDetailPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">संकल्प विवरण लोड हो रहा है...</p>
      </div>
    }>
      <PromiseDetailContent />
    </Suspense>
  );
}
