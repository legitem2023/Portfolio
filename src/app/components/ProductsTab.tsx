'use client';
import { useQuery, NetworkStatus } from '@apollo/client';
import { GETPRODUCTS, GETCATEGORY } from './graphql/query';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ProductThumbnails from '../components/ProductThumbnails';
import { Product, category } from '../../../types';
import ProductThumbnailsShimmer from "./ProductThumbnailsShimmer";
import { useSelector, useDispatch } from 'react-redux';
import { setSearchTerm, setCategoryFilter, setSortBy, clearAllFilters } from '../../../Redux/searchSlice';
import ColdStartErrorUI from './ColdStartErrorUI';
import CategoryPage from './CategoryPage';
import { Search, X, ArrowLeft, ChevronDown, Check, SlidersHorizontal, Filter } from 'lucide-react';

interface ProductsResponse {
  products: {
    items: any[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

// Modern Sort Dropdown Component
const ModernSortDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    { value: 'Sort by: Newest', label: 'Newest First' },
    { value: 'Sort by: Price: Low to High', label: 'Price: Low to High' },
    { value: 'Sort by: Price: High to Low', label: 'Price: High to Low' },
    { value: 'Sort by: Highest Rated', label: 'Highest Rated' },
  ];

  const selectedOption = sortOptions.find(opt => opt.value === value) || sortOptions[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group w-full px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm 
                   hover:border-purple-300 hover:shadow-md transition-all duration-200
                   flex items-center justify-between gap-2 text-sm font-medium text-gray-700"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
          <span className="hidden sm:inline">Sort:</span>
          <span className="text-gray-900">{selectedOption.label}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 
                      rounded-lg shadow-lg z-50 overflow-hidden animate-slideDown">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-150
                         flex items-center justify-between group hover:bg-purple-50
                         ${value === option.value ? 'bg-purple-50 text-purple-600' : 'text-gray-700'}`}
            >
              <span>{option.label}</span>
              {value === option.value && <Check size={16} className="text-purple-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Modern Category Filter Component
const ModernCategoryFilter: React.FC<{
  categories: category[];
  value: string;
  onChange: (value: string) => void;
}> = ({ categories, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedCategory = categories.find(cat => cat.id === value);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Category chips for quick selection
  const CategoryChips = () => (
    <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-gray-100">
      <button
        onClick={() => onChange('')}
        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200
                   ${value === '' 
                     ? 'bg-purple-600 text-white shadow-sm' 
                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
      >
        All
      </button>
      {categories.slice(0, 6).map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(category.id)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap
                     ${value === category.id 
                       ? 'bg-purple-600 text-white shadow-sm' 
                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Mobile: Dropdown button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-full px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm 
                   hover:border-purple-300 hover:shadow-md transition-all duration-200
                   flex items-center justify-between gap-2 text-sm font-medium text-gray-700"
      >
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <span>{selectedCategory ? selectedCategory.name : 'All Categories'}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Desktop: Category chips */}
      {/*<div className="hidden lg:block">
        <CategoryChips />
      </div>*/}

      {/* Mobile dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 
                      rounded-lg shadow-lg z-50 overflow-hidden lg:hidden">
          <div className="max-h-80 overflow-y-auto">
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm transition-colors duration-150
                         flex items-center justify-between hover:bg-purple-50
                         ${value === '' ? 'bg-purple-50 text-purple-600' : 'text-gray-700'}`}
            >
              <span>All Categories</span>
              {value === '' && <Check size={16} className="text-purple-600" />}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  onChange(category.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm transition-colors duration-150
                           flex items-center justify-between hover:bg-purple-50
                           ${value === category.id ? 'bg-purple-50 text-purple-600' : 'text-gray-700'}`}
              >
                <span>{category.name}</span>
                {value === category.id && <Check size={16} className="text-purple-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Active Filters Component
const ActiveFilters: React.FC<{
  searchTerm: string;
  categoryFilter: string;
  sortBy: string;
  categories: category[];
  onClearSearch: () => void;
  onClearCategory: () => void;
  onClearSort: () => void;
  onClearAll: () => void;
}> = ({ searchTerm, categoryFilter, sortBy, categories, onClearSearch, onClearCategory, onClearSort, onClearAll }) => {
  const hasActiveFilters = searchTerm || categoryFilter || sortBy !== 'Sort by: Newest';
  
  if (!hasActiveFilters) return null;
  
  const selectedCategory = categories.find(c => c.id === categoryFilter);
  const sortLabel = sortBy.replace('Sort by: ', '');
  
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs text-gray-500">Active filters:</span>
      
      {searchTerm && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
          <span>Search: {searchTerm}</span>
          <button onClick={onClearSearch} className="hover:bg-purple-100 rounded-full p-0.5">
            <X size={12} />
          </button>
        </span>
      )}
      
      {/*categoryFilter && selectedCategory && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
          <span>Category: {selectedCategory.name}</span>
          <button onClick={onClearCategory} className="hover:bg-purple-100 rounded-full p-0.5">
            <X size={12} />
          </button>
        </span>
      )*/}
      
      {sortBy !== 'Sort by: Newest' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
          <span>Sort: {sortLabel}</span>
          <button onClick={onClearSort} className="hover:bg-purple-100 rounded-full p-0.5">
            <X size={12} />
          </button>
        </span>
      )}
      
      <button
        onClick={onClearAll}
        className="text-xs text-gray-500 hover:text-gray-700 underline ml-1"
      >
        Clear all
      </button>
    </div>
  );
};

const ProductsTab: React.FC = () => {
  // Redux state and dispatch
  const dispatch = useDispatch();
  const { searchTerm, categoryFilter, sortBy } = useSelector((state: any) => state.search);
  
  // Local state (keep these as they're not part of global state)
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [itemsToFetch, setItemsToFetch] = useState(12);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Get categories
  const { data: categoryData, loading: categoryLoading } = useQuery(GETCATEGORY);
  const [categories, setCategories] = useState<category[]>([]);

  useEffect(() => {
    if (categoryData?.categories) {
      const categoriesData = categoryData.categories.map((data: any) => ({
        id: data.id,
        name: data.name,
        description: data.description,
        productCount: 0,
        status: data.isActive ? "Active" : "Inactive"
      }));
      setCategories(categoriesData);
    }
  }, [categoryData]);

  // Debounce search input
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => {  
      clearTimeout(timerId);  
    };
  }, [searchTerm]);

  // Focus search input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  // Memoize query variables to prevent unnecessary re-renders
  const queryVariables = React.useMemo(() => ({
    search: debouncedSearch,
    cursor: '',
    limit: 12,
    category: categoryFilter || undefined,
    sortBy: sortBy.replace('Sort by: ', '')
  }), [debouncedSearch, categoryFilter, sortBy]);

  // Use networkStatus to track loading states
  const { data, loading, error, fetchMore, refetch, networkStatus } = useQuery(GETPRODUCTS, {
    variables: queryVariables,
    notifyOnNetworkStatusChange: true,
  });

  // Check if we're currently refetching due to variable changes
  const isRefetching = networkStatus === NetworkStatus.refetch;
  // Check if we're fetching more products (pagination)
  const isFetchingMore = networkStatus === NetworkStatus.fetchMore;

  const products = data?.products?.items || [];
  const hasMore = data?.products?.hasMore || false;
 
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetchingMore) {
      // Set the number of items we expect to fetch
      setItemsToFetch(queryVariables.limit);
      
      fetchMore({
        variables: {
          ...queryVariables,
          cursor: data.products.nextCursor,
        },
        updateQuery: (prev: ProductsResponse, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;

          return {  
            products: {  
              ...fetchMoreResult.products,  
              items: [  
                ...prev.products.items,  
                ...fetchMoreResult.products.items,  
              ],  
            },  
          };  
        },  
      });  
    }
  }, [data, fetchMore, isFetchingMore, hasMore, queryVariables]);

  // Infinite scroll setup
  useEffect(() => {
    if (isFetchingMore || !hasMore) return;

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        handleLoadMore();
      }
    });

    if (sentinelRef.current) {
      observer.current.observe(sentinelRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleLoadMore, isFetchingMore, hasMore]);

  // Handler functions using Redux dispatch
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchTerm(e.target.value));
  };

  const handleCategoryChange = (value: string) => {
    dispatch(setCategoryFilter(value));
  };

  const handleSortChange = (value: string) => {
    dispatch(setSortBy(value));
  };

  const handleClearFilters = () => {
    dispatch(clearAllFilters());
  };

  const handleClearSearch = () => {
    dispatch(setSearchTerm(''));
  };

  const handleClearCategory = () => {
    dispatch(setCategoryFilter(''));
  };

  const handleClearSort = () => {
    dispatch(setSortBy('Sort by: Newest'));
  };

  const handleSearchFocus = () => {
    setIsSearchExpanded(true);
    setIsMobileSearchExpanded(true);
  };

  const handleSearchCollapse = () => {
    setIsSearchExpanded(false);
    setIsMobileSearchExpanded(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isSearchExpanded) {
        handleSearchCollapse();
      }
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    } else if (e.key === 'Escape') {
      handleSearchCollapse();
    }
  };

  if (error) return <ColdStartErrorUI />;

  // Show loading shimmer during initial load OR when filters are changing
  const showLoadingShimmer = loading && !isFetchingMore;
  
  return (
    <>
      {/* Expanded Search Overlay - Keep existing implementation */}
      {isSearchExpanded && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center p-2 border-b border-gray-200">
            <button
              onClick={handleSearchCollapse}
              className="md:hidden mr-3 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft size={24} />
            </button>
            
            <div className="flex-1 flex items-center bg-gray-100 rounded-md px-3 py-2">
              <Search size={20} className="text-gray-500 mr-3" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                className="flex-1 bg-transparent outline-none px-3 py-1.5 md:px-4 md:py-2 border-none focus:outline-none focus:ring-2 focus:border-transparent text-sm md:text-base"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => dispatch(setSearchTerm(''))}
                  className="ml-3 p-1 hover:bg-gray-200 rounded-full"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              )}
            </div>

            <button
              onClick={handleSearchCollapse}
              className="hidden md:block ml-4 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {debouncedSearch ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Search Results for {debouncedSearch}
                  </h3>
                  
                  <div className="text-sm text-gray-600">
                    {isRefetching ? 'Searching...' : `${products.length} ${products.length === 1 ? 'result' : 'results'}`}
                  </div>
                  
                  {showLoadingShimmer ? (
                    <ProductThumbnailsShimmer count={queryVariables.limit} />
                  ) : products.length > 0 ? (
                    <ProductThumbnails products={products} categories={categories}/>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No products found for {debouncedSearch}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Searches</h3>
                  <div className="text-gray-500 text-center py-8">
                    Start typing to search products
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Bar (Collapsed State) */}
      {!isSearchExpanded && isMobileSearchExpanded && (
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white z-40 border-b border-gray-200 p-2">
          <div className="flex items-center">
            <button
              onClick={handleSearchCollapse}
              className="mr-3 p-1"
            >
              <ArrowLeft size={20} />
            </button>
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent outline-none px-3 py-1.5 md:px-4 md:py-2 border-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`p-2 ${isMobileSearchExpanded ? 'lg:mt-0 mt-16' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2 w-full">
            {/* Desktop Search Input */}
            <div className="hidden lg:flex items-center flex-1">
              <div className="relative w-full">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onKeyDown={handleSearchKeyDown}
                />
                {searchTerm && (
                  <button
                    onClick={() => dispatch(setSearchTerm(''))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X size={16} className="text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Mobile Search Button */}
            <button
              onClick={handleSearchFocus}
              className="lg:hidden flex items-center justify-center w-10 h-10 border border-gray-200 rounded-lg shadow-sm"
            >
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Modern Filters Section */}
        <div className="mb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <ModernCategoryFilter
              categories={categories}
              value={categoryFilter}
              onChange={handleCategoryChange}
            />
            <ModernSortDropdown
              value={sortBy}
              onChange={handleSortChange}
            />
          </div>
        </div>

        {/* Active Filters Display */}
        <ActiveFilters
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          sortBy={sortBy}
          categories={categories}
          onClearSearch={handleClearSearch}
          onClearCategory={handleClearCategory}
          onClearSort={handleClearSort}
          onClearAll={handleClearFilters}
        />

        <CategoryPage />
        
        <div className="text-sm text-gray-500 mb-3">
          {isRefetching ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Filtering...
            </span>
          ) : (
            `${products.length} ${products.length === 1 ? 'product' : 'products'} found`
          )}
        </div>
        
        {showLoadingShimmer ? (
          <ProductThumbnailsShimmer count={queryVariables.limit} />
        ) : products.length > 0 ? (  
          <>  
            <ProductThumbnails products={products} categories={categories}/>  
              
            {/* Sentinel element for infinite scroll */}
            <div ref={sentinelRef} className="h-2" />
            
            {isFetchingMore && (
              <ProductThumbnailsShimmer count={itemsToFetch} />     
            )}
          </>  
        ) : (  
          <div className="text-center py-12 text-gray-500">  
            No products found. Try a different search or filter.  
          </div>  
        )}  
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default ProductsTab;
