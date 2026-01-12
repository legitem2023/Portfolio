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
import { Search, X, ArrowLeft } from 'lucide-react';

interface ProductsResponse {
  products: {
    items: any[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setCategoryFilter(e.target.value));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setSortBy(e.target.value));
  };

  const handleClearFilters = () => {
    dispatch(clearAllFilters());
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
      // Trigger search immediately (debounce will handle it)
      if (isSearchExpanded) {
        handleSearchCollapse();
      }
      // Focus management
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    } else if (e.key === 'Escape') {
      handleSearchCollapse();
    }
  };

  if (error) return (
     <ColdStartErrorUI/>
  );

  // Show loading shimmer during initial load OR when filters are changing
  const showLoadingShimmer = loading && !isFetchingMore;

  return (
    <>
      {/* Expanded Search Overlay */}
      {isSearchExpanded && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Search Header */}
          <div className="flex items-center p-2 border-b border-gray-200">
            {/* Mobile Back Button */}
            <button
              onClick={handleSearchCollapse}
              className="md:hidden mr-3 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft size={24} />
            </button>
            
            {/* Search Input */}
            <div className="flex-1 flex items-center bg-gray-100 rounded-md px-4 py-3">
              <Search size={20} className="text-gray-500 mr-3" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                className="flex-1 bg-transparent border-none outline-none text-lg"
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

            {/* Desktop Close Button */}
            <button
              onClick={handleSearchCollapse}
              className="hidden md:block ml-4 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          {/* Search Results Section */}
          <div className="flex-1 overflow-y-auto">
            {/* Recent Searches or Search Results */}
            <div className="p-4">
              {debouncedSearch ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Search Results for {debouncedSearch}
                  </h3>
                  
                  {/* Results Count */}
                  <div className="text-sm text-gray-600">
                    {isRefetching ? 'Searching...' : `${products.length} ${products.length === 1 ? 'result' : 'results'}`}
                  </div>
                  
                  {/* Products Grid */}
                  {showLoadingShimmer ? (
                    <ProductThumbnailsShimmer count={queryVariables.limit} />
                  ) : products.length > 0 ? (
                    <ProductThumbnails products={products} />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No products found for {debouncedSearch}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Searches</h3>
                  {/* Add your recent searches component here if needed */}
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
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white z-40 border-b border-gray-200 p-4">
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
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`p-2 bg-white rounded-lg shadow-lg ${isMobileSearchExpanded ? 'lg:mt-0 mt-16' : ''}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex space-x-2 w-full">
            {/* Desktop Search Input */}
            <div className="hidden lg:flex items-center flex-1">
              <input
                type="text"
                placeholder="Search..."
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            
            {/* Mobile Search Button */}
            <button
              onClick={handleSearchFocus}
              className="lg:hidden flex items-center justify-center w-10 h-10 border border-gray-300 rounded-md"
            >
              <Search size={20} />
            </button>
            
            {/* Optional: Add clear filters button */}
            {(searchTerm || categoryFilter || sortBy !== 'Sort by: Featured') && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mb-2">  
          <div className="flex space-x-2 w-full">  
            <select  
              className="w-full px-3 py-2 border border-gray-300 rounded-md"  
              value={categoryFilter}  
              onChange={handleCategoryChange}  
            >  
              <option value="">All Categories</option>  
              {categories.map(category => (  
                <option key={category.id} value={category.id}>{category.name}</option>  
              ))}  
            </select>  
              
            <select   
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"  
              value={sortBy}  
              onChange={handleSortChange}  
            >  
              <option>Sort by: Featured</option>  
              <option>Sort by: Newest</option>  
              <option>Sort by: Price: Low to High</option>  
              <option>Sort by: Price: High to Low</option>  
              <option>Sort by: Highest Rated</option>  
            </select>  
          </div>  
        </div>  
        <CategoryPage/>
        <div className="text-sm text-gray-500 mb-2">  
          {isRefetching ? 'Filtering...' : `${products.length} ${products.length === 1 ? 'product' : 'products'} shown`}
        </div>  
        
        {showLoadingShimmer ? (
          <ProductThumbnailsShimmer count={queryVariables.limit}/>
        ) : products.length > 0 ? (  
          <>  
            <ProductThumbnails products={products} />  
              
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
    </>
  );
};

export default ProductsTab;
