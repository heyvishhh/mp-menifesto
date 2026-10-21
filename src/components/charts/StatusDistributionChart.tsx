'use client';

import React, { useMemo } from 'react';
import * as echarts from 'echarts';
import { EChartWrapper } from './EChartWrapper';
import { DashboardMetrics, PromiseStatus } from '@/types';
import { STATUS_CONFIG } from '@/lib/analytics/metrics';

interface Props {
  metrics: DashboardMetrics;
  onSelectStatus?: (status: PromiseStatus) => void;
}

export function StatusDistributionChart({ metrics, onSelectStatus }: Props) {
  const option = useMemo(() => {
    const data = [
      {
        name: `${STATUS_CONFIG.COMPLETED.labelHi} (${STATUS_CONFIG.COMPLETED.labelEn})`,
        value: metrics.completed,
        statusKey: 'COMPLETED' as PromiseStatus,
        itemStyle: { color: STATUS_CONFIG.COMPLETED.color },
      },
      {
        name: `${STATUS_CONFIG.IN_PROGRESS.labelHi} (${STATUS_CONFIG.IN_PROGRESS.labelEn})`,
        value: metrics.inProgress,
        statusKey: 'IN_PROGRESS' as PromiseStatus,
        itemStyle: { color: STATUS_CONFIG.IN_PROGRESS.color },
      },
      {
        name: `${STATUS_CONFIG.INITIAL_STAGE.labelHi} (${STATUS_CONFIG.INITIAL_STAGE.labelEn})`,
        value: metrics.initialStage,
        statusKey: 'INITIAL_STAGE' as PromiseStatus,
        itemStyle: { color: STATUS_CONFIG.INITIAL_STAGE.color },
      },
      {
        name: `${STATUS_CONFIG.NOT_STARTED.labelHi} (${STATUS_CONFIG.NOT_STARTED.labelEn})`,
        value: metrics.notStarted,
        statusKey: 'NOT_STARTED' as PromiseStatus,
        itemStyle: { color: STATUS_CONFIG.NOT_STARTED.color },
      },
    ];

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; percent: number };
          return `
            <div style="font-family: inherit; font-size: 12px;">
              <span style="font-weight: 600;">${p.name}</span><br/>
              संख्या: <b>${p.value}</b> (${p.percent}%)
            </div>
          `;
        },
      },
      legend: {
        bottom: 0,
        left: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: {
          fontSize: 11,
          color: '#475569',
        },
      },
      series: [
        {
          name: 'स्थिति वितरण',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#ffffff',
            borderWidth: 2,
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}: {c}',
            fontSize: 11,
            color: '#334155',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold',
            },
          },
          data,
        },
      ],
    };
    return option;
  }, [metrics]);

  const handleChartClick = (params: Record<string, unknown>) => {
    const dataObj = params.data as { statusKey?: PromiseStatus } | undefined;
    if (onSelectStatus && dataObj?.statusKey) {
      onSelectStatus(dataObj.statusKey);
    }
  };

  return (
    <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            वर्तमान क्रियान्वयन स्थिति वितरण
          </h3>
          <p className="text-xs text-slate-500">
            Implementation Status Distribution (Total: {metrics.totalPromises})
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {metrics.completionRate}% पूर्णता
          </span>
        </div>
      </div>
      <EChartWrapper option={option} style={{ height: '280px', width: '100%' }} onChartClick={handleChartClick} />
    </div>
  );
}
