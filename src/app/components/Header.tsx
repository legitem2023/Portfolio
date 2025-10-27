// components/Header.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VisitorCounter from './VisitorCounter';
import { decryptToken } from '../../../utils/decryptToken';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveIndex } from '../../../Redux/activeIndexSlice';
import AnimatedCrowd from "./AnimatedCrowd";
import AnimatedCrowdMenu from "./AnimatedCrowdMenu";

import { USERS } from './graphql/query';
import { useQuery, NetworkStatus } from '@apollo/client';
import LogoutButton from './LogoutButton';
import Ads from './Ads/Ads';
import { PromoAd } from './Ads/PromoAd';
import { useAdDrawer } from './hooks/useAdDrawer';

const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const drawer = useAdDrawer({ autoOpenDelay: 3000 });
  
  const dispatch = useDispatch();
  const activeIndex = useSelector((state: any) => state.activeIndex.value);
  const { data: userData, loading: userLoading, networkStatus } = useQuery(USERS, {
    notifyOnNetworkStatusChange: true
  });

  // Check authentication status
  useEffect(() => {
    const getRole = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/protected', {
          credentials: 'include' // Important: includes cookies
        });
        
        if (response.status === 401) {
          // Handle unauthorized access
          setUser(null);
          throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        const token = data?.user;
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";

        const payload = await decryptToken(token, secret.toString());
        setUser(payload);
      } catch (err) {
        console.error('Error getting role:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
        setHasCheckedAuth(true);
      }
    };
    getRole();
  }, []);

  // Check if current route requires authentication - ONLY AFTER everything is loaded
  useEffect(() => {
    // Only check redirect conditions when:
    // 1. Authentication check is complete (hasCheckedAuth)
    // 2. User query is not loading (if you're using it)
    // 3. We're not in a loading state
    if (!hasCheckedAuth || isLoading || networkStatus === NetworkStatus.loading) {
      return;
    }

    const protectedIndexes = [5, 7, 8, 9, 10];
    
    if (protectedIndexes.includes(activeIndex) && !user) {
      console.log('Redirecting to login: protected index without user');
      router.push('/Login');
    }
  }, [activeIndex, user, isLoading, hasCheckedAuth, networkStatus, router]);

  // Close dropdown when clicking outside (desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modal when clicking outside or pressing escape (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Check if mobile device
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768; // 768px is typical breakpoint for md in Tailwind
  };

  const handleUserButtonClick = () => {
    if (isMobile()) {
      setIsModalOpen(true);
    } else {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  // Show loading state if needed
  /* if (isLoading || !hasCheckedAuth || networkStatus === NetworkStatus.loading) {
    return (
      <div>
        <div className="relative bg-gradient-to-r from-purple-100 to-indigo-200 animate-pulse bg-opacity-90 p-2 aspect-[4/1] sm:aspect-[9/1]">
          <div className="z-20 flex items-center justify-between p-2 h-[100%] w-[100%]">
            <div className="z-20 h-[100%] flex items-center">
              <Image
                src="/Dlogo.svg"
                alt="Logo"
                height={80}
                width={160}
                className="h-[100%] w-[auto] drop-shadow-[0.5px_0.5px_2px_black]"
              />
            </div>
            <div className="z-20 h-[100%] flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center border border-indigo-200">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <Ads/>
      </div>
    );
  }*/

  return (
    <div>
      <div className="relative bg-gradient-to-r from-violet-100 to-indigo-100 bg-opacity-90  p-2 aspect-[4/1] sm:aspect-[9/1]">
        <AnimatedCrowd/>
        <div className="z-20 flex items-center justify-between p-2 h-[100%] w-[100%]">
        
          <div className="z-20 h-[100%] flex items-center">
            <Image 
               src="/Dlogo.svg" 
               alt="Logo" 
               height={80} 
               width={80} 
               className="h-[100%] w-[auto] rounded"
               style={{ filter: 'drop-shadow(0.5px 0.5px 3px gold)' }}
             />
          </div>
             
          <div className="z-20 h-[100%] flex items-center" ref={dropdownRef}>
            <button
              onClick={handleUserButtonClick}
              className="flex items-center text-sm focus:outline-none"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center border border-indigo-200">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </button>

            {/* Desktop Dropdown */}
            {isDropdownOpen && !isMobile() && (
              <div className="absolute right-0 mt-2 w-48 bg-white bg-opacity-95 backdrop-blur-md rounded-md shadow-lg py-1 customZIndex border border-gray-200 translate-y-3/4">
                <div
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    dispatch(setActiveIndex(7));
                  }}
                >
                  <i className="fas fa-user mr-2 text-gray-400"></i>Your Profile
                </div>
                <div
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    dispatch(setActiveIndex(9));
                  }}
                >
                  <i className="fas fa-messages mr-2 text-gray-400"></i>Messages
                </div>
                <div
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    dispatch(setActiveIndex(10));
                  }}
                >
                  <i className="fas fa-shopping-bag mr-2 text-gray-400"></i>Orders
                </div>
                <div className="border-t border-gray-100 my-1"></div>
                <LogoutButton/>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide From Left Modal */}
      {isModalOpen && isMobile() && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 md:hidden"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal */}
          <div 
            ref={modalRef}
            className="fixed top-0 left-0 h-full w-3/4 max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-linear md:hidden"
            style={{ 
              transform: isModalOpen ? 'translateX(0)' : 'translateX(-100%)'
            }}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black bg-opacity-40 backdrop-blur-md p-2 aspect-[3/1]">
              
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-white hover:bg-opacity-50 transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal content */}
            <div className="overflow-y-auto h-full pb-20">
              <div className="p-4">
                <div className="space-y-1">
                  <button
                    className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      setIsModalOpen(false);
                      dispatch(setActiveIndex(7));
                    }}
                  >
                    <i className="fas fa-user mr-3 text-gray-400 w-5 text-center"></i>
                    <span className="flex-1">Your Profile</span>
                    <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
                  </button>

                  <button
                    className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      setIsModalOpen(false);
                      dispatch(setActiveIndex(9));
                    }}
                  >
                    <i className="fas fa-messages mr-3 text-gray-400 w-5 text-center"></i>
                    <span className="flex-1">Messages</span>
                    <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
                  </button>

                  <button
                    className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      setIsModalOpen(false);
                      dispatch(setActiveIndex(10));
                    }}
                  >
                    <i className="fas fa-shopping-bag mr-3 text-gray-400 w-5 text-center"></i>
                    <span className="flex-1">Orders</span>
                    <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
                  </button>

                  <div className="border-t border-gray-200 my-3"></div>

                  <div className="px-4 py-3">
                    <LogoutButton/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {/*<Ads/>*/}
    </div>
  );
};

export default Header;
