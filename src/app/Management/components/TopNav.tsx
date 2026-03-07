'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from "react-redux";
import { setActiveIndex } from '../../../../Redux/activeIndexSlice';
import { signOut } from 'next-auth/react';
import { LogOut, CreditCard, ChevronDown, Bell, Menu } from 'lucide-react';
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
    <nav className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-2xl relative overflow-hidden">
      {/* Decorative gold line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200"></div>
      
      {/* Background pattern - subtle for mobile */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, gold 1px, transparent 0)`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>

      <div className="relative px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
          {/* Left Section - Logo and Menu */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile menu button - improved touch target */}
            <button
              onClick={onMenuClick}
              className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg text-amber-200 hover:text-white hover:bg-amber-500/20 active:bg-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-200 touch-manipulation"
              aria-label="Open main menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Logo with luxury styling - responsive sizing */}
            <div className="flex items-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                <div className="relative h-10 w-auto sm:h-12 lg:h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-0.5 sm:p-1">
                  <Image 
                    src="/VendorCity_Management.webp" 
                    alt="VendorCity Management" 
                    height={64} 
                    width={64} 
                    className="h-full w-auto rounded-lg"
                    priority
                  />
                </div>
              </div>
              
              {/* Brand name - hidden on smallest screens, visible on larger */}
              <div className="hidden xs:block ml-2 sm:ml-3">
                <h1 className="text-sm sm:text-base lg:text-xl font-serif font-light tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400 truncate max-w-[120px] sm:max-w-[200px]">
                  VendorCity
                </h1>
                <p className="hidden sm:block text-[10px] lg:text-xs text-amber-200/60 tracking-widest uppercase">
                  Management Portal
                </p>
              </div>
            </div>
          </div>
          
          {/* Right Section - Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            {/* Notification Bell - improved touch target */}
            <button className="relative flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full text-amber-200 hover:text-white hover:bg-amber-500/20 active:bg-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-200 touch-manipulation">
              <span className="sr-only">View notifications</span>
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {/* Notification badge */}
              <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 ring-1 ring-slate-900"></span>
            </button>

            {/* User Menu Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                disabled={isLoggingOut}
                className="relative flex items-center space-x-1 sm:space-x-2 pr-2 sm:pr-3 pl-1 py-1 rounded-full bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-amber-500/20 hover:border-amber-500/40 active:bg-amber-500/10 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-200 disabled:opacity-50 touch-manipulation"
                id="user-menu-button"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <span className="sr-only">Open user menu</span>
                
                {/* Avatar with luxury ring - responsive sizing */}
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
                  <img 
                    className="relative h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 rounded-full border-2 border-slate-800" 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                    alt="User avatar" 
                  />
                </div>
                
                {/* User info - hidden on mobile, visible on tablet/desktop */}
                <div className="hidden sm:block text-left">
                  <p className="text-xs lg:text-sm font-medium text-amber-200 truncate max-w-[80px] lg:max-w-[120px]">
                    John Doe
                  </p>
                  <p className="text-[10px] lg:text-xs text-amber-200/60 truncate max-w-[80px] lg:max-w-[120px]">
                    Administrator
                  </p>
                </div>
                
                <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 text-amber-300 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu - Mobile optimized */}
              {isDropdownOpen && (
                <>
                  {/* Backdrop for mobile - closes menu when tapped outside */}
                  <div 
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsDropdownOpen(false)}
                    aria-hidden="true"
                  />
                  
                  <div className="absolute right-0 mt-2 w-56 sm:w-64 rounded-xl shadow-2xl py-2 bg-slate-800 border border-amber-500/20 focus:outline-none z-50">
                    {/* Decorative header */}
                    <div className="absolute -top-1 right-6 w-3 h-3 rotate-45 bg-slate-800 border-t border-l border-amber-500/20"></div>
                    
                    {/* User Info with gradient - mobile optimized */}
                    <div className="px-4 py-3 border-b border-amber-500/20 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                      <p className="text-sm font-serif font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">
                        John Doe
                      </p>
                      <p className="text-xs text-amber-200/60 truncate mt-0.5 break-all">
                        john.doe@vendorcity.com
                      </p>
                    </div>

                    {/* Menu Items - improved touch targets for mobile */}
                    <div className="py-2">
                      <button
                        onClick={handlePayments}
                        className="w-full text-left px-4 py-3.5 sm:py-3 text-sm text-amber-200 hover:text-white hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-yellow-500/10 active:from-amber-500/20 active:to-yellow-500/20 flex items-center gap-3 transition-all duration-200 touch-manipulation"
                      >
                        <div className="p-1.5 rounded-lg bg-amber-500/10">
                          <CreditCard className="h-4 w-4 text-amber-400" />
                        </div>
                        <span className="flex-1">Billing & Payments</span>
                        <span className="text-xs text-amber-500">→</span>
                      </button>
                    </div>

                    {/* Logout Button - improved touch target */}
                    <div className="border-t border-amber-500/20 pt-2">
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full text-left px-4 py-3.5 sm:py-3 text-sm text-rose-400 hover:text-rose-300 hover:bg-gradient-to-r hover:from-rose-500/10 hover:to-rose-600/10 active:from-rose-500/20 active:to-rose-600/20 flex items-center gap-3 transition-all duration-200 disabled:opacity-50 touch-manipulation"
                      >
                        <div className="p-1.5 rounded-lg bg-rose-500/10">
                          <LogOut className={`h-4 w-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                        </div>
                        <span className="flex-1">{isLoggingOut ? 'Logging out...' : 'Sign Out'}</span>
                        <span className="text-xs text-rose-500">↗</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add custom breakpoint for extra small devices */}
      <style jsx>{`
        @media (min-width: 480px) {
          .xs\\:block {
            display: block;
          }
        }
      `}</style>
    </nav>
  );
}
