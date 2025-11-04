// components/BellBadge.tsx
import React from 'react';

interface BellBadgeProps {
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  pulse?: boolean;
  className?: string;
  children?: React.ReactNode; // Make this optional with ?
}

const BellBadge: React.FC<BellBadgeProps> = ({
  count,
  maxCount = 99,
  showZero = false,
  variant = 'default',
  size = 'md',
  pulse = false,
  className = '',
  children // Now optional
}) => {
  if ((count === 0 || count === null || count === undefined) && !showZero && !children) {
    return null;
  }

  const displayCount = count && count > maxCount ? `${maxCount}+` : count;

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg'
  };

  const variantClasses = {
    default: 'bg-blue-500 text-white',
    primary: 'bg-indigo-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-500 text-white',
    info: 'bg-cyan-500 text-white',
    dark: 'bg-gray-700 text-white',
    light: 'bg-gray-200 text-gray-800'
  };

  const baseClasses = `
    bell-badge
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${pulse ? 'pulse' : ''}
    ${className}
  `.trim();

  return (
    <div className={baseClasses}>
      {children || displayCount}
    </div>
  );
};

export default BellBadge;
