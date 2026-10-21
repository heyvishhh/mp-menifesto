'use client';

import React from 'react';
import { Database, AlertTriangle } from 'lucide-react';

export function DevBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-200/70 text-amber-900 px-4 py-1.5 text-xs font-medium flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Database className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <span>
          <strong className="font-semibold">चरण 1 पूर्वावलोकन मोड (Development In-Memory Store):</strong> 
          {' '}डेटा स्रोत: <code>MP Manifesto Analysis.xlsx</code> (कार्यपुस्तिका से 414 प्रमाणित वादे लोड किए गए हैं)।
        </span>
      </div>
      <div className="hidden md:flex items-center gap-2 text-amber-700 text-[11px]">
        <AlertTriangle className="w-3 h-3 text-amber-500" />
        <span>चरण 3 में Supabase Cloud Persistence से स्वचालित कनेक्ट होगा</span>
      </div>
    </div>
  );
}
