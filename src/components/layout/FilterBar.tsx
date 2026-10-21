'use client';

import React from 'react';
import { useDashboardFilters } from '@/lib/context/FilterContext';
import { PromiseStatus, PoliticalImportance } from '@/types';
import { Search, RotateCcw, Filter, X } from 'lucide-react';
import { STATUS_CONFIG, IMPORTANCE_CONFIG } from '@/lib/analytics/metrics';

interface FilterBarProps {
  departments: string[];
  categories: string[];
  totalResults?: number;
  totalPossible?: number;
}

export function FilterBar({
  departments,
  categories,
  totalResults,
  totalPossible = 414,
}: FilterBarProps) {
  const {
    filters,
    setSearchQuery,
    setDepartment,
    setCategory,
    setStatus,
    setPoliticalImportance,
    resetFilters,
    activeFilterCount,
  } = useDashboardFilters();

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-teal-50 text-teal-700">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              सार्वजनिक फ़िल्टर बार (Shared Multi-Filter Bar)
            </h2>
            <p className="text-[11px] text-slate-500">
              सभी विज़ुअलाइज़ेशन और तालिकाएं एक ही फ़िल्टर स्थिति साझा करते हैं
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          {totalResults !== undefined && (
            <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-medium">
              परिणाम: <b className="text-teal-800">{totalResults}</b> / {totalPossible} वादे
            </span>
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>फ़िल्टर रीसेट ({activeFilterCount})</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* 1. Search Query */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="खोजें (ID, नाम, विवरण, विभाग)..."
            className="w-full pl-9 pr-7 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Department Dropdown */}
        <div>
          <select
            value={filters.department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full py-2 px-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all truncate"
          >
            <option value="ALL">सभी विभाग (All Departments)</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Category Dropdown */}
        <div>
          <select
            value={filters.category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full py-2 px-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all truncate"
          >
            <option value="ALL">सभी क्षेत्र/श्रेणी (All Categories)</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Status Dropdown */}
        <div>
          <select
            value={filters.status}
            onChange={(e) => setStatus(e.target.value as PromiseStatus | 'ALL')}
            className="w-full py-2 px-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
          >
            <option value="ALL">सभी स्थितियां (All Statuses)</option>
            <option value="COMPLETED">{STATUS_CONFIG.COMPLETED.labelHi} ({STATUS_CONFIG.COMPLETED.labelEn})</option>
            <option value="IN_PROGRESS">{STATUS_CONFIG.IN_PROGRESS.labelHi} ({STATUS_CONFIG.IN_PROGRESS.labelEn})</option>
            <option value="INITIAL_STAGE">{STATUS_CONFIG.INITIAL_STAGE.labelHi} ({STATUS_CONFIG.INITIAL_STAGE.labelEn})</option>
            <option value="NOT_STARTED">{STATUS_CONFIG.NOT_STARTED.labelHi} ({STATUS_CONFIG.NOT_STARTED.labelEn})</option>
          </select>
        </div>

        {/* 5. Political Importance Dropdown */}
        <div>
          <select
            value={filters.politicalImportance}
            onChange={(e) => setPoliticalImportance(e.target.value as PoliticalImportance | 'ALL')}
            className="w-full py-2 px-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
          >
            <option value="ALL">सभी प्राथमिकताएं (All Priorities)</option>
            <option value="HIGH">{IMPORTANCE_CONFIG.HIGH.labelHi} ({IMPORTANCE_CONFIG.HIGH.labelEn})</option>
            <option value="MEDIUM">{IMPORTANCE_CONFIG.MEDIUM.labelHi} ({IMPORTANCE_CONFIG.MEDIUM.labelEn})</option>
            <option value="LIMITED">{IMPORTANCE_CONFIG.LIMITED.labelHi} ({IMPORTANCE_CONFIG.LIMITED.labelEn})</option>
          </select>
        </div>
      </div>
    </div>
  );
}
