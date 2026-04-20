'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { SALES_METRICS_QUERY, SALES_DATA_QUERY, TOP_PRODUCTS_QUERY } from '../../components/graphql/query';
import { Timeframe, GroupBy, SalesFilters } from '../../../../types/sales';
import SalesMetricsCards from './SalesMetricsCards';
import RevenueChart from './sales/RevenueChart';
import TopProductsTable from './sales/TopProductsTable';
import OrderStatusChart from './sales/OrderStatusChart';
import TimeframeSelector from './sales/TimeframeSelector';
import { useAuth } from '../hooks/useAuth';

const SalesDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('LAST_30_DAYS');
  const [groupBy, setGroupBy] = useState<GroupBy>('DAILY');
  const [filters, setFilters] = useState<SalesFilters>({});
  const { user, loading: authLoading } = useAuth();

  // Create effective filters that include the supplierId from the authenticated user
  const effectiveFilters = React.useMemo(() => {
    if (!user?.userId) return filters;
    
    return {
      ...filters,
      supplierId: user.userId // Add supplierId filter from the logged-in user
    };
  }, [filters, user?.userId]);

  // Skip queries if auth is still loading or no user is logged in
  const shouldSkipQueries = authLoading || !user?.userId;

  const { 
    data: metricsData, 
    loading: metricsLoading, 
    error: metricsError,
    refetch: refetchMetrics 
  } = useQuery(SALES_METRICS_QUERY, {
    variables: { timeframe, filters: effectiveFilters },
    fetchPolicy: 'cache-and-network',
    skip: shouldSkipQueries,
  });

  const { 
    data: salesData, 
    loading: salesLoading, 
    error: salesError,
    refetch: refetchSales 
  } = useQuery(SALES_DATA_QUERY, {
    variables: { timeframe, groupBy, filters: effectiveFilters },
    fetchPolicy: 'cache-and-network',
    skip: shouldSkipQueries,
  });

  const { 
    data: topProductsData, 
    loading: topProductsLoading, 
    error: topProductsError,
    refetch: refetchTopProducts 
  } = useQuery(TOP_PRODUCTS_QUERY, {
    variables: { timeframe, limit: 10, filters: effectiveFilters },
    fetchPolicy: 'cache-and-network',
    skip: shouldSkipQueries,
  });

  // Refetch data when timeframe, groupBy, filters, or effectiveFilters change
  useEffect(() => {
    if (!shouldSkipQueries) {
      refetchMetrics();
      refetchSales();
      refetchTopProducts();
    }
  }, [timeframe, groupBy, effectiveFilters, shouldSkipQueries, refetchMetrics, refetchSales, refetchTopProducts]);

  // Show loading state while authentication is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if no user is logged in
  if (!user?.userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h3 className="text-yellow-800 font-semibold text-lg">Authentication Required</h3>
          <p className="text-yellow-600 text-sm mt-2">
            Please log in to view sales analytics.
          </p>
        </div>
      </div>
    );
  }

  // Show error states for failed queries
  if (metricsError || salesError || topProductsError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold text-base sm:text-lg">Error loading sales data</h3>
          <p className="text-red-600 text-sm mt-1">
            {metricsError?.message || salesError?.message || topProductsError?.message}
          </p>
          <button 
            onClick={() => {
              refetchMetrics();
              refetchSales();
              refetchTopProducts();
            }}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Monitor your business performance and growth
              {user?.businessName && <span className="text-gray-500"> - {user.businessName}</span>}
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <TimeframeSelector
              timeframe={timeframe}
              groupBy={groupBy}
              filters={filters}
              onTimeframeChange={setTimeframe}
              onGroupByChange={setGroupBy}
              onFiltersChange={setFilters}
            />
          </div>
        </div>

        {/* Metrics Cards */}
        <SalesMetricsCards 
          data={metricsData?.salesMetrics} 
          loading={metricsLoading} 
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Revenue Chart - Full width on all devices */}
          <div className="w-full">
            <RevenueChart 
              data={salesData?.salesData} 
              loading={salesLoading} 
            />
          </div>

          {/* Bottom Charts - Stack on mobile, side by side on larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Top Products */}
            <div className="w-full">
              <TopProductsTable 
                data={topProductsData?.topProducts} 
                loading={topProductsLoading} 
              />
            </div>

            {/* Order Status */}
            <div className="w-full">
              <OrderStatusChart 
                data={metricsData?.salesMetrics?.orders?.statusBreakdown} 
                loading={metricsLoading} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
