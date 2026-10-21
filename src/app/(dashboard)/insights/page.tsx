'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { promiseRepository } from '@/lib/repositories';
import { PromiseRecord, DashboardFilters } from '@/types';
import { generateKeyInsights } from '@/lib/analytics/insights';
import { useDashboardFilters } from '@/lib/context/FilterContext';
import { useRouter } from 'next/navigation';
import { Lightbulb, ArrowRight } from 'lucide-react';

export default function KeyInsightsPage() {
  const router = useRouter();
  const [promises, setPromises] = useState<PromiseRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  const { setFilterBatch } = useDashboardFilters();

  useEffect(() => {
    async function loadData() {
      try {
        const records = await promiseRepository.getAll();
        setPromises(records);
      } catch (err) {
        console.error('Failed to load promises', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const insights = useMemo(() => {
    return generateKeyInsights(promises);
  }, [promises]);

  const filteredInsights = useMemo(() => {
    if (filterType === 'ALL') return insights;
    return insights.filter(i => i.type === filterType);
  }, [insights, filterType]);

  const handleApplyFilter = (actionFilter?: Partial<DashboardFilters>) => {
    if (!actionFilter) return;
    setFilterBatch(actionFilter);
    router.push('/promises');
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">तथ्यात्मक निष्कर्ष तैयार हो रहे हैं...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span>डेटा-आधारित प्रमुख निष्कर्ष एवं नीति समीक्षा</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              414 संकल्प पत्र वादों के डेटा से स्वचालित एवं सत्यापन योग्य निष्कर्षण। तथ्यों, व्युत्पन्न मीट्रिक्स और व्याख्या का स्पष्ट पृथक्करण।
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start md:self-auto text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              सभी ({insights.length})
            </button>
            <button
              onClick={() => setFilterType('FACT')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'FACT' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              तथ्य (Facts)
            </button>
            <button
              onClick={() => setFilterType('METRIC')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'METRIC' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              मीट्रिक (Metrics)
            </button>
            <button
              onClick={() => setFilterType('INTERPRETATION')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'INTERPRETATION' ? 'bg-white text-purple-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              व्याख्या (Interpretation)
            </button>
          </div>
        </div>
      </div>

      {/* Insights Cards List */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => (
          <div
            key={insight.id}
            className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${insight.badgeColor}`}>
                    {insight.badge}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    क्षेत्र: {insight.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {insight.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  {insight.description}
                </p>
              </div>

              {insight.actionFilter && (
                <button
                  onClick={() => handleApplyFilter(insight.actionFilter)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors flex-shrink-0 self-start"
                >
                  <span>तालिका में फ़िल्टर देखें</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Stat Pills */}
            {insight.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100">
                {insight.stats.map((stat, idx) => (
                  <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">
                      {stat.label}
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
