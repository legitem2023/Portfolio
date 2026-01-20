import React, { useState } from 'react';
import { useQuery, gql } from '@apollo/client';

// GraphQL Query - Fixed to match your actual schema
const GET_API_BILLS = gql`
  query GetApiBills(
    $filters: ApiBillFilters
    $pagination: PaginationInput
    $sort: SortInput
  ) {
    apiBills(filters: $filters, pagination: $pagination, sort: $sort) {
      items {
        id
        service
        apiName
        month
        year
        period
        amount
        currency
        usage
        status
        paidAt
        dueDate
        invoiceId
        invoiceUrl
        tags
        createdAt
        updatedAt
      }
      total
      page
      pageSize
      hasNext
    }
  }
`;

interface UsageMetrics {
    requests: number;
    successful: number;
    failed: number;
    dataProcessed: number;
    rate: number;
    customFields: any
  }



// TypeScript Interfaces
interface ApiBill {
  id: string;
  service: string;
  apiName: string;
  month: number;
  year: number;
  period: string;
  amount: number;
  currency: string;
  usage?: string;
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: string;
  dueDate: string;
  invoiceId?: string;
  invoiceUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ApiBillFilters {
  service?: string;
  year?: number;
  month?: number;
  status?: 'pending' | 'paid' | 'overdue';
  tags?: string[];
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

interface PaginationInput {
  page?: number;
  pageSize?: number;
}

interface SortInput {
  field?: 'DUE_DATE' | 'AMOUNT' | 'CREATED_AT' | 'UPDATED_AT';
  order?: 'ASC' | 'DESC';
}

interface ApiBillList {
  items: ApiBill[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

interface GetApiBillsResponse {
  apiBills: ApiBillList;
}

const ApiBillsComponent: React.FC = () => {
  const [filters, setFilters] = useState<ApiBillFilters>({});
  const [pagination, setPagination] = useState<PaginationInput>({ 
    page: 1, 
    pageSize: 10 
  });
  const [sort, setSort] = useState<SortInput>({ 
    field: 'DUE_DATE', 
    order: 'DESC' 
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery<GetApiBillsResponse>(
    GET_API_BILLS,
    {
      variables: { filters, pagination, sort },
      fetchPolicy: 'cache-and-network',
    }
  );

  // Handler Functions
  const handleServiceFilter = (service: string) => {
    setFilters(prev => ({
      ...prev,
      service: service || undefined,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    const validStatus = status as 'pending' | 'paid' | 'overdue' | '';
    setFilters(prev => ({
      ...prev,
      status: validStatus || undefined,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleAmountFilter = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    setFilters(prev => ({
      ...prev,
      [type === 'min' ? 'minAmount' : 'maxAmount']: numValue,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDateFilter = (type: 'from' | 'to', value: string) => {
    setFilters(prev => ({
      ...prev,
      [type === 'from' ? 'fromDate' : 'toDate']: value || undefined,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination({ page: 1, pageSize: size });
  };

  const handleSort = (field: SortInput['field']) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'ASC' ? 'DESC' : 'ASC',
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setPagination({ page: 1, pageSize: 10 });
    setSort({ field: 'DUE_DATE', order: 'DESC' });
  };

  // Loading and Error States
  if (loading && !data) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading bills...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4" role="alert">
        <strong>Error:</strong> {error.message}
      </div>
    );
  }

  const apiBillsData = data?.apiBills;
  const bills = apiBillsData?.items || [];
  const currentPage = pagination.page || 1;
  const pageSize = pagination.pageSize || 10;
  const totalPages = apiBillsData ? Math.ceil(apiBillsData.total / pageSize) : 1;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">API Bills Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage and monitor all your API service bills</p>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filter Sidebar */}
        <div className={`lg:w-1/4 ${isFilterOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Service Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
                <select 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => handleServiceFilter(e.target.value)}
                  value={filters.service || ''}
                >
                  <option value="">All Services</option>
                  <option value="Stripe">Stripe</option>
                  <option value="AWS">AWS</option>
                  <option value="Twilio">Twilio</option>
                  <option value="SendGrid">SendGrid</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  value={filters.status || ''}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => handleAmountFilter('min', e.target.value)}
                    value={filters.minAmount || ''}
                  />
                  <input 
                    type="number" 
                    placeholder="Max" 
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => handleAmountFilter('max', e.target.value)}
                    value={filters.maxAmount || ''}
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="space-y-3">
                  <input 
                    type="date" 
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => handleDateFilter('from', e.target.value)}
                    value={filters.fromDate || ''}
                  />
                  <input 
                    type="date" 
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => handleDateFilter('to', e.target.value)}
                    value={filters.toDate || ''}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
                <button 
                  onClick={clearFilters}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 rounded-lg transition duration-200"
                >
                  Clear All Filters
                </button>
                <button 
                  onClick={() => refetch()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition duration-200"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:w-3/4">
          {/* Stats and Controls */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Bills Overview</h2>
                {apiBillsData && (
                  <p className="text-gray-600 mt-1">
                    Showing <span className="font-semibold">{bills.length}</span> of{' '}
                    <span className="font-semibold">{apiBillsData.total}</span> total bills
                  </p>
                )}
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="lg:hidden flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
                </button>
                <select 
                  className="rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                  value={pagination.pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bills Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('DUE_DATE')}
                    >
                      <div className="flex items-center gap-1">
                        Due Date
                        {sort.field === 'DUE_DATE' && (
                          <span>{sort.order === 'ASC' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('AMOUNT')}
                    >
                      <div className="flex items-center gap-1">
                        Amount
                        {sort.field === 'AMOUNT' && (
                          <span>{sort.order === 'ASC' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bills.length > 0 ? (
                    bills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(bill.dueDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-semibold">
                                {bill.service.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{bill.service}</div>
                              <div className="text-sm text-gray-500">{bill.apiName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ${bill.amount.toFixed(2)} <span className="text-gray-500 text-xs">{bill.currency}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            bill.status === 'paid' 
                              ? 'bg-green-100 text-green-800'
                              : bill.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {bill.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium hidden lg:table-cell">
                          <button className="text-blue-600 hover:text-blue-900 mr-4">View</button>
                          {bill.invoiceUrl && (
                            <a 
                              href={bill.invoiceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Download
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-400 mb-4">
                          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No bills found</h3>
                        <p className="text-gray-600">Try adjusting your filters to find what youre looking for.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {apiBillsData && apiBillsData.total > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Page <span className="font-semibold">{currentPage}</span> of{' '}
                    <span className="font-semibold">{totalPages}</span>
                    {apiBillsData.hasNext && (
                      <span className="ml-2 text-blue-600">• Has next page</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiBillsComponent;
