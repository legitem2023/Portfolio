// components/DeluxeTabs.tsx
import React, { useState } from 'react';
import { 
  ChevronRight,
  CheckCircle,
  ShoppingCart,
  Truck,
  CreditCard,
  Package
} from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  disabled?: boolean;
}

interface DeluxeTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  showProgress?: boolean;
}

const DeluxeTabs: React.FC<DeluxeTabsProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = '',
  showProgress = true
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
  const progress = ((activeIndex + 1) / tabs.length) * 100;

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 border border-gray-100 ${className}`}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Order Progress</span>
            <span className="text-sm font-semibold text-purple-600">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-purple-600 to-indigo-700 h-2.5 rounded-full transition-all duration-700 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex flex-col md:flex-row gap-4">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const isCompleted = index < activeIndex;
          const isDisabled = tab.disabled && !isActive && !isCompleted;
          
          return (
            <div
              key={tab.id}
              className={`flex-1 relative group ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              onMouseEnter={() => !isDisabled && setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <div
                className={`flex items-center p-4 rounded-xl border-2 transition-all duration-300 ${
                  isActive
                    ? 'border-purple-600 bg-purple-50 shadow-md'
                    : isCompleted
                    ? 'border-emerald-500 bg-emerald-50'
                    : isDisabled
                    ? 'border-gray-200 bg-gray-100'
                    : 'border-gray-200 bg-white hover:border-purple-400 hover:shadow-sm'
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 transition-colors ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle size={20} />
                  ) : (
                    <tab.icon size={20} />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isActive
                        ? 'text-purple-900'
                        : isCompleted
                        ? 'text-emerald-900'
                        : 'text-gray-700 group-hover:text-purple-700'
                    }`}
                  >
                    {tab.label}
                  </div>
                  <div
                    className={`text-xs ${
                      isActive
                        ? 'text-purple-600'
                        : isCompleted
                        ? 'text-emerald-600'
                        : 'text-gray-500 group-hover:text-purple-500'
                    }`}
                  >
                    {isCompleted ? 'Completed' : isActive ? 'Current' : 'Pending'}
                  </div>
                </div>
                
                {/* Arrow for active tab */}
                {isActive && (
                  <div className="text-purple-600">
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
              
              {/* Connector line between tabs */}
              {index < tabs.length - 1 && (
                <div
                  className={`hidden md:block absolute top-1/2 right-0 transform translate-x-full -translate-y-1/2 w-8 h-0.5 ${
                    index < activeIndex ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                ></div>
              )}
              
              {/* Hover effect */}
              {hoveredTab === tab.id && !isActive && !isDisabled && (
                <div className="absolute inset-0 rounded-xl bg-purple-600 bg-opacity-5 border-2 border-purple-400 pointer-events-none"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Example usage with cart stages
export const CartStagesTabs: React.FC<{ currentStage: string; onStageChange: (stage: string) => void }> = ({
  currentStage,
  onStageChange
}) => {
  const cartStages: Tab[] = [
    {
      id: 'cart',
      label: 'Shopping Cart',
      icon: ShoppingCart
    },
    {
      id: 'shipping',
      label: 'Shipping',
      icon: Truck
    },
    {
      id: 'payment',
      label: 'Payment',
      icon: CreditCard
    },
    {
      id: 'confirmation',
      label: 'Confirmation',
      icon: Package
    }
  ];

  return (
    <DeluxeTabs
      tabs={cartStages}
      activeTab={currentStage}
      onTabChange={onStageChange}
      className="mb-8"
    />
  );
};

export default DeluxeTabs;
