'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { promiseRepository } from '@/lib/repositories';
import { PromiseRecord } from '@/types';
import { useDashboardFilters } from '@/lib/context/FilterContext';
import { 
  filterPromises, 
  calculateDashboardMetrics, 
  calculateDepartmentMetrics, 
  calculateCategoryMetrics 
} from '@/lib/analytics/metrics';
import { FilterBar } from '@/components/layout/FilterBar';
import { StatusDistributionChart } from '@/components/charts/StatusDistributionChart';
import { CategoryBreakdownChart } from '@/components/charts/CategoryBreakdownChart';
import { DepartmentBarChart } from '@/components/charts/DepartmentBarChart';
import { TopPendingDepartmentsChart } from '@/components/charts/TopPendingDepartmentsChart';
import { DepartmentCompletionRateChart } from '@/components/charts/DepartmentCompletionRateChart';
import { BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AnalysisPage() {
  const [allPromises, setAllPromises] = useState<PromiseRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const {
    filters,
    setStatus,
    setDepartment,
    setCategory,
  } = useDashboardFilters();

  useEffect(() => {
    async function loadData() {
      try {
        const records = await promiseRepository.getAll();
        setAllPromises(records);
      } catch (err) {
        console.error('Failed to load promises', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredPromises = useMemo(() => {
    return filterPromises(allPromises, filters);
  }, [allPromises, filters]);

  const metrics = useMemo(() => {
    return calculateDashboardMetrics(filteredPromises);
  }, [filteredPromises]);

  const departmentMetrics = useMemo(() => {
    return calculateDepartmentMetrics(filteredPromises);
  }, [filteredPromises]);

  const categoryMetrics = useMemo(() => {
    return calculateCategoryMetrics(filteredPromises);
  }, [filteredPromises]);

  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    allPromises.forEach(p => p.departments.forEach(d => set.add(d)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'hi'));
  }, [allPromises]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    allPromises.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'hi'));
  }, [allPromises]);

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">विश्लेषण लोड हो रहा है...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-700" />
            <span>गहन सांख्यिकीय विश्लेषण एवं ड्रिल-डाउन</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            चार्ट बार या सेगमेंट पर क्लिक करके संबंधित वादों को फ़िल्टर करें और विवरण देखें
          </p>
        </div>

        <Link
          href="/promises"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
        >
          <span>फ़िल्टर किए वादे तालिका में देखें ({filteredPromises.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Shared Filter Bar */}
      <FilterBar
        departments={availableDepartments}
        categories={availableCategories}
        totalResults={filteredPromises.length}
        totalPossible={allPromises.length}
      />

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <StatusDistributionChart
            metrics={metrics}
            onSelectStatus={(s) => setStatus(s)}
          />
        </div>

        <div className="lg:col-span-6">
          <DepartmentCompletionRateChart
            data={departmentMetrics}
            limit={10}
            onSelectDepartment={(d) => setDepartment(d)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-12">
          <CategoryBreakdownChart
            data={categoryMetrics}
            onSelectCategory={(c) => setCategory(c)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <DepartmentBarChart
            data={departmentMetrics}
            limit={12}
            onSelectDepartment={(d) => setDepartment(d)}
          />
        </div>

        <div className="lg:col-span-5">
          <TopPendingDepartmentsChart
            data={departmentMetrics}
            limit={10}
            onSelectDepartment={(d) => setDepartment(d)}
          />
        </div>
      </div>
    </div>
  );
}
