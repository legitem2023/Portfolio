// components/SortDropdown.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SortOption {
  value: string;
  label: string;
  direction?: 'asc' | 'desc';
}

interface SortDropdownProps {
  options: SortOption[];
  onSortChange: (option: SortOption) => void;
  defaultOption?: SortOption;
  className?: string;
}

export default function SortDropdown({
  options,
  onSortChange,
  defaultOption,
  className = ""
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SortOption>(
    defaultOption || options[0]
  );

  const handleOptionClick = (option: SortOption) => {
    setSelectedOption(option);
    onSortChange(option);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium">Sort by: {selectedOption.label}</span>
        <ChevronDown 
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option)}
                className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                <span>{option.label}</span>
                {selectedOption.value === option.value && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
