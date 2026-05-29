import React, { ReactNode } from 'react';
import { Bell, RefreshCw } from 'lucide-react';

interface ParentTabProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  onRefresh?: () => void;
  showRefresh?: boolean;
  children?: ReactNode;
  className?: string;
}

const ParentTab: React.FC<ParentTabProps> = ({
  title,
  description,
  icon,
  onRefresh,
  showRefresh = true,
  children,
  className = '',
}) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div className={className}>
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2">
            {icon || <Bell size={isMobile ? 20 : 24} className="text-orange-500" />}
            <span>{title}</span>
          </h1>
          {description && (
            <p className="text-sm sm:text-base text-gray-600">{description}</p>
          )}
        </div>
        
        {showRefresh && onRefresh && (
          <button 
            onClick={onRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        )}
      </div>

      {/* Tab Section */}
      {children && (
        <div className="mb-6 border-b border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default ParentTab;
