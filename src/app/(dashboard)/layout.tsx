'use client';

import React, { Suspense } from 'react';
import { FilterProvider } from '@/lib/context/FilterContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DevBanner } from '@/components/layout/DevBanner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FilterProvider>
      <div className="min-h-screen flex flex-col bg-slate-50/70">
        <DevBanner />
        <div className="flex-1 flex flex-col lg:flex-row">
          <Suspense fallback={<div className="w-20 lg:w-68 bg-[#042f2e] h-screen" />}>
            <Sidebar />
          </Suspense>
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Suspense fallback={<div className="h-14 bg-white border-b border-slate-200" />}>
              <Header />
            </Suspense>
            <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
              <Suspense fallback={<div className="py-20 text-center text-xs text-slate-500">डेटा लोड हो रहा है...</div>}>
                {children}
              </Suspense>
            </main>
          </div>
        </div>
      </div>
    </FilterProvider>
  );
}
