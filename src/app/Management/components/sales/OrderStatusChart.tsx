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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
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
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.status}</p>
          <p className="text-sm text-gray-600">
            Orders: {formatNumber(data.count)}
          </p>
          <p className="text-sm text-gray-600">
            Percentage: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
      
      {statusData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No order status data available.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="status"
                label={({ status, percentage }) => `${status} (${percentage.toFixed(1)}%)`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-4 space-y-2">
            {statusData.map((status) => (
              <div key={status.status} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getStatusColor(status.status) }}
                  ></div>
                  <span className="capitalize text-gray-700">{status.status.toLowerCase()}</span>
                </div>
                <div className="text-gray-900 font-medium">
                  {formatNumber(status.count)} ({status.percentage.toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OrderStatusChart;
