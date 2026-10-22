'use client';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Calendar, Download } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const pageTitles: Record<string, { hi: string; en: string }> = {
  '/': { hi: ' डैशबोर्ड', en: 'Overview Executive Dashboard' },
  '/promises': { hi: 'समस्त घोषणाएँ एवं वादे', en: 'All 414 Manifesto Commitments' },
  '/analysis': { hi: 'गहन सांख्यिकीय विश्लेषण', en: 'In-Depth Analytics & Drilldowns' },
  '/departments': { hi: 'विभाग-वार प्रदर्शन मूल्यांकन', en: 'Department Performance Scorecard' },
  '/categories': { hi: 'क्षेत्रीय / श्रेणी-वार विश्लेषण', en: 'Category & Sectoral Analysis' },
  '/insights': { hi: 'प्रमुख तथ्यात्मक निष्कर्ष', en: 'Key Data-Driven Insights' },
  '/admin': { hi: 'प्रशासन एवं डेटा प्रबंधन', en: 'Admin, Excel Ingestion & Export' },
};

export function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) setUser(data.user);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    } catch {
      // Offline fallback
    }
  }, []);
  
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
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user.email ? user.email.slice(0, 2).toUpperCase() : 'मप्र'}
                </div>
                <div className="hidden xl:block text-left text-xs">
                  <div className="font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                    {user.email}
                  </div>
                  <div className="text-[10px] text-teal-600 font-semibold leading-tight">
                    प्रशासनिक सत्र (Active)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    setUser(null);
                    window.location.reload();
                  }}
                  className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                  title="लॉगआउट"
                >
                  लॉगआउट
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition"
              >
                लॉगिन (Sign In)
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
