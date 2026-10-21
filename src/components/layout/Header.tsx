'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Calendar, Download } from 'lucide-react';
import Link from 'next/link';

const pageTitles: Record<string, { hi: string; en: string }> = {
  '/': { hi: 'सिंहावलोकन डैशबोर्ड', en: 'Overview Executive Dashboard' },
  '/promises': { hi: 'समस्त घोषणाएँ एवं वादे', en: 'All 414 Manifesto Commitments' },
  '/analysis': { hi: 'गहन सांख्यिकीय विश्लेषण', en: 'In-Depth Analytics & Drilldowns' },
  '/departments': { hi: 'विभाग-वार प्रदर्शन मूल्यांकन', en: 'Department Performance Scorecard' },
  '/categories': { hi: 'क्षेत्रीय / श्रेणी-वार विश्लेषण', en: 'Category & Sectoral Analysis' },
  '/insights': { hi: 'प्रमुख तथ्यात्मक निष्कर्ष', en: 'Key Data-Driven Insights' },
  '/admin': { hi: 'प्रशासन एवं डेटा प्रबंधन', en: 'Admin, Excel Ingestion & Export' },
};

export function Header() {
  const pathname = usePathname();
  
  // Find matching title or handle promise detail view
  let titleInfo = pageTitles[pathname];
  if (!titleInfo && pathname.startsWith('/promises/')) {
    const id = pathname.split('/')[2];
    titleInfo = { hi: `संकल्प विवरण #${id}`, en: `Promise Detail View #${id}` };
  }
  if (!titleInfo) {
    titleInfo = { hi: 'संकल्प पत्र विश्लेषण', en: 'MP Manifesto Analysis' };
  }

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Breadcrumbs & Page Heading */}
        <div className="pl-10 lg:pl-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <Link href="/" className="hover:text-teal-700 transition-colors">
              डैशबोर्ड
            </Link>
            <span>/</span>
            <span className="text-teal-800 font-semibold">{titleInfo.hi}</span>
          </div>
          <h1 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{titleInfo.hi}</span>
            <span className="text-xs font-normal text-slate-400 hidden sm:inline">
              | {titleInfo.en}
            </span>
          </h1>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>समीक्षा चक्र: <b>अक्टूबर 2026</b></span>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">एक्सेल निर्यात / डेटा</span>
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              मप्र
            </div>
            <div className="hidden xl:block text-left text-xs">
              <div className="font-semibold text-slate-800 leading-tight">नोडल अधिकारी</div>
              <div className="text-[10px] text-slate-400 leading-tight">सीएम डैशबोर्ड सेल</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
