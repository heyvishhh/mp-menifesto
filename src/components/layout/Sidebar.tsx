'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Table,
  BarChart3,
  Building2,
  Layers,
  Lightbulb,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Palette
} from 'lucide-react';
import { useTheme } from '@/lib/context/ThemeContext';

const navigationItems = [
  {
    nameHi: 'डैशबोर्ड',
    nameEn: 'Overview Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    nameHi: 'समस्त घोषणाएँ',
    nameEn: 'All Promises',
    href: '/promises',
    icon: Table,
    badge: '414',
  },
  {
    nameHi: 'गहन विश्लेषण',
    nameEn: 'Analysis',
    href: '/analysis',
    icon: BarChart3,
  },
  {
    nameHi: 'विभाग-वार प्रदर्शन',
    nameEn: 'Departments',
    href: '/departments',
    icon: Building2,
    badge: '45',
  },
  {
    nameHi: 'श्रेणी / क्षेत्र',
    nameEn: 'Categories',
    href: '/categories',
    icon: Layers,
    badge: '10',
  },
  {
    nameHi: 'प्रमुख निष्कर्ष',
    nameEn: 'Key Insights',
    href: '/insights',
    icon: Lightbulb,
  },
  {
    nameHi: 'प्रशासन एवं डेटा',
    nameEn: 'Admin / Data Management',
    href: '/admin',
    icon: ShieldCheck,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { openCustomizer, theme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-[var(--sidebar-bg,#042f2e)] text-white shadow-md focus:outline-none"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 flex flex-col bg-[var(--sidebar-bg,#042f2e)] text-slate-100 transition-all duration-300 shadow-xl ${
          collapsed ? 'w-20' : 'w-68'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          backgroundColor: 'var(--sidebar-bg, #042f2e)',
        }}
      >
        {/* Brand / Logo Section */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner"
              style={{
                background: `linear-gradient(135deg, ${theme.shades[400]}, ${theme.shades[600]})`,
              }}
            >
              <span className="font-bold text-white text-base font-serif">म.प्र.</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight text-white truncate">
                  मध्य प्रदेश संकल्प पत्र
                </span>
                <span className="text-[11px] text-white/70 font-medium truncate">
                  संकल्प पत्र मॉनिटरिंग
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title={collapsed ? 'विस्तार करें (Expand)' : 'संक्षिप्त करें (Collapse)'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-sm font-semibold'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--sidebar-active, var(--brand-teal-600))' : undefined,
                }}
                title={collapsed ? `${item.nameHi} (${item.nameEn})` : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div className="truncate">
                      <div className="leading-tight truncate">{item.nameHi}</div>
                      <div className="text-[10px] opacity-70 leading-tight truncate">{item.nameEn}</div>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-black/30 text-white' : 'bg-white/15 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Info & Theme Customizer Button */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {/* Theme Customize Trigger Button */}
          <button
            type="button"
            onClick={openCustomizer}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all shadow-2xs border border-white/10 hover:border-white/20"
            title="ग्लोबल थीम कस्टमाइज़ करें"
          >
            <Palette className="w-4 h-4 text-white" />
            {!collapsed && <span className="truncate">थीम कस्टमाइज़ (Global)</span>}
          </button>

          {!collapsed ? (
            <div className="bg-black/25 rounded-lg p-2.5 text-[11px] text-white/80 border border-white/10">
              <div className="font-semibold text-white">संकल्प पत्र 2023</div>
              <div className="text-[10px] text-white/70">कुल वादे: 414 | पूर्णता: 11.4%</div>
            </div>
          ) : (
            <div className="text-center text-[10px] text-white/60 font-bold">
              v1.0
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
