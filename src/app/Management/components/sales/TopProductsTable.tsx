'use client';

import React from 'react';
import { ProductSales } from '../../../../../types/sales';
import { formatCurrency, formatNumber } from '../../../../../utils/salesUtils';

interface TopProductsTableProps {
  data?: ProductSales[];
  loading: boolean;
}

const TopProductsTable: React.FC<TopProductsTableProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const products = data || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h3>
      
      {products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No product data available for the selected timeframe.
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product, index) => (
            <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                    {product.productName}
                  </h4>
                  <p className="text-gray-500 text-xs">
                    {formatNumber(product.unitsSold)} units
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 text-sm">
                  {formatCurrency(product.revenue)}
                </p>
                <p className="text-green-600 text-xs font-medium">
                  {product.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopProductsTable;
