// components/SearchSortBar.tsx
'use client';

import SearchInput from './SearchInput';
import SortDropdown, { SortOption } from './SortDropdown';

interface SearchSortBarProps {
  searchPlaceholder?: string;
  sortOptions: SortOption[];
  onSearch: (query: string) => void;
  onSortChange: (option: SortOption) => void;
  className?: string;
}

export default function SearchSortBar({
  searchPlaceholder = "Search...",
  sortOptions,
  onSearch,
  onSortChange,
  className = ""
}: SearchSortBarProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${className}`}>
      <div className="flex-1 w-full sm:max-w-md">
        <SearchInput
          placeholder={searchPlaceholder}
          onSearch={onSearch}
        />
      </div>
      
      <SortDropdown
        options={sortOptions}
        onSortChange={onSortChange}
      />
    </div>
  );
}
