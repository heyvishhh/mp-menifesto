'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { promiseRepository } from '@/lib/repositories';
import { PromiseRecord } from '@/types';
import { useDashboardFilters } from '@/lib/context/FilterContext';
import { filterPromises } from '@/lib/analytics/metrics';
import { AgPromiseGrid } from '@/components/tables/AgPromiseGrid';
import { FilterBar } from '@/components/layout/FilterBar';
import { Download, FileSpreadsheet } from 'lucide-react';

export default function AllPromisesPage() {
  const [allPromises, setAllPromises] = useState<PromiseRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { filters } = useDashboardFilters();

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

  // Handlers for AG Grid operations
  const handleUpdatePromise = async (id: number, updates: Partial<PromiseRecord>) => {
    await promiseRepository.update(id, updates);
  };

  const handleAddPromise = async (data: Omit<PromiseRecord, 'id' | 'updatedAt'>) => {
    await promiseRepository.create(data);
  };

  const handleDeletePromise = async (id: number) => {
    await promiseRepository.delete(id);
  };

  const filteredPromises = useMemo(() => {
    return filterPromises(allPromises, filters);
  }, [allPromises, filters]);

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
        <p className="text-sm font-medium text-slate-600">संकल्प पत्र डेटा लोड हो रहा है...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-700" />
            <span>समस्त संकल्प पत्र वादे (Editable AG Grid Data Table)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            AG Grid Community आधारित स्प्रेडशीट: इनलाइन सेल संपादन, बहु-विभागीय मैपिंग, छंटाई एवं सुरक्षित विलोपन
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.open('/api/export', '_blank')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>एक्सेल निर्यात (Export Excel)</span>
          </button>
        </div>
      </div>

      {/* Shared Filter Bar */}
      <FilterBar
        departments={availableDepartments}
        categories={availableCategories}
        totalResults={filteredPromises.length}
        totalPossible={allPromises.length}
      />

      {/* Editable AG Grid Table */}
      <AgPromiseGrid
        promises={filteredPromises}
        onUpdatePromise={handleUpdatePromise}
        onAddPromise={handleAddPromise}
        onDeletePromise={handleDeletePromise}
        availableDepartments={availableDepartments}
        availableCategories={availableCategories}
      />
    </div>
  );
}
