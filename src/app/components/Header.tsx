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
    <div className="relative bg-white bg-opacity-90 backdrop-blur-sm shadow-sm p-2">
      {/* Main Header Content */}
      <div className="relative z-10 flex items-center justify-between p-2">
        <div>
          <Image
            src="/Dlogo.svg"
            alt="Logo"
            height={80}
            width={160}
            className="h-10 w-20"
          />
        </div>
           
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
        <div className="w-full max-w-[calc(100%-1rem)] mx-2 box-border rounded-md bg-[rgba(255,225,253,0.5)] h-[45px] shadow-sm">
        </div>
  
    </div>
  );
};

export default Header;
