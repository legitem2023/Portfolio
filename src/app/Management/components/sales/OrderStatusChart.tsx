'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { OrderStatusCount } from '../../../../../types/sales';
import { formatNumber } from '../../../../../utils/salesUtils';

interface OrderStatusChartProps {
  data?: OrderStatusCount[];
  loading: boolean;
}

const OrderStatusChart: React.FC<OrderStatusChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-48 sm:h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  const statusData = data || [];

  const COLORS = {
    DELIVERED: '#10b981',
    PROCESSING: '#3b82f6',
    SHIPPED: '#8b5cf6',
    PENDING: '#f59e0b',
    CANCELLED: '#ef4444',
    REFUNDED: '#6b7280',
  };

  const getStatusColor = (status: string): string => {
    return COLORS[status as keyof typeof COLORS] || '#6b7280';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-[200px]">
          <p className="font-semibold text-gray-900 text-sm sm:text-base">{data.status}</p>
          <p className="text-xs sm:text-sm text-gray-600">
            Orders: {formatNumber(data.count)}
          </p>
          <p className="text-xs sm:text-sm text-gray-600">
            Percentage: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Responsive label formatter
  const renderCustomizedLabel = ({ 
    cx, cy, midAngle, innerRadius, outerRadius, percentage, status 
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Show abbreviated labels on small screens
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;
    const displayText = isSmallScreen ? `${percentage.toFixed(0)}%` : `${percentage.toFixed(1)}%`;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
        fontSize={isSmallScreen ? 10 : 12}
      >
        {displayText}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
      
      {statusData.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
          No order status data available.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          {/* Chart Container */}
          <div className="w-full lg:w-1/2 lg:pr-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                  label={renderCustomizedLabel}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend - moves below chart on mobile, beside on desktop */}
          <div className="w-full lg:w-1/2 lg:pl-4 mt-4 lg:mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {statusData.map((status) => (
                <div 
                  key={status.status} 
                  className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getStatusColor(status.status) }}
                    ></div>
                    <span className="capitalize text-gray-700 text-xs sm:text-sm truncate">
                      {status.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="text-gray-900 font-medium text-xs sm:text-sm ml-2 flex-shrink-0">
                    {formatNumber(status.count)} <span className="text-gray-500">({status.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatusChart;
