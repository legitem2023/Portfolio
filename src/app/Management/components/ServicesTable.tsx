"use client";

import { useState } from "react";
import service from ".Json/service.json";

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

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Services & Infrastructure
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Track your subscriptions, payment methods, and API services
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Services</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">{data.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400">In Use</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {data.filter((s) => s.inuse === "Yes").length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400">Upgradable</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {data.filter((s) => s.upgradable === "Yes").length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Estimate</p>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
            ~${totalCostEstimate}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or service..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Service
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Period
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Upgradable
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                In Use
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredData.map((item, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {item.service}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {item.payment_period}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                  <span title={item.cost}>{item.cost}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.upgradable === "Yes"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {item.upgradable}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.inuse === "Yes"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {item.inuse}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No services found
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredData.map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                {item.name}
              </h3>
              <span
                className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                  item.inuse === "Yes"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {item.inuse === "Yes" ? "In Use" : "Not Used"}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {item.service}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Period</p>
                <p className="text-gray-800 dark:text-white">{item.payment_period}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Upgradable</p>
                <p className="text-gray-800 dark:text-white">{item.upgradable}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Cost</p>
              <p className="text-sm text-gray-800 dark:text-white break-words">
                {item.cost}
              </p>
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No services found
          </div>
        )}
      </div>
    </div>
  );
}
