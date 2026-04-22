"use client";
import React, { useEffect } from "react";
import { 
  Navigation, 
  Package, 
  Map, 
  BarChart,
  Bell,
  Clock,
  MessageCircle,
  User
} from "lucide-react";

import { TabType } from '../lib/types';

interface NavigationTabsProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  isMobile: boolean;
  newDeliveriesCount: number;
}

const TABS_WITH_ICONS: TabType[] = [
  { 
    id: 0, 
    label: "New", 
    icon: <Bell />,
    desktopLabel: "New Deliveries",
    hasNotification: true 
  },
  { 
    id: 1, 
    label: "Active", 
    icon: <Package />,
    desktopLabel: "Active Deliveries" 
  },
  { 
    id: 2, 
    label: "History", 
    icon: <Clock />,
    desktopLabel: "Payment History" 
  },
  { 
    id: 3, 
    label: "Messages", 
    icon: <MessageCircle />,
    desktopLabel: "Messages" 
  },
  { 
    id: 4, 
    label: "Profile", 
    icon: <User/>,
    desktopLabel: "User Profile" 
  }
];

export default function NavigationTabs({ 
  activeTab, 
  setActiveTab, 
  isMobile, 
  newDeliveriesCount 
}: NavigationTabsProps) {
  
  // Optional: Add keyboard navigation for better UX
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle if no input/textarea is focused
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Number keys 1-5 for tab navigation - FIXED: use string keys
      const keyToTab: Record<string, number> = {
        '0': 0,
        '1': 1,
        '2': 2,
        '3': 3,
        '4': 4
      };
      
      if (keyToTab[event.key]) {
        event.preventDefault();
        setActiveTab(keyToTab[event.key]);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [setActiveTab]);

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center px-1 py-2">
          {TABS_WITH_ICONS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex flex-col items-center justify-center p-1 rounded-lg transition-all w-14
                ${activeTab === tab.id
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-lime-600 hover:text-emerald-700 hover:bg-emerald-50"
                }
              `}
              aria-label={tab.desktopLabel || tab.label}
              title={tab.desktopLabel || tab.label}
            >
              <div className="relative">
                {React.cloneElement(tab.icon as React.ReactElement, { 
                  size: 20,
                  className: activeTab === tab.id ? "text-emerald-600" : "text-lime-600"
                })}
                {tab.hasNotification && newDeliveriesCount > 0 && activeTab !== tab.id && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center animate-pulse">
                    {newDeliveriesCount > 9 ? '9+' : newDeliveriesCount}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium mt-0.5 ${activeTab === tab.id ? "text-emerald-600" : "text-lime-600"}`}>
                {tab.label}
              </span>
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
          <nav className="flex" role="tablist" aria-label="Navigation Tabs">
            {TABS_WITH_ICONS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                className={`
                  flex-1 px-4 py-3 border-b-2 font-medium text-sm lg:text-base flex items-center justify-center gap-2 transition-all
                  ${activeTab === tab.id
                    ? "border-lime-600 text-lime-600 bg-lime-50"
                    : "border-transparent text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50"
                  }
                `}
              >
                {React.cloneElement(tab.icon as React.ReactElement, { 
                  size: 20,
                  className: activeTab === tab.id ? "text-lime-600" : "text-emerald-600"
                })}
                <span>{tab.desktopLabel}</span>
                {tab.hasNotification && newDeliveriesCount > 0 && activeTab !== tab.id && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {newDeliveriesCount > 99 ? '99+' : newDeliveriesCount}
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
