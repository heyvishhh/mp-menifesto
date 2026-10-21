'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { promiseRepository } from '@/lib/repositories';
import { PromiseRecord } from '@/types';
import { calculateDepartmentMetrics } from '@/lib/analytics/metrics';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Building2, Search, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function DepartmentsPage() {
  const [promises, setPromises] = useState<PromiseRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

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

  const departmentMetrics = useMemo(() => {
    return calculateDepartmentMetrics(promises);
  }, [promises]);

  const filteredDepts = useMemo(() => {
    if (!search.trim()) return departmentMetrics;
    const q = search.toLowerCase().trim();
    return departmentMetrics.filter(d => d.department.toLowerCase().includes(q));
  }, [departmentMetrics, search]);

  // If a department is selected, get its associated promises
  const deptPromises = useMemo(() => {
    if (!selectedDept) return [];
    return promises.filter(p => p.departments.includes(selectedDept));
  }, [promises, selectedDept]);

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">विभागीय प्रदर्शन डेटा लोड हो रहा है...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-700" />
            <span>विभाग-वार क्रियान्वयन स्कोरकार्ड (Department Performance)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            सभी संबद्ध विभागों का विस्तृत संकल्प विवरण। 78 वादे बहु-विभागीय समन्वय से संबंधित हैं।
          </p>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="विभाग खोजें..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Main Grid: Department Table & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department List Table */}
        <div className={selectedDept ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-700">
                कुल विभाग: <b>{filteredDepts.length}</b>
              </span>
              <span className="text-[11px] text-slate-500">
                विभाग पर क्लिक करके उससे संबद्ध वादे देखें
              </span>
            </div>

            <div className="overflow-x-auto max-h-[640px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 sticky top-0 z-10 border-b border-slate-200">
                  <tr className="text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">विभाग का नाम</th>
                    <th className="py-2.5 px-3 text-center">कुल वादे</th>
                    <th className="py-2.5 px-3 text-center text-emerald-700">पूर्ण</th>
                    <th className="py-2.5 px-3 text-center text-sky-700">प्रगति पर</th>
                    <th className="py-2.5 px-3 text-center text-amber-700">प्रारंभिक</th>
                    <th className="py-2.5 px-3 text-center text-slate-500">प्रारंभ नहीं</th>
                    <th className="py-2.5 px-3 text-center">पूर्णता दर (%)</th>
                    <th className="py-2.5 px-3 text-center">विवरण</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDepts.map((d) => {
                    const isSelected = selectedDept === d.department;
                    return (
                      <tr
                        key={d.department}
                        onClick={() => setSelectedDept(isSelected ? null : d.department)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-teal-50/80 font-medium' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-slate-900 font-medium">
                          <div className="truncate max-w-[280px]" title={d.department}>
                            {d.department}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                          {d.totalPromises}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-emerald-700">
                          {d.completed}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-sky-700">
                          {d.inProgress}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-amber-700">
                          {d.initialStage}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                          {d.notStarted}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            d.completionRate >= 20 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {d.completionRate}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            className="p-1 rounded hover:bg-slate-200 text-teal-700"
                            title="वादे देखें"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Department Promises Drawer */}
        {selectedDept && (
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    संबद्ध वादे
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {selectedDept}
                  </h3>
                  <p className="text-xs text-slate-500">
                    कुल संबद्ध वादे: {deptPromises.length}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedDept(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  बंद करें ✕
                </button>
              </div>

              <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                {deptPromises.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-700">#{p.id}</span>
                        <Link
                          href={`/promises/${p.id}`}
                          className="font-semibold text-xs text-slate-900 hover:text-teal-700 transition-colors line-clamp-1"
                        >
                          {p.title}
                        </Link>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      {p.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
                      <span>श्रेणी: {p.category}</span>
                      <Link
                        href={`/promises/${p.id}`}
                        className="text-teal-700 hover:underline flex items-center gap-0.5 font-medium"
                      >
                        <span>विवरण</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
