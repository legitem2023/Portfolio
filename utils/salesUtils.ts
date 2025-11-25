import { Timeframe, GroupBy } from '../types/sales';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

export const getTimeframeLabel = (timeframe: Timeframe): string => {
  const labels: Record<Timeframe, string> = {
    TODAY: 'Today',
    YESTERDAY: 'Yesterday',
    LAST_7_DAYS: 'Last 7 Days',
    LAST_30_DAYS: 'Last 30 Days',
    THIS_MONTH: 'This Month',
    LAST_MONTH: 'Last Month',
    THIS_QUARTER: 'This Quarter',
    LAST_QUARTER: 'Last Quarter',
    THIS_YEAR: 'This Year',
    LAST_YEAR: 'Last Year',
    CUSTOM: 'Custom Range'
  };
  return labels[timeframe];
};

export const getGrowthColor = (value: number): string => {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
};

export const getGrowthIcon = (value: number): string => {
  if (value > 0) return '↗';
  if (value < 0) return '↘';
  return '→';
};
