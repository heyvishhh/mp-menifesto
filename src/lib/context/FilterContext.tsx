'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { DashboardFilters, PromiseStatus, PoliticalImportance } from '@/types';

interface FilterContextType {
  filters: DashboardFilters;
  setSearchQuery: (query: string) => void;
  setDepartment: (dept: string) => void;
  setCategory: (cat: string) => void;
  setStatus: (status: PromiseStatus | 'ALL') => void;
  setPoliticalImportance: (importance: PoliticalImportance | 'ALL') => void;
  setWorkStarted: (started: boolean | 'ALL') => void;
  setFilterBatch: (partial: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}

const defaultFilters: DashboardFilters = {
  searchQuery: '',
  department: 'ALL',
  category: 'ALL',
  status: 'ALL',
  politicalImportance: 'ALL',
  workStarted: 'ALL',
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setDepartment = useCallback((dept: string) => {
    setFilters(prev => ({ ...prev, department: dept }));
  }, []);

  const setCategory = useCallback((cat: string) => {
    setFilters(prev => ({ ...prev, category: cat }));
  }, []);

  const setStatus = useCallback((status: PromiseStatus | 'ALL') => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  const setPoliticalImportance = useCallback((politicalImportance: PoliticalImportance | 'ALL') => {
    setFilters(prev => ({ ...prev, politicalImportance }));
  }, []);

  const setWorkStarted = useCallback((workStarted: boolean | 'ALL') => {
    setFilters(prev => ({ ...prev, workStarted }));
  }, []);

  const setFilterBatch = useCallback((partial: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim() !== '') count++;
    if (filters.department !== 'ALL') count++;
    if (filters.category !== 'ALL') count++;
    if (filters.status !== 'ALL') count++;
    if (filters.politicalImportance !== 'ALL') count++;
    if (filters.workStarted !== 'ALL') count++;
    return count;
  }, [filters]);

  const value = useMemo(() => ({
    filters,
    setSearchQuery,
    setDepartment,
    setCategory,
    setStatus,
    setPoliticalImportance,
    setWorkStarted,
    setFilterBatch,
    resetFilters,
    activeFilterCount,
  }), [
    filters,
    setSearchQuery,
    setDepartment,
    setCategory,
    setStatus,
    setPoliticalImportance,
    setWorkStarted,
    setFilterBatch,
    resetFilters,
    activeFilterCount,
  ]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useDashboardFilters must be used within a FilterProvider');
  }
  return context;
}
