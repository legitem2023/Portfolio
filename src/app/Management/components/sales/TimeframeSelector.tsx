'use client';

import React from 'react';
import { Timeframe, GroupBy, SalesFilters } from '../../../../types/sales';
import { getTimeframeLabel } from '../../../../utils/salesUtils';

interface TimeframeSelectorProps {
  timeframe: Timeframe;
  groupBy: GroupBy;
  filters: SalesFilters;
  onTimeframeChange: (timeframe: Timeframe) => void;
  onGroupByChange: (groupBy: GroupBy) => void;
  onFiltersChange: (filters: SalesFilters) => void;
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  timeframe,
  groupBy,
  filters,
  onTimeframeChange,
  onGroupByChange,
  onFiltersChange,
}) => {
  const timeframes: Timeframe[] = [
    'TODAY',
    'YESTERDAY',
    'LAST_7_DAYS',
    'LAST_30_DAYS',
    'THIS_MONTH',
    'LAST_MONTH',
    'THIS_QUARTER',
    'LAST_QUARTER',
    'THIS_YEAR',
    'LAST_YEAR',
  ];

  const groupByOptions: { value: GroupBy; label: string }[] = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'REFUNDED', label: 'Refunded' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Timeframe Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
        <select
          value={timeframe}
          onChange={(e) => onTimeframeChange(e.target.value as Timeframe)}
          className="block w-40 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
        >
          {timeframes.map((tf) => (
            <option key={tf} value={tf}>
              {getTimeframeLabel(tf)}
            </option>
          ))}
        </select>
      </div>

      {/* Group By Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
        <select
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as GroupBy)}
          className="block w-32 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
        >
          {groupByOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          value={filters.status || ''}
          onChange={(e) => onFiltersChange({
            ...filters,
            status: e.target.value as any || undefined
          })}
          className="block w-40 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TimeframeSelector;
