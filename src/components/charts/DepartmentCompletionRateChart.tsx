'use client';

import React, { useMemo } from 'react';
import * as echarts from 'echarts';
import { EChartWrapper } from './EChartWrapper';
import { DepartmentMetrics } from '@/types';
import { useTheme } from '@/lib/context/ThemeContext';

interface Props {
  data: DepartmentMetrics[];
  limit?: number;
  onSelectDepartment?: (dept: string) => void;
}

export function DepartmentCompletionRateChart({ data, limit = 10, onSelectDepartment }: Props) {
  const { theme } = useTheme();
  // Filter departments with at least 3 promises to avoid 100% on 1 promise outliers
  const qualified = useMemo(() => {
    return data
      .filter(d => d.totalPromises >= 3)
      .sort((a, b) => b.completionRate - a.completionRate)
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
          const match = qualified.find(d => d.department === item.name);
          return `
            <div style="font-size: 12px; font-family: inherit;">
              <b>${item.name}</b><br/>
              पूर्णता दर: <b style="color: #059669;">${item.value}%</b><br/>
              पूर्ण वादे: ${match?.completed} / ${match?.totalPromises}
            </div>
          `;
        },
      },
      grid: {
        left: '3%',
        right: '5%',
        bottom: '3%',
        top: '20px',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        max: 100,
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: {
          formatter: '{value}%',
          color: '#64748b',
          fontSize: 11,
        },
      },
      yAxis: {
        type: 'category',
        data: qualified.map(d => d.department),
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
          name: 'पूर्णता दर (%)',
          type: 'bar',
          data: qualified.map(d => d.completionRate),
          itemStyle: {
            color: theme.accent || '#10b981',
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: '#065f46',
            fontSize: 11,
            fontWeight: 'bold',
          },
        },
      ],
    };
    return chartOption;
  }, [qualified]);

  return (
    <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            विभाग-वार पूर्णता दर (%)
          </h3>
          <p className="text-xs text-slate-500">
            Completion Rate by Department (Min. 3 promises)
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
