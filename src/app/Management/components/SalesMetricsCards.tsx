'use client';

import React from 'react';
import { SalesMetrics } from '../../../../types/sales';
import { formatCurrency, formatNumber, formatPercentage, getGrowthColor, getGrowthIcon } from '@/utils/salesUtils';

interface SalesMetricsCardsProps {
  data?: SalesMetrics;
  loading: boolean;
}

const SalesMetricsCards: React.FC<SalesMetricsCardsProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data?.revenue.total || 0),
      growth: data?.revenue.growth || 0,
      description: 'Total sales revenue',
      icon: '💰',
    },
    {
      title: 'Total Orders',
      value: formatNumber(data?.orders.total || 0),
      growth: data?.orders.growth || 0,
      description: 'Number of orders',
      icon: '📦',
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(data?.revenue.average || 0),
      growth: 0, // AOV growth not directly provided
      description: 'Average revenue per order',
      icon: '📊',
    },
    {
      title: 'Customers',
      value: formatNumber(data?.customers.total || 0),
      growth: 0, // Customer growth not directly provided
      description: 'Total customers',
      icon: '👥',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl">{metric.icon}</div>
            <div className={`text-sm font-medium ${getGrowthColor(metric.growth)}`}>
              {getGrowthIcon(metric.growth)} {formatPercentage(metric.growth)}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
          <p className="text-gray-600 text-sm font-medium">{metric.title}</p>
          <p className="text-gray-500 text-xs mt-1">{metric.description}</p>
        </div>
      ))}
    </div>
  );
};

export default SalesMetricsCards;
