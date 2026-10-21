'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (data?.user) {
        setSuccessMsg('सफलतापूर्वक लॉगिन किया गया। पुनर्निर्देशित किया जा रहा है...');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'लॉगिन विफल रहा। कृपया विवरण पुनः जांचें।';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white">
          मध्य प्रदेश शासन
        </h2>
        <p className="mt-1 text-center text-sm text-teal-400 font-medium">
          संकल्प पत्र 2023 - प्रशासनिक एवं नोडल अधिकारी लॉगिन
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700/60">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                ईमेल पता (Official Email)
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nodal.officer@mp.gov.in"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                पासवर्ड (Password)
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition"
              >
                {loading ? 'सत्यापित किया जा रहा है...' : 'लॉगिन करें (Sign In)'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-700/60 pt-4 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-teal-400 transition"
            >
              ← सार्वजनिक डैशबोर्ड पर लौटें (Return to Public Dashboard)
            </Link>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 text-center">
          <p className="font-medium text-slate-300">प्रथम व्यवस्थापक (First Admin) प्रावधान निर्देश:</p>
          <p className="mt-1">
            Supabase Auth में नया उपयोगकर्ता बनाएं, फिर SQL Editor में उसकी भूमिका को 
            <code className="text-teal-400 bg-slate-900 px-1 py-0.5 rounded mx-1">ADMIN</code> 
            के रूप में अद्यतित करें।
          </p>
        </div>
      </div>
    </div>
  );
}
