'use client';

import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RadarChartProps {
  scores: {
    intelligence: number;
    easeOfUse: number;
    outputQuality: number;
    valueForMoney: number;
  };
  isZh: boolean;
}

const DIMENSION_COLORS: Record<string, string> = {
  intelligence: '#165DFF',
  easeOfUse: '#36D399',
  outputQuality: '#FB923C',
  valueForMoney: '#A855F7',
};

export function RadarChart({ scores, isZh }: RadarChartProps) {
  const labels = isZh
    ? ['智能能力', '易用性', '产出质量', '性价比']
    : ['Intelligence', 'Ease of Use', 'Output Quality', 'Value For Money'];

  const values = [
    scores.intelligence,
    scores.easeOfUse,
    scores.outputQuality,
    scores.valueForMoney,
  ];

  const data = {
    labels,
    datasets: [
      {
        label: isZh ? '评分' : 'Score',
        data: values,
        backgroundColor: 'rgba(22, 93, 255, 0.15)',
        borderColor: '#165DFF',
        borderWidth: 2,
        pointBackgroundColor: values.map(
          (_, i) =>
            Object.values(DIMENSION_COLORS)[i]
        ),
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          font: { size: 10 },
          color: '#999',
          backdropColor: 'transparent',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.06)',
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.06)',
        },
        pointLabels: {
          font: { size: 12, weight: 500 as const },
          color: (ctx: any) => {
            const colors = Object.values(DIMENSION_COLORS);
            return colors[ctx.index] || '#333';
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.raw} / 5`,
        },
      },
    },
  };

  return (
    <div style={{ maxWidth: 280, margin: '0 auto' }}>
      <Radar data={data} options={options} />
    </div>
  );
}
