'use client';

import React, { useMemo } from 'react';
import * as echarts from 'echarts';
import { EChartWrapper } from './EChartWrapper';
import { DepartmentMetrics } from '@/types';

interface Props {
  data: DepartmentMetrics[];
  limit?: number;
  onSelectDepartment?: (dept: string) => void;
}

export function TopPendingDepartmentsChart({ data, limit = 8, onSelectDepartment }: Props) {
  const topPending = useMemo(() => {
    return [...data]
      .sort((a, b) => b.pendingPromises - a.pendingPromises)
      .slice(0, limit)
      .reverse();
  }, [data, limit]);

  const option = useMemo(() => {
    const chartOption: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const items = params as Array<{ name: string; value: number }>;
          if (!items || items.length === 0) return '';
          const item = items[0];
          return `
            <div style="font-size: 12px; font-family: inherit;">
              <b>${item.name}</b><br/>
              लंबित वादे: <b style="color: #d97706;">${item.value}</b>
            </div>
          `;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '20px',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'category',
        data: topPending.map(d => d.department),
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: {
          color: '#334155',
          fontSize: 11,
          formatter: (value: string) => {
            return value.length > 20 ? value.substring(0, 20) + '...' : value;
          },
        },
      },
      series: [
        {
          name: 'लंबित वादे',
          type: 'bar',
          data: topPending.map(d => d.pendingPromises),
          itemStyle: {
            color: '#f59e0b',
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: 'right',
            color: '#78350f',
            fontSize: 11,
            fontWeight: 'bold',
          },
        },
      ],
    };
    return chartOption;
  }, [topPending]);

  return (
    <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            सर्वाधिक लंबित वादों वाले शीर्ष विभाग
          </h3>
          <p className="text-xs text-slate-500">
            Departments with Highest Pending Commitments (Top {limit})
          </p>
        </div>
      </div>
      <EChartWrapper
        option={option}
        style={{ height: '300px', width: '100%' }}
        onChartClick={(p) => {
          if (onSelectDepartment && typeof p.name === 'string') {
            onSelectDepartment(p.name);
          }
        }}
      />
    </div>
  );
}
