// components/ui/BellBadge.tsx
import React from 'react';

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
    sm: 'w-5 h-6 text-[10px] -top-1 -right-1',
    md: 'w-6 h-7 text-xs -top-1 -right-1',
    lg: 'w-8 h-9 text-sm -top-1 -right-1',
    xl: 'w-10 h-11 text-base -top-2 -right-2'
  };

  const variantClasses = {
    default: 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-blue-200',
    primary: 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-indigo-200',
    success: 'bg-gradient-to-b from-green-500 to-green-600 text-white shadow-green-200',
    warning: 'bg-gradient-to-b from-yellow-500 to-yellow-600 text-white shadow-yellow-200',
    danger: 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-red-200',
    info: 'bg-gradient-to-b from-cyan-500 to-cyan-600 text-white shadow-cyan-200',
    dark: 'bg-gradient-to-b from-gray-700 to-gray-800 text-white shadow-gray-200',
    light: 'bg-gradient-to-b from-gray-200 to-gray-300 text-gray-800 shadow-gray-100'
  };

  const clapperColors = {
    default: 'bg-blue-700',
    primary: 'bg-indigo-700',
    success: 'bg-green-700',
    warning: 'bg-yellow-700',
    danger: 'bg-red-700',
    info: 'bg-cyan-700',
    dark: 'bg-gray-900',
    light: 'bg-gray-400'
  };

  const baseClasses = `
    absolute
    flex
    items-center
    justify-center
    font-bold
    rounded-full
    border-2
    border-white
    shadow-lg
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${pulse ? 'animate-pulse' : ''}
    ${className}
  `.trim();

  return (
    <div className={`relative ${sizeClasses[size].split(' ')[0]} ${sizeClasses[size].split(' ')[1]}`}>
      {/* Bell Body */}
      <div className={`
        absolute
        w-full
        h-full
        rounded-b-[50%]
        rounded-t-[30%]
        border-2
        border-white
        shadow-inner
        ${variantClasses[variant].split(' ')[0]}
        ${variantClasses[variant].split(' ')[1]}
      `}>
        {/* Bell Dome Highlight */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-1 bg-white/30 rounded-full" />
        
        {/* Bell Clapper */}
        <div className={`
          absolute
          bottom-0
          left-1/2
          transform
          -translate-x-1/2
          w-1
          h-2
          rounded-full
          ${clapperColors[variant]}
        `} />
      </div>
      
      {/* Count/Content */}
      <div className={baseClasses}>
        {children || displayCount}
      </div>
    </div>
  );
};

export default BellBadge;
