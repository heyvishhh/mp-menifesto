'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { promiseRepository } from '@/lib/repositories';
import { PromiseRecord } from '@/types';
import { useDashboardFilters } from '@/lib/context/FilterContext';
import { 
  filterPromises, 
  calculateDashboardMetrics, 
  calculateDepartmentMetrics, 
  calculateCategoryMetrics 
} from '@/lib/analytics/metrics';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { FilterBar } from '@/components/layout/FilterBar';
import { StatusDistributionChart } from '@/components/charts/StatusDistributionChart';
import { CategoryBreakdownChart } from '@/components/charts/CategoryBreakdownChart';
import { DepartmentBarChart } from '@/components/charts/DepartmentBarChart';
import { TopPendingDepartmentsChart } from '@/components/charts/TopPendingDepartmentsChart';
import { DepartmentCompletionRateChart } from '@/components/charts/DepartmentCompletionRateChart';
import { 
  CheckCircle2, 
  Clock, 
  ListOrdered, 
  Percent, 
  PlayCircle, 
  AlertCircle,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/dashboard/StatusBadge';

export default function OverviewDashboardPage() {
  const [allPromises, setAllPromises] = useState<PromiseRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const {
    filters,
    setStatus,
    setDepartment,
    setCategory,
  } = useDashboardFilters();

  const loadData = useCallback(async () => {
    try {
      const records = await promiseRepository.getAll();
      setAllPromises(records);
    } catch (err) {
      console.error('Failed to load promises', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) loadData();
    });

    const unsubscribe = promiseRepository.subscribe(() => {
      if (mounted) loadData();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadData]);

  // Filter promises using shared filter state
  const filteredPromises = useMemo(() => {
    return filterPromises(allPromises, filters);
  }, [allPromises, filters]);

  // Dynamic calculations across all promises and filtered subset
  const metrics = useMemo(() => {
    return calculateDashboardMetrics(filteredPromises);
  }, [filteredPromises]);

  const departmentMetrics = useMemo(() => {
    return calculateDepartmentMetrics(filteredPromises);
  }, [filteredPromises]);

  const categoryMetrics = useMemo(() => {
    return calculateCategoryMetrics(filteredPromises);
  }, [filteredPromises]);

  // Master lists for filter dropdowns
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

  // Recent operational updates from remarks (where Col I or Col S has notes)
  const recentUpdates = useMemo(() => {
    return allPromises
      .filter(p => p.updateNotes || p.notes)
      .slice(0, 5);
  }, [allPromises]);

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">डैशबोर्ड विश्लेषण तैयार हो रहा है...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shared Filter Bar */}
      <FilterBar
        departments={availableDepartments}
        categories={availableCategories}
        totalResults={filteredPromises.length}
        totalPossible={allPromises.length}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KpiCard
          title="कुल घोषणाएँ"
          titleEn="Total Promises"
          value={metrics.totalPromises}
          subtitle={`समीक्षाधीन कुल ${allPromises.length} में से`}
          icon={ListOrdered}
          iconBg="bg-slate-100"
          iconColor="text-slate-700"
        />

        <KpiCard
          title="पूर्ण घोषणाएँ"
          titleEn="Completed"
          value={metrics.completed}
          subtitle={`${metrics.completionRate}% पूर्णता दर`}
          progressPercent={metrics.completionRate}
          progressColor="bg-emerald-600"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-700"
          onClick={() => setStatus(filters.status === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          isActive={filters.status === 'COMPLETED'}
        />

        <KpiCard
          title="प्रगति पर"
          titleEn="In Progress"
          value={metrics.inProgress}
          subtitle={`कुल का ${metrics.totalPromises > 0 ? Math.round((metrics.inProgress / metrics.totalPromises) * 100) : 0}%`}
          progressPercent={metrics.totalPromises > 0 ? (metrics.inProgress / metrics.totalPromises) * 100 : 0}
          progressColor="bg-sky-600"
          icon={Clock}
          iconBg="bg-sky-50"
          iconColor="text-sky-700"
          onClick={() => setStatus(filters.status === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          isActive={filters.status === 'IN_PROGRESS'}
        />

        <KpiCard
          title="प्रारंभिक चरण"
          titleEn="Initial Stage"
          value={metrics.initialStage}
          subtitle="स्वीकृति / नीति स्तर"
          progressPercent={metrics.totalPromises > 0 ? (metrics.initialStage / metrics.totalPromises) * 100 : 0}
          progressColor="bg-amber-600"
          icon={AlertCircle}
          iconBg="bg-amber-50"
          iconColor="text-amber-700"
          onClick={() => setStatus(filters.status === 'INITIAL_STAGE' ? 'ALL' : 'INITIAL_STAGE')}
          isActive={filters.status === 'INITIAL_STAGE'}
        />

        <KpiCard
          title="प्रारंभ नहीं"
          titleEn="Not Started"
          value={metrics.notStarted}
          subtitle="क्रियान्वयन प्रतीक्षित"
          progressPercent={metrics.totalPromises > 0 ? (metrics.notStarted / metrics.totalPromises) * 100 : 0}
          progressColor="bg-slate-500"
          icon={PlayCircle}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
          onClick={() => setStatus(filters.status === 'NOT_STARTED' ? 'ALL' : 'NOT_STARTED')}
          isActive={filters.status === 'NOT_STARTED'}
        />

        <KpiCard
          title="पूर्णता दर"
          titleEn="Completion Rate"
          value={`${metrics.completionRate}%`}
          subtitle="आधिकारिक सूत्र आधारित"
          progressPercent={metrics.completionRate}
          progressColor="bg-teal-600"
          icon={Percent}
          iconBg="bg-teal-50"
          iconColor="text-teal-700"
        />
      </div>

      {/* Row 1: Status Distribution Donut + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5">
          <StatusDistributionChart
            metrics={metrics}
            onSelectStatus={(s) => setStatus(s)}
          />
        </div>
        <div className="lg:col-span-7">
          <CategoryBreakdownChart
            data={categoryMetrics}
            onSelectCategory={(cat) => setCategory(cat)}
          />
        </div>
      </div>

      {/* Row 2: Top Departments by Volume + Top Pending Departments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <DepartmentBarChart
            data={departmentMetrics}
            limit={10}
            onSelectDepartment={(dept) => setDepartment(dept)}
          />
        </div>
        <div className="lg:col-span-5">
          <TopPendingDepartmentsChart
            data={departmentMetrics}
            limit={8}
            onSelectDepartment={(dept) => setDepartment(dept)}
          />
        </div>
      </div>

      {/* Row 3: Department Completion Rate + Recent Updates Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <DepartmentCompletionRateChart
            data={departmentMetrics}
            limit={8}
            onSelectDepartment={(dept) => setDepartment(dept)}
          />
        </div>

        <div className="lg:col-span-6">
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-700" />
                  <h3 className="text-sm font-semibold text-slate-800">
                    हालिया क्रियान्वयन अद्यतन एवं टिप्पणियाँ
                  </h3>
                </div>
                <Link
                  href="/promises"
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                >
                  <span>सभी देखें</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {recentUpdates.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg bg-slate-50/70 hover:bg-slate-50 border border-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">#{p.id}</span>
                        <Link
                          href={`/promises/${p.id}`}
                          className="font-semibold text-xs text-slate-900 hover:text-teal-700 transition-colors line-clamp-1"
                        >
                          {p.title}
                        </Link>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-1.5 font-normal">
                      {p.updateNotes || p.notes}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{p.category}</span>
                      <span>संबद्ध: {p.primaryDepartment}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-3 text-right">
              <Link
                href="/promises"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                विस्तृत स्प्रेडशीट तालिका खोलें →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
