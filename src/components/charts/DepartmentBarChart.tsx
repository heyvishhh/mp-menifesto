'use client';

import React, { useMemo } from 'react';
import * as echarts from 'echarts';
import { EChartWrapper } from './EChartWrapper';
import { DepartmentMetrics } from '@/types';
import { STATUS_CONFIG } from '@/lib/analytics/metrics';

interface Props {
  data: DepartmentMetrics[];
  limit?: number;
  onSelectDepartment?: (dept: string) => void;
}

export function DepartmentBarChart({ data, limit = 10, onSelectDepartment }: Props) {
  const topData = useMemo(() => {
    return data.slice(0, limit).reverse();
  }, [data, limit]);

  const option = useMemo(() => {
    const depts = topData.map(d => d.department);

    const chartOption: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const items = params as Array<{ name: string; value: number; color: string; seriesName: string }>;
          if (!items || items.length === 0) return '';
          let html = `<div style="font-size: 12px; font-family: inherit;"><b>${items[0].name}</b><br/>`;
          let total = 0;
          for (const item of items) {
            total += item.value;
            html += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:9px;height:9px;background-color:${item.color};"></span>
                     ${item.seriesName}: <b>${item.value}</b><br/>`;
          }
          html += `<div style="border-top: 1px solid #e2e8f0; margin-top: 4px; padding-top: 2px;">कुल संबद्ध वादे: <b>${total}</b></div></div>`;
          return html;
        },
      },
      legend: {
        top: 0,
        right: '4%',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { fontSize: 11, color: '#475569' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '36px',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'category',
        data: depts,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: {
          color: '#334155',
          fontSize: 11,
          formatter: (value: string) => {
            return value.length > 22 ? value.substring(0, 22) + '...' : value;
          },
        },
      },
      series: [
        {
          name: STATUS_CONFIG.COMPLETED.labelHi,
          type: 'bar',
          stack: 'total',
          itemStyle: { color: STATUS_CONFIG.COMPLETED.color },
          data: topData.map(d => d.completed),
        },
        {
          name: STATUS_CONFIG.IN_PROGRESS.labelHi,
          type: 'bar',
          stack: 'total',
          itemStyle: { color: STATUS_CONFIG.IN_PROGRESS.color },
          data: topData.map(d => d.inProgress),
        },
        {
          name: STATUS_CONFIG.INITIAL_STAGE.labelHi,
          type: 'bar',
          stack: 'total',
          itemStyle: { color: STATUS_CONFIG.INITIAL_STAGE.color },
          data: topData.map(d => d.initialStage),
        },
        {
          name: STATUS_CONFIG.NOT_STARTED.labelHi,
          type: 'bar',
          stack: 'total',
          itemStyle: { color: STATUS_CONFIG.NOT_STARTED.color },
          data: topData.map(d => d.notStarted),
        },
      ],
    };
    return chartOption;
  }, [topData]);

  const handleChartClick = (params: Record<string, unknown>) => {
    if (onSelectDepartment && typeof params.name === 'string') {
      onSelectDepartment(params.name);
    }
  };

  return (
    <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            शीर्ष विभाग: क्रियान्वयन स्थिति
          </h3>
          <p className="text-xs text-slate-500">
            Top Departments by Promise Volume (Top {limit})
          </p>
        </div>
      </div>
      <EChartWrapper option={option} style={{ height: '340px', width: '100%' }} onChartClick={handleChartClick} />
    </div>
  );
}
