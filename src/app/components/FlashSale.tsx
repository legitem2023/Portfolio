'use client';
import { useQuery, NetworkStatus } from '@apollo/client';
import { GETPRODUCTS, GETCATEGORY } from './graphql/query';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import FlashThumbnails from '../components/FlashThumbnails';
import { Product, Category } from '../Management/types/types';
import FlashThumbnailsShimmer from "./FlashThumbnailsShimmer";
import {
  Gift,
  Sparkles
} from 'lucide-react';
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
<div className="p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Special Offers</h3>
          <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-5 rounded-xl mb-4 shadow-lg">
            <h4 className="font-bold text-lg">Flash Sale</h4>
            <p className="text-sm">Ends in: 02:45:33</p>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2 mt-2">
              <div className="bg-amber-400 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-amber-300 rounded-lg p-4 bg-amber-50 flex items-center">
              <div className="bg-amber-100 p-3 rounded-full mr-4">
                <Sparkles className="text-amber-700" size={20} />
              </div>
              <div>
                <h4 className="font-medium">New Customer Discount</h4>
                <p className="text-sm text-amber-700">15% off your first order</p>
              </div>
            </div>
            <div className="border border-rose-300 rounded-lg p-4 bg-rose-50 flex items-center">
              <div className="bg-rose-100 p-3 rounded-full mr-4">
                <Gift className="text-rose-700" size={20} />
              </div>
              <div>
                <h4 className="font-medium">Valentines Special</h4>
                <p className="text-sm text-rose-700">Buy one, get one 50% off</p>
              </div>
            </div>
          </div>
 <div className="p-0 bg-white rounded-lg shadow-lg">   
    <div className="text-sm text-gray-500 mb-4">  
        {isRefetching ? 'Filtering...' : `${products.length} ${products.length === 1 ? 'product' : 'products'} shown`}
      </div> 
      {showLoadingShimmer ? (
        <FlashThumbnailsShimmer count={queryVariables.limit}/>
      ) : products.length > 0 ? (  
        <>  
          <FlashThumbnails products={products} />     
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
</div>    
  );
};

export default FlashSale;
