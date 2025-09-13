// components/Header.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <div className="relative">
      {/* Main Header Content */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-white bg-opacity-90 backdrop-blur-sm shadow-sm">
        <div>
          <Image
            src="/Dlogo.svg"
            alt="Logo"
            height={80}
            width={160}
            className="h-15 w-25"
          />
        </div>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-8">
          <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">Home</Link>
          <Link href="/products" className="text-gray-700 hover:text-blue-600 transition-colors">Products</Link>
          <Link href="/deals" className="text-gray-700 hover:text-blue-600 transition-colors">Deals</Link>
          <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">About</Link>
        </nav>
        
        {/* Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          {/* Dropdown Trigger */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center text-sm focus:outline-none"
          >
            {/* User avatar or icon */}
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center border border-indigo-200">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white bg-opacity-95 backdrop-blur-md rounded-md shadow-lg py-1 z-50 border border-gray-200">
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                onClick={() => setIsDropdownOpen(false)}
              >
                <i className="fas fa-user mr-2 text-gray-400"></i>Your Profile
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                onClick={() => setIsDropdownOpen(false)}
              >
                <i className="fas fa-cog mr-2 text-gray-400"></i>Settings
              </Link>
              <Link
                href="/orders"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                onClick={() => setIsDropdownOpen(false)}
              >
                <i className="fas fa-shopping-bag mr-2 text-gray-400"></i>Orders
              </Link>
              <div className="border-t border-gray-100 my-1"></div>
              <Link
                href="/logout"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                onClick={() => setIsDropdownOpen(false)}
              >
                <i className="fas fa-sign-out-alt mr-2 text-gray-400"></i>Sign out
              </Link>
            </div>
          )}
        </div>
      </div>
       <div className="w-full m-2 bg-[rgba(0,0,0,0.5)] h-[45px]">
       </div>
      {/* Glassmorphism Stats Bar */}
      {/*<div className="relative z-0 -mt-4 mx-4">
        <div className="bg-white bg-opacity-70 backdrop-blur-lg rounded-lg shadow-lg p-3 flex flex-wrap justify-center md:justify-between items-center space-x-4 md:space-x-6 text-sm text-gray-700 border border-white border-opacity-50">
          <div className="flex items-center">
            <div className="bg-blue-100 bg-opacity-50 p-2 rounded-full mr-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-blue-600">24,589</div>
              <div className="text-xs text-gray-500">Total Visits</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="bg-amber-100 bg-opacity-50 p-2 rounded-full mr-2">
              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center">
                <span className="font-semibold text-amber-600 mr-1">4.8</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-500">Store Rating</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="bg-green-100 bg-opacity-50 p-2 rounded-full mr-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-green-600">Live Chat</div>
              <div className="text-xs text-gray-500">Available Now</div>
            </div>
          </div>
        </div>
      </div>*/}
    </div>
  );
};

export default Header;
