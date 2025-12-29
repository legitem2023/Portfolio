'use client'
// pages/index.tsx (or wherever you want to use the component)

import { useQuery, NetworkStatus } from '@apollo/client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GETPRODUCTS } from '../components/graphql/query';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Image from 'next/image';
import { 
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube
} from 'lucide-react';
const EcommercePage: React.FC = () => {
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
  
  console.log(data);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50 p-0">
      <Header/>
      {/* Footer */}
      <Footer/>
    </div>
  );
};

export default EcommercePage;
