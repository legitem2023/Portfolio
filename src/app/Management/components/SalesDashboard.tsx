'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { SALES_METRICS_QUERY, SALES_DATA_QUERY, TOP_PRODUCTS_QUERY } from '../../components/graphql/query';
import { Timeframe, GroupBy, SalesFilters } from '../../../../types/sales';
import SalesMetricsCards from './sales/SalesMetricsCards';
import RevenueChart from './sales/RevenueChart';
import TopProductsTable from './sales/TopProductsTable';
import OrderStatusChart from './sales/OrderStatusChart';
import TimeframeSelector from './sales/TimeframeSelector';

const SalesDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('LAST_30_DAYS');
  const [groupBy, setGroupBy] = useState<GroupBy>('DAILY');
  const [filters, setFilters] = useState<SalesFilters>({});

  const { data: metricsData, loading: metricsLoading, error: metricsError } = useQuery(SALES_METRICS_QUERY, {
    variables: { timeframe, filters },
    fetchPolicy: 'cache-and-network',
  });

  const { data: salesData, loading: salesLoading, error: salesError } = useQuery(SALES_DATA_QUERY, {
    variables: { timeframe, groupBy, filters },
    fetchPolicy: 'cache-and-network',
  });

  const { data: topProductsData, loading: topProductsLoading, error: topProductsError } = useQuery(TOP_PRODUCTS_QUERY, {
    variables: { timeframe, limit: 10 },
    fetchPolicy: 'cache-and-network',
  });

  if (metricsError || salesError || topProductsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error loading sales data</h3>
          <p className="text-red-600 text-sm mt-1">
            {metricsError?.message || salesError?.message || topProductsError?.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
          <p className="text-gray-600 mt-1">Monitor your business performance and growth</p>
        </div>
        <TimeframeSelector
          timeframe={timeframe}
          groupBy={groupBy}
          filters={filters}
          onTimeframeChange={setTimeframe}
          onGroupByChange={setGroupBy}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Metrics Cards */}
      <SalesMetricsCards 
        data={metricsData?.salesMetrics} 
        loading={metricsLoading} 
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <RevenueChart 
            data={salesData?.salesData} 
            loading={salesLoading} 
          />
        </div>

        {/* Top Products */}
        <div>
          <TopProductsTable 
            data={topProductsData?.topProducts} 
            loading={topProductsLoading} 
          />
        </div>

        {/* Order Status */}
        <div>
          <OrderStatusChart 
            data={metricsData?.salesMetrics?.orders?.statusBreakdown} 
            loading={metricsLoading} 
          />
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
