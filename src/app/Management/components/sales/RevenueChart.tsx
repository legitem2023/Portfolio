'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SalesDataResponse } from '../../../../../types/sales';
import { formatCurrency, formatNumber } from '../../../../../utils/salesUtils';

interface RevenueChartProps {
  data?: SalesDataResponse;
  loading: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="h-48 sm:h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  const chartData = data?.data || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-[200px]">
          <p className="font-semibold text-gray-900 text-sm sm:text-base">{label}</p>
          <p className="text-sm text-blue-600">
            Revenue: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-green-600">
            Orders: {formatNumber(payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format Y-axis values based on screen size
  const formatYAxis = (value: number) => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return `$${value / 1000}k`;
    }
    return `$${(value / 1000).toFixed(0)}k`;
  };

  // Responsive chart height
  const getChartHeight = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 250;
      if (window.innerWidth < 1024) return 300;
      return 350;
    }
    return 300;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h3 className="text-lg font-semibold text-gray-900">Revenue & Orders Trend</h3>
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-lg sm:text-base">
          {data?.summary?.totalOrders} orders • {formatCurrency(data?.summary?.totalRevenue || 0)}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={getChartHeight()}>
        <LineChart 
          data={chartData} 
          margin={{ 
            top: 5, 
            right: typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 30, 
            left: typeof window !== 'undefined' && window.innerWidth < 640 ? 0 : 20, 
            bottom: typeof window !== 'undefined' && window.innerWidth < 640 ? 40 : 5 
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12 }}
            angle={typeof window !== 'undefined' && window.innerWidth < 640 ? -90 : -45}
            textAnchor="end"
            height={typeof window !== 'undefined' && window.innerWidth < 640 ? 100 : 80}
            interval={typeof window !== 'undefined' && window.innerWidth < 640 ? "preserveStartEnd" : 0}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12 }}
            tickFormatter={formatYAxis}
            width={typeof window !== 'undefined' && window.innerWidth < 640 ? 40 : 60}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            tick={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12 }}
            width={typeof window !== 'undefined' && window.innerWidth < 640 ? 40 : 60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="revenue" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ 
              fill: '#3b82f6', 
              strokeWidth: 2, 
              r: typeof window !== 'undefined' && window.innerWidth < 640 ? 2 : 4 
            }}
            activeDot={{ 
              r: typeof window !== 'undefined' && window.innerWidth < 640 ? 4 : 6, 
              fill: '#1d4ed8' 
            }}
            name="Revenue"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="orders" 
            stroke="#10b981" 
            strokeWidth={2}
            strokeDasharray={typeof window !== 'undefined' && window.innerWidth < 640 ? "2 2" : "3 3"}
            dot={{ 
              fill: '#10b981', 
              strokeWidth: 2, 
              r: typeof window !== 'undefined' && window.innerWidth < 640 ? 2 : 4 
            }}
            activeDot={{ 
              r: typeof window !== 'undefined' && window.innerWidth < 640 ? 4 : 6, 
              fill: '#047857' 
            }}
            name="Orders"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend for mobile */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 sm:hidden">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-blue-500"></div>
          <span className="text-xs text-gray-600">Revenue</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-green-500 border-dashed border"></div>
          <span className="text-xs text-gray-600">Orders</span>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
