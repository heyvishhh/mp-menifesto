'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  titleEn?: string;
  value: string | number;
  subtitle?: string;
  progressPercent?: number;
  progressColor?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function KpiCard({
  title,
  titleEn,
  value,
  subtitle,
  progressPercent,
  progressColor = 'bg-teal-600',
  icon: Icon,
  iconColor = 'text-teal-700',
  iconBg = 'bg-teal-50',
  onClick,
  isActive = false,
}: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl border p-4.5 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-teal-300' : ''
      } ${
        isActive ? 'ring-2 ring-teal-600 border-teal-500 shadow-sm' : 'border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span>{title}</span>
            {titleEn && <span className="text-[10px] text-slate-400 lowercase font-normal">({titleEn})</span>}
          </p>
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {subtitle && (
        <div className="mt-2.5 text-xs text-slate-500 font-medium">
          {subtitle}
        </div>
      )}

      {progressPercent !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
