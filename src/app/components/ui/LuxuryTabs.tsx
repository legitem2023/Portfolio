// components/ui/LuxuryTabs.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tab, LuxuryTabsProps } from '../../types';

const LuxuryTabs: React.FC<LuxuryTabsProps> = ({ tabs, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const router = useRouter();

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Update URL without page refresh
    router.push(`/?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="w-full">
      {/* Desktop Tabs */}
      <div className="hidden lg:block">
        <div className="border-b border-golden-200/30 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab: Tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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

      {/* Mobile/Tablet Select */}
      <div className="lg:hidden mb-6">
        <select
          value={activeTab}
          onChange={(e) => handleTabChange(e.target.value)}
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
