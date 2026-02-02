"use client";
import { TABS } from '../utils/constants';

interface NavigationTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile: boolean;
  newDeliveriesCount: number;
}

export default function NavigationTabs({ 
  activeTab, 
  setActiveTab, 
  isMobile, 
  newDeliveriesCount 
}: NavigationTabsProps) {
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center px-1 py-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex flex-col items-center justify-center p-1 rounded-lg transition-all w-14
                ${activeTab === tab.id
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600"
                }
              `}
            >
              <div className="relative">
                {isMobile 
                  ? React.cloneElement(tab.icon as React.ReactElement, { size: 20 })
                  : tab.icon
                }
                {tab.hasNotification && newDeliveriesCount > 0 && activeTab !== tab.id && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center">
                    {newDeliveriesCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 px-4 py-3 border-b-2 font-medium text-sm lg:text-base flex items-center justify-center gap-2 transition-all
                  ${activeTab === tab.id
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                {tab.icon}
                <span>{tab.desktopLabel}</span>
                {tab.hasNotification && newDeliveriesCount > 0 && activeTab !== tab.id && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {newDeliveriesCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
