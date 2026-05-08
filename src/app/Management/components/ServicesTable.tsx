"use client";

import { useState } from "react";
import service from "./Json/service.json";

// Type definition for TypeScript
type Service = {
  name: string;
  service: string;
  payment_period: string;
  cost: string;
  upgradable: string;
  inuse: string;
};

export default function ServicesTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const data = service as Service[];

  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCostEstimate = data.reduce((total, item) => {
    const costMatch = item.cost.match(/\$(\d+(?:\.\d+)?)/);
    if (costMatch && item.inuse === "Yes") {
      return total + parseFloat(costMatch[1]);
    }
    return total;
  }, 0);

  const totalAllCostEstimate = data.reduce((total, item) => {
    const costMatch = item.cost.match(/\$(\d+(?:\.\d+)?)/);
    if (costMatch) {
      return total + parseFloat(costMatch[1]);
    }
    return total;
  }, 0);

  const totalunuseCostEstimate = data.reduce((total, item) => {
    const costMatch = item.cost.match(/\$(\d+(?:\.\d+)?)/);
    if (costMatch && item.inuse === "No") {
      return total + parseFloat(costMatch[1]);
    }
    return total;
  }, 0);

  // Format currency helper
  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">
          Services & Infrastructure
        </h1>
        <p className="text-sm text-gray-500">
          Track your subscriptions, payment methods, and API services
        </p>
      </div>

      {/* Stats Bar - Professional Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Total Services */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Services
            </p>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {data.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">active subscriptions</p>
        </div>

        {/* In Use / Active */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Active Services
            </p>
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-emerald-600 mt-2">
            {data.filter((s) => s.inuse === "Yes").length}
          </p>
          <p className="text-xs text-gray-400 mt-1">currently in use</p>
        </div>

        {/* Upgradable */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Upgradable
            </p>
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-amber-600 mt-2">
            {data.filter((s) => s.upgradable === "Yes").length}
          </p>
          <p className="text-xs text-gray-400 mt-1">plans available</p>
        </div>

        {/* Used Monthly Estimate */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Active Monthly Cost
            </p>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${formatCurrency(totalCostEstimate)}
          </p>
          <p className="text-xs text-gray-400 mt-1">monthly estimate</p>
        </div>

        {/* All Monthly Estimate */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Monthly Cost
            </p>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${formatCurrency(totalAllCostEstimate)}
          </p>
          <p className="text-xs text-gray-400 mt-1">includes all services</p>
        </div>

        {/* Unused Monthly Estimate */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Idle Monthly Cost
            </p>
            <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">
            ${formatCurrency(totalunuseCostEstimate)}
          </p>
          <p className="text-xs text-gray-400 mt-1">potential savings</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Upgradable
              </th>
              <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.map((item, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {item.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                  {item.service}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                  <span className="capitalize">{item.payment_period}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                  {item.cost}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  {item.upgradable === "Yes" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>
                      None
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  {item.inuse === "Yes" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>
                      Inactive
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm">No services found</p>
            <p className="text-xs mt-1">Try adjusting your search</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredData.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-base">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.service}</p>
              </div>
              {item.inuse === "Yes" ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                  Inactive
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Period
                </p>
                <p className="text-gray-800 font-medium mt-0.5 capitalize">
                  {item.payment_period}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Upgradable
                </p>
                <p className="text-gray-800 font-medium mt-0.5">
                  {item.upgradable === "Yes" ? "✓ Available" : "—"}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Cost
              </p>
              <p className="text-base font-bold text-gray-900 mt-0.5">
                {item.cost}
              </p>
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-gray-200">
            <p className="text-sm">No services found</p>
          </div>
        )}
      </div>
    </div>
  );
            }
