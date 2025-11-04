// components/ui/BellBadge.tsx
import React from 'react';
import { Bell } from 'lucide-react';

interface BellBadgeProps {
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  pulse?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const BellBadge: React.FC<BellBadgeProps> = ({
  count,
  maxCount = 99,
  showZero = false,
  variant = 'default',
  size = 'md',
  pulse = false,
  className = '',
  children
}) => {
  // Don't render if count is 0 and showZero is false
  if ((count === 0 || count === null || count === undefined) && !showZero && !children) {
    return null;
  }

  const displayCount = count && count > maxCount ? `${maxCount}+` : count;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20
  };

  const variantClasses = {
    default: 'text-blue-600',
    primary: 'text-indigo-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-cyan-600',
    dark: 'text-gray-700',
    light: 'text-gray-400'
  };

  const countSizeClasses = {
    sm: 'text-[8px] min-w-[14px] h-[14px] -top-1 -right-2',
    md: 'text-[10px] min-w-[16px] h-[16px] -top-1 -right-2',
    lg: 'text-xs min-w-[18px] h-[18px] -top-1 -right-2',
    xl: 'text-sm min-w-[20px] h-[20px] -top-2 -right-3'
  };

  const countVariantClasses = {
    default: 'bg-blue-500 text-white border-white',
    primary: 'bg-indigo-500 text-white border-white',
    success: 'bg-green-500 text-white border-white',
    warning: 'bg-yellow-500 text-white border-white',
    danger: 'bg-red-500 text-white border-white',
    info: 'bg-cyan-500 text-white border-white',
    dark: 'bg-gray-700 text-white border-white',
    light: 'bg-gray-400 text-white border-white'
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Bell Icon */}
      <Bell 
        size={iconSizes[size]} 
        className={`
          ${variantClasses[variant]}
          ${pulse ? 'animate-pulse' : ''}
          drop-shadow-sm
        `} 
      />
      
      {/* Count Badge */}
      <div className={`
        absolute
        flex
        items-center
        justify-center
        rounded-full
        border-2
        font-bold
        ${countSizeClasses[size]}
        ${countVariantClasses[variant]}
        ${pulse ? 'animate-bounce' : ''}
      `}>
        {children || displayCount}
      </div>
    </div>
  );
};

export default BellBadge;
