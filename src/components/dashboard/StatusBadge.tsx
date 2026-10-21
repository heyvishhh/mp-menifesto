import React from 'react';
import { PromiseStatus, PoliticalImportance } from '@/types';
import { STATUS_CONFIG, IMPORTANCE_CONFIG } from '@/lib/analytics/metrics';

export function StatusBadge({ status, showEnglish = false }: { status: PromiseStatus; showEnglish?: boolean }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_STARTED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${config.badgeClass}`}
      title={config.labelEn}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <span>{config.labelHi}</span>
      {showEnglish && (
        <span className="text-[10px] opacity-70">({config.labelEn})</span>
      )}
    </span>
  );
}

export function ImportanceBadge({ importance }: { importance: PoliticalImportance }) {
  const config = IMPORTANCE_CONFIG[importance] || IMPORTANCE_CONFIG.LIMITED;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${config.badgeClass}`}
    >
      {config.labelHi}
    </span>
  );
}
