// components/ui/LuxuryTabs.tsx
'use client';

import { useState } from 'react';
import { Tab, LuxuryTabsProps } from '../../../../types';

const LuxuryTabs: React.FC<LuxuryTabsProps> = ({ tabs, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className="w-full">
      {/* Desktop Tabs - Looks like navigation but functions as tabs */}
      <div className="hidden lg:block">
        <div className="border-b border-golden-200/30 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab: Tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'border-golden-500 text-golden-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {tab.icon && <span>{tab.icon}</span>}
                  <span className="font-serif">{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tablet Tabs - Slightly different style */}
      <div className="hidden md:block lg:hidden mb-6">
        <div className="flex space-x-4 overflow-x-auto py-2">
          {tabs.map((tab: Tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-golden-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {tab.icon && <span>{tab.icon}</span>}
                <span className="font-serif">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Select */}
      <div className="md:hidden mb-6">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="block w-full pl-3 pr-10 py-3 text-base border-2 border-golden-300/50 focus:outline-none focus:ring-2 focus:ring-golden-500 focus:border-golden-500 sm:text-sm rounded-lg bg-white/95 backdrop-blur-sm"
        >
          {tabs.map((tab: Tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {tabs.find((tab: Tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default LuxuryTabs;
