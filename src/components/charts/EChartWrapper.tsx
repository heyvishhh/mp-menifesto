'use client';

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface EChartWrapperProps {
  option: echarts.EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  loading?: boolean;
  onChartClick?: (params: Record<string, unknown>) => void;
}

export function EChartWrapper({
  option,
  style = { height: '320px', width: '100%' },
  className = '',
  loading = false,
  onChartClick,
}: EChartWrapperProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      });

      if (onChartClick) {
        chartInstance.current.on('click', (params) => {
          onChartClick(params);
        });
      }
    }

    if (loading) {
      chartInstance.current.showLoading('default', {
        text: 'डेटा लोड हो रहा है...',
        color: '#0f766e',
        textColor: '#334155',
        maskColor: 'rgba(255, 255, 255, 0.8)',
      });
    } else {
      chartInstance.current.hideLoading();
      chartInstance.current.setOption(option, true);
    }
  }, [option, loading, onChartClick]);

  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (chartRef.current) {
      resizeObserver.observe(chartRef.current);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return (
    <div
      ref={chartRef}
      style={style}
      className={`min-h-[280px] w-full ${className}`}
    />
  );
}
