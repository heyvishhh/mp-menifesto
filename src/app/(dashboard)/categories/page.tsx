'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { promiseRepository } from '@/lib/repositories';
import { PromiseRecord } from '@/types';
import { calculateCategoryMetrics } from '@/lib/analytics/metrics';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Layers, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesPage() {
  const [promises, setPromises] = useState<PromiseRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  // Dynamically calculate category metrics from current records
  const categoryMetrics = useMemo(() => {
    return calculateCategoryMetrics(promises);
  }, [promises]);

  // Associated promises for selected category
  const categoryPromises = useMemo(() => {
    if (!selectedCategory) return [];
    return promises.filter(p => p.category === selectedCategory);
  }, [promises, selectedCategory]);

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">श्रेणी विश्लेषण डेटा लोड हो रहा है...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-700" />
          <span>क्षेत्रीय / श्रेणी-वार प्रदर्शन मूल्यांकन (Category & Sector Scorecard)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          डेटा से गतिशील रूप से व्युत्पन्न कुल {categoryMetrics.length} प्राथमिक क्षेत्र। किसी भी क्षेत्र पर क्लिक करके उससे जुड़े वादों की सूची देखें।
        </p>
      </div>

      {/* Category Performance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryMetrics.map((cat) => {
          const isSelected = selectedCategory === cat.category;
          return (
            <div
              key={cat.category}
              onClick={() => setSelectedCategory(isSelected ? null : cat.category)}
              className={`bg-white rounded-xl border p-4.5 cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-teal-600 border-teal-500 shadow-md bg-teal-50/20'
                  : 'border-slate-200/80 hover:border-teal-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {cat.category}
                </h3>
                <span className="text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md flex-shrink-0">
                  {cat.totalPromises} वादे
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>पूर्णता दर</span>
                  <span className="font-bold text-emerald-700">{cat.completionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${cat.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Status Breakdown Pills */}
              <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] pt-2 border-t border-slate-100">
                <div className="bg-emerald-50/70 p-1 rounded border border-emerald-100">
                  <div className="font-bold text-emerald-800">{cat.completed}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">पूर्ण</div>
                </div>
                <div className="bg-sky-50/70 p-1 rounded border border-sky-100">
                  <div className="font-bold text-sky-800">{cat.inProgress}</div>
                  <div className="text-[10px] text-sky-600 font-medium">प्रगति पर</div>
                </div>
                <div className="bg-amber-50/70 p-1 rounded border border-amber-100">
                  <div className="font-bold text-amber-800">{cat.initialStage}</div>
                  <div className="text-[10px] text-amber-600 font-medium">प्रारंभिक</div>
                </div>
                <div className="bg-slate-100/70 p-1 rounded border border-slate-200">
                  <div className="font-bold text-slate-700">{cat.notStarted}</div>
                  <div className="text-[10px] text-slate-500 font-medium">शेष</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Category Promises List */}
      {selectedCategory && (
        <div className="bg-white rounded-xl border border-teal-200 shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                चयनित क्षेत्र
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {selectedCategory}
              </h3>
              <p className="text-xs text-slate-500">
                इस श्रेणी में कुल {categoryPromises.length} संकल्प पत्र वादे दर्ज हैं
              </p>
            </div>

            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-2 py-1 rounded hover:bg-slate-100"
            >
              बंद करें ✕
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {categoryPromises.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 text-xs">#{p.id}</span>
                      <Link
                        href={`/promises/${p.id}`}
                        className="font-semibold text-sm text-slate-900 hover:text-teal-700 transition-colors"
                      >
                        {p.title}
                      </Link>
                    </div>
                    <p className="text-xs text-slate-600">
                      {p.description}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">संबद्ध विभाग:</span>
                    <span>{p.departments.join(', ')}</span>
                  </div>
                  <Link
                    href={`/promises/${p.id}`}
                    className="text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1"
                  >
                    <span>पूर्ण विवरण देखें</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
