import { ScriptableContext } from 'chart.js';

export const performanceTrendsConfig = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        boxHeight: 8,
        padding: 20,
        font: {
          family: 'Roboto',
          size: 12,
        },
      },
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += parseFloat(context.parsed.y).toFixed(1) + '%';
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      suggestedMin: 50,
      suggestedMax: 100,
      ticks: {
        callback: function(value: number) {
          return value + '%';
        },
        font: {
          family: 'Roboto',
          size: 11,
        },
      },
      grid: {
        drawBorder: false,
      },
    },
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        font: {
          family: 'Roboto',
          size: 11,
        },
      },
    },
  },
  elements: {
    line: {
      borderWidth: 2,
      tension: 0.4,
    },
    point: {
      radius: 4,
      hitRadius: 10,
      hoverRadius: 6,
    },
  },
};

export const averageScoreLineConfig = {
  borderColor: '#1565C0',
  backgroundColor: (context: ScriptableContext<'line'>) => {
    const ctx = context.chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(21, 101, 192, 0.3)');
    gradient.addColorStop(1, 'rgba(21, 101, 192, 0)');
    return gradient;
  },
  fill: true,
};

export const passRateLineConfig = {
  borderColor: '#2E7D32',
  backgroundColor: (context: ScriptableContext<'line'>) => {
    const ctx = context.chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(46, 125, 50, 0.3)');
    gradient.addColorStop(1, 'rgba(46, 125, 50, 0)');
    return gradient;
  },
  fill: true,
};

export const subjectPerformanceConfig = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += parseFloat(context.parsed.y).toFixed(1) + '%';
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      suggestedMin: 50,
      suggestedMax: 100,
      ticks: {
        callback: function(value: number) {
          return value + '%';
        },
      },
      grid: {
        drawBorder: false,
      },
    },
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
    },
  },
};

export const barColorsBySubject = [
  'rgba(21, 101, 192, 0.7)',  // Primary blue
  'rgba(46, 125, 50, 0.7)',   // Secondary green
  'rgba(255, 109, 0, 0.7)',   // Accent orange
  'rgba(63, 81, 181, 0.7)',   // Indigo
  'rgba(0, 150, 136, 0.7)',   // Teal
  'rgba(233, 30, 99, 0.7)',   // Pink
  'rgba(156, 39, 176, 0.7)',  // Purple
  'rgba(121, 85, 72, 0.7)',   // Brown
];
