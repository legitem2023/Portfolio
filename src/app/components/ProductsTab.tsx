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
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  
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

  if (error) return (
     <ColdStartErrorUI/>
  );

  // Show loading shimmer during initial load OR when filters are changing
  const showLoadingShimmer = loading && !isFetchingMore;

  return (
    <div className="p-2 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2 w-full">
          <input
            type="text"
            placeholder="Search..."
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
            value={searchTerm}
            onChange={handleSearchChange}
          />
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

      <div className="flex justify-between items-center mb-6">  
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
      
      <div className="text-sm text-gray-500 mb-4">  
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
  );
};

export default ProductsTab;
