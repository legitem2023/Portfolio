'use client';
import { useQuery } from '@apollo/client';
import { GETPRODUCTS } from './graphql/query';
import React, { useState, useCallback, useEffect } from 'react';
import ProductThumbnails from '../components/ProductThumbnails';

interface ProductsResponse {
  products: {
    items: any[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

const ProductsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [sortBy, setSortBy] = useState('Sort by: Featured');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Debounce search input
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setIsInitialLoad(false);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  const { data, loading, error, fetchMore } = useQuery(GETPRODUCTS, {
    variables: {
      search: debouncedSearch,
      cursor: '',
      limit: 12,
      category: categoryFilter !== 'All Categories' ? categoryFilter : undefined,
      sortBy: sortBy.replace('Sort by: ', '')
    },
    notifyOnNetworkStatusChange: true,
  });

  const handleLoadMore = useCallback(() => {
    if (data?.products?.hasMore) {
      fetchMore({
        variables: {
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
  }, [data, fetchMore]);

  if (loading && isInitialLoad) return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="text-red-600 text-center py-8">
        Error loading products: {error.message}
      </div>
    </div>
  );

  const products = data?.products?.items || [];
  const hasMore = data?.products?.hasMore || false;
console.log(products);
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
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All Categories">All Categories</option>
            <option value="Clothing">Clothing</option>
            <option value="Accessories">Accessories</option>
            <option value="Footwear">Footwear</option>
            <option value="Jewelry">Jewelry</option>
            <option value="Beauty">Beauty</option>
            <option value="Home">Home</option>
            <option value="Electronics">Electronics</option>
            <option value="Gifts">Gifts</option>
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
        <div className="text-sm text-gray-500">
          {products.length} {products.length === 1 ? 'product' : 'products'} shown
        </div>
      {products.length > 0 ? (
        <>
          <ProductThumbnails products={products} />
          
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button 
                onClick={handleLoadMore}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-6 rounded-md disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More Products'}
              </button>
            </div>
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
