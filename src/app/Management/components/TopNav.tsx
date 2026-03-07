'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from "react-redux";
import { setActiveIndex } from '../../../../Redux/activeIndexSlice';
import { signOut } from 'next-auth/react';
import { LogOut, CreditCard, ChevronDown, User } from 'lucide-react';
import Image from 'next/image';
interface TopNavProps {
  onMenuClick?: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handlePayments = () => {
    setIsDropdownOpen(false);
    router.push('/payments');
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout) {
      setIsDropdownOpen(false);
      return;
    }
    
    setIsLoggingOut(true);
    
    try {
      await signOut({
        redirect: true,
        callbackUrl: '/Login',
      });
      
      // Clear Redux state
      dispatch(setActiveIndex(0));
      
      // Redirect to login
      router.push('/Login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setIsDropdownOpen(false);
    }
  };

  const toggleDropdown = () => {
    if (!isLoggingOut) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  return (
    <nav className="bg-gray-800 shadow-sm">
      <div className="text-gray-300 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={onMenuClick}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">Open main menu</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <div className="z-20 h-[100%] flex items-center">
              <Image 
                src="/VendorCity_Management.webp" 
                alt="VendorCity Management" 
                height={60} 
                width={60} 
                className="h-[100%] w-auto rounded-lg"
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {/* Additional buttons can go here */}
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notification Bell */}
              <button className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors">
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {/* User Menu Dropdown */}
              <div className="ml-3 relative" ref={dropdownRef}>
                <div>
                  <button
                    onClick={toggleDropdown}
                    disabled={isLoggingOut}
                    className="max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50"
                    id="user-menu-button"
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center gap-2">
                      <img 
                        className="h-8 w-8 rounded-full" 
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                        alt="User avatar" 
                      />
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    {/* User Info */}
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">John Doe</p>
                      <p className="text-xs text-gray-500 truncate">john@example.com</p>
                    </div>

                    {/* Payments Link */}
                    <button
                      onClick={handlePayments}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span>Billing & Payments</span>
                    </button>

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors border-t border-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      <LogOut className={`h-4 w-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                      <span>{isLoggingOut ? 'Logging out...' : 'Sign Out'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
