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

  
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Services & Infrastructure
        </h1>
        <p className="text-gray-600">
          Track your subscriptions, payment methods, and API services
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500">Total Services</p>
          <p className="text-xl font-bold text-gray-800">{data.length}</p>
        </div>
        <div className="bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500">In Use</p>
          <p className="text-xl font-bold text-green-600">
            {data.filter((s) => s.inuse === "Yes").length}
          </p>
        </div>
        <div className="bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500">Upgradable</p>
          <p className="text-xl font-bold text-blue-600">
            {data.filter((s) => s.upgradable === "Yes").length}
          </p>
        </div>
        <div className="bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500">Used Monthly Estimate</p>
          <p className="text-xl font-bold text-purple-600">
            ~${totalCostEstimate}
          </p>
        </div>
        <div className="bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500">All Monthly Estimate</p>
          <p className="text-xl font-bold text-purple-600">
            ~${totalAllCostEstimate}
          </p>
        </div>
        <div className="bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500">Unused Monthly Estimate</p>
          <p className="text-xl font-bold text-purple-600">
            ~${totalunuseCostEstimate}
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
          className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Upgradable
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                In Use
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((item, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.service}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.payment_period}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                  <span title={item.cost}>{item.cost}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold ${
                      item.upgradable === "Yes"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.upgradable}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold ${
                      item.inuse === "Yes"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-600"
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
          <div className="text-center py-8 text-gray-500">
            No services found
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredData.map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-4 shadow-sm border border-gray-200"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-gray-800 text-lg">
                {item.name}
              </h3>
              <span
                className={`inline-flex px-2 py-0.5 text-xs font-semibold ${
                  item.inuse === "Yes"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {item.inuse === "Yes" ? "In Use" : "Not Used"}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {item.service}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">Period</p>
                <p className="text-gray-800">{item.payment_period}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Upgradable</p>
                <p className="text-gray-800">{item.upgradable}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">Cost</p>
              <p className="text-sm text-gray-800 break-words">
                {item.cost}
              </p>
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No services found
          </div>
        )}
      </div>
    </div>
  );
}
