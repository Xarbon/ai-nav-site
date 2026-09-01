'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrafficData {
  month: string;
  visits: number;
  growth_rate?: number;
}

interface TrafficTrendProps {
  data: TrafficData[];
  locale?: string;
}

export function TrafficTrend({ data, locale = 'zh' }: TrafficTrendProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const isZh = locale === 'zh';
  
  // Sort by month
  const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));
  
  const labels = sortedData.map(d => {
    const [year, month] = d.month.split('-');
    return isZh ? `${year}年${parseInt(month)}月` : `${year}-${month}`;
  });
  
  const visits = sortedData.map(d => d.visits);
  
  // Calculate growth rates if not provided
  const growthRates = sortedData.map((d, i) => {
    if (d.growth_rate !== undefined) return d.growth_rate;
    if (i === 0) return 0;
    const prev = sortedData[i - 1].visits;
    if (prev === 0) return 0;
    return ((d.visits - prev) / prev) * 100;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: isZh ? '月访问量' : 'Monthly Visits',
        data: visits,
        borderColor: '#165DFF',
        backgroundColor: 'rgba(22, 93, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y',
      },
      {
        label: isZh ? '增长率 %' : 'Growth Rate %',
        data: growthRates,
        borderColor: '#36D399',
        backgroundColor: 'rgba(54, 211, 153, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: 'y1',
        borderDash: [5, 5],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (context.datasetIndex === 0) {
              return `${label}: ${value.toLocaleString()}`;
            }
            return `${label}: ${value.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: isZh ? '访问量' : 'Visits',
        },
        ticks: {
          callback: function(value: any) {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
            return value;
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: isZh ? '增长率' : 'Growth %',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
  };

  // Calculate summary stats
  const latestVisits = visits[visits.length - 1];
  const latestGrowth = growthRates[growthRates.length - 1];
  const avgVisits = visits.reduce((a, b) => a + b, 0) / visits.length;
  
  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return Math.round(n).toString();
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 md:p-5">
      <h3 className="text-sm font-bold mb-3" style={{ color: '#0E3A7A' }}>
        {isZh ? '📈 流量趋势' : '📈 Traffic Trend'}
      </h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-xs" style={{ color: '#9CA3AF' }}>
            {isZh ? '最新月访问' : 'Latest Monthly'}
          </div>
          <div className="text-lg font-bold" style={{ color: '#165DFF' }}>
            {formatNumber(latestVisits)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs" style={{ color: '#9CA3AF' }}>
            {isZh ? '最新增长' : 'Latest Growth'}
          </div>
          <div 
            className="text-lg font-bold"
            style={{ color: latestGrowth >= 0 ? '#36D399' : '#EF4444' }}
          >
            {latestGrowth >= 0 ? '+' : ''}{latestGrowth.toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs" style={{ color: '#9CA3AF' }}>
            {isZh ? '平均访问' : 'Avg Visits'}
          </div>
          <div className="text-lg font-bold" style={{ color: '#0E3A7A' }}>
            {formatNumber(avgVisits)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
      
      <div className="mt-3 text-xs" style={{ color: '#9CA3AF' }}>
        {isZh ? '数据来源：哥伦布 AI 工具站增长情报库' : 'Data source: Columbus AI Tools Growth Intelligence'}
      </div>
    </div>
  );
}
