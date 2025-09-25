// components/Header.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import VisitorCounter from './VisitorCounter';
import { decryptToken } from '../../../utils/decryptToken';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveIndex } from '../../../Redux/activeIndexSlice';
import AnimatedCrowd from "./AnimatedCrowd";


import { USERS } from './graphql/query';
import { useQuery, NetworkStatus } from '@apollo/client';



const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch= useDispatch();
 
   const { data: userData, loading: userLoading } = useQuery(USERS);
 
  console.log(userData?.users);
  useEffect(() => {
    const getRole = async () => {
      try {
        const response = await fetch('/api/protected', {
          credentials: 'include' // Important: includes cookies
        });
        
        if (response.status === 401) {
          // Handle unauthorized access
          throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        const token = data?.user;
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";

        const payload = await decryptToken(token, secret.toString());

        console.log(payload);
      } catch (err) {
        console.error('Error getting role:', err);
      }
    };
    getRole();
  }, []);
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative bg-gradient-to-r from-violet-100 to-indigo-100 bg-opacity-90 backdrop-blur-sm shadow-sm p-2 aspect-[4/1] sm:aspect-[9/1]">
      
        <AnimatedCrowd/>
      <div className="z-20 flex items-center justify-between p-2 h-[100%] w-[100%]">
      
        <div className="z-20 h-[100%] flex items-center">
          <Image
            src="/Dlogo.svg"
            alt="Logo"
            height={80}
            width={160}
            className="h-10 w-20"
          />
        </div>
           
    
        <div className="z-20 h-[100%] flex items-center" ref={dropdownRef}>
          
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center text-sm focus:outline-none"
          >
            
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center border border-indigo-200">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </button>

          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white bg-opacity-95 backdrop-blur-md rounded-md shadow-lg py-1 z-max border border-gray-200 translate-y-3/4">
              <div
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                onClick={() => {
                  setIsDropdownOpen(false);
                  dispatch(setActiveIndex(7));
                }}
              >
                <i className="fas fa-user mr-2 text-gray-400"></i>Your Profile
              </div>
              <div
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                onClick={() => setIsDropdownOpen(false)}
              >
                <i className="fas fa-cog mr-2 text-gray-400"></i>Settings
              </div>
              <div
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                onClick={() => setIsDropdownOpen(false)}
              >
                <i className="fas fa-shopping-bag mr-2 text-gray-400"></i>Orders
              </div>
              <div className="border-t border-gray-100 my-1"></div>
              <div
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                onClick={() => setIsDropdownOpen(false)}
              >
                <i className="fas fa-sign-out-alt mr-2 text-gray-400"></i>Sign out
              </div>
            </div>
          )}
        </div>

      </div>
      
  
    </div>
  );
};

export default Header;
