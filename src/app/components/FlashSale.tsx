'use client';
import { useQuery, NetworkStatus } from '@apollo/client';
import { GETPRODUCTS, GETCATEGORY } from './graphql/query';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ProductThumbnails from '../components/ProductThumbnails';
import { Product, Category } from '../Management/types/types';
import ProductThumbnailsShimmer from "./ProductThumbnailsShimmer";

interface ProductsResponse {
  products: {
    items: any[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

const FlashSale: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('Sort by: Featured');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [itemsToFetch, setItemsToFetch] = useState(12); // Track how many items to fetch
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  // Get categories
  const { data: categoryData, loading: categoryLoading } = useQuery(GETCATEGORY);
  const [categories, setCategories] = useState<Category[]>([]);

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

  if (error) return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="text-red-600 text-center py-8">
        Error loading products: {error.message}
      </div>
    </div>
  );

  // Show loading shimmer during initial load OR when filters are changing
  const showLoadingShimmer = loading && !isFetchingMore;
  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Search..."
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex justify-between items-center mb-6">  
        <div className="flex space-x-2">  
          <select  
            className="w-full px-3 py-2 border border-gray-300 rounded-md"  
            value={categoryFilter}  
            onChange={(e) => setCategoryFilter(e.target.value)}  
          >  
            <option value="">All Categories</option>  
            {categories.map(category => (  
              <option key={category.id} value={category.id}>{category.name}</option>  
            ))}  
          </select>  
            
          <select   
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"  
            value={sortBy}  
            onChange={(e) => setSortBy(e.target.value)}  
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

export default FlashSale;
