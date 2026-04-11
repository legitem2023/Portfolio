"use client";
import { useState, useRef, useEffect } from "react";
import { Bell, Package, LogOut, CreditCard, ChevronDown, Shield, Award, Clock } from "lucide-react";
import { useAuth } from '../hooks/useAuth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDispatch } from "react-redux";
import { setActiveIndex } from '../../../../Redux/activeIndexSlice';
import { persistor } from '../../../../Redux/store';
import { signOut } from 'next-auth/react';

interface HeaderProps {
  isMobile: boolean;
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
  activeTab: string;
  newDeliveriesCount: number;
}

export default function Header({ 
  isMobile, 
  isOnline, 
  setIsOnline, 
  activeTab, 
  newDeliveriesCount 
}: HeaderProps) {

  const { user } = useAuth();
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
      
      // Clear Redux state if needed
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

  // Mobile View - Deluxe Style
  if (isMobile) {
    return (
      <div>
        <div className="relative p-0 aspect-[4/1] sm:aspect-[9/1] bg-gradient-to-r from-white via-white to-lime-50/80 shadow-lg sticky top-0 z-50 border-b border-lime-100/50 backdrop-blur-sm">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-lime-200/20 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-400/30 to-transparent"></div>
          
          <div className="z-20 flex items-center justify-between p-2 h-[100%] w-[100%] relative">
            {/* Logo with Premium Effect */}
            <div className="z-20 h-[100%] flex items-center group">
              <div className="relative">
                <div className="absolute inset-0 bg-lime-400/20 rounded-lg blur-md group-hover:blur-lg transition-all duration-300"></div>
                <Image 
                  src="/VendorCity_Rider.webp" 
                  alt="VendorCity Rider" 
                  height={60} 
                  width={60} 
                  className="h-[100%] w-auto rounded-lg relative transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

            {/* User Section with Dropdown - Deluxe */}
            <div className="flex items-center gap-3 relative" ref={dropdownRef}>
              {/* Notification Badge - Premium */}
              {newDeliveriesCount > 0 && activeTab !== "newDeliveries" && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-lime-400 to-lime-600 rounded-full opacity-0 group-hover:opacity-30 blur transition-opacity duration-300"></div>
                  <Bell className="w-5 h-5 text-gray-600 relative z-10 group-hover:text-lime-600 transition-colors" />
                  <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg ring-2 ring-white">
                    {newDeliveriesCount > 9 ? '9+' : newDeliveriesCount}
                  </span>
                </div>
              )}

              {/* User Info & Avatar - Premium Clickable */}
              <button 
                onClick={toggleDropdown}
                disabled={isLoggingOut}
                className="flex items-center gap-2 focus:outline-none disabled:opacity-50 group"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 leading-tight group-hover:text-lime-700 transition-colors">
                    {user?.name || 'Rider'}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                    <span className="bg-lime-100 px-1.5 py-0.5 rounded-full text-lime-700 font-medium">VC-001</span>
                    <ChevronDown className={`w-3 h-3 transition-all duration-300 ${isDropdownOpen ? 'rotate-180 text-lime-600' : 'text-gray-400'}`} />
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-lime-400 to-lime-600 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-lime-600 to-lime-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg ring-2 ring-white/50 group-hover:ring-lime-200 transition-all duration-300">
                    {user?.name?.charAt(0) || 'R'}
                  </div>
                </div>
              </button>

              {/* Mobile Dropdown Menu - Deluxe */}
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-lime-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Decorative Header */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-lime-400 via-lime-500 to-lime-400 rounded-t-2xl"></div>
                  
                  {/* Quick User Info */}
                  <div className="px-4 py-3 border-b border-lime-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.name || 'Rider'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="w-3 h-3 text-lime-500" />
                      <p className="text-xs text-gray-500">Verified Rider • VC-001</p>
                    </div>
                  </div>

                  {/* Stats Preview */}
                  <div className="px-4 py-2 border-b border-lime-100 bg-lime-50/30">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-lime-600" />
                        <span className="text-gray-600">4.9 ★</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-lime-600" />
                        <span className="text-gray-600">98% on time</span>
                      </div>
                    </div>
                  </div>

                  {/* Payments Button */}
                  <button
                    onClick={handlePayments}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-lime-50 hover:to-white flex items-center gap-3 transition-all duration-200 group"
                  >
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-lime-400/20 to-lime-600/20 group-hover:from-lime-400/30 group-hover:to-lime-600/30 transition-all">
                      <CreditCard className="w-4 h-4 text-lime-600" />
                    </div>
                    <span className="font-medium">Billing & Payments</span>
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-white flex items-center gap-3 transition-all duration-200 border-t border-lime-100 disabled:opacity-50 group"
                  >
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-400/20 to-red-600/20 group-hover:from-red-400/30 group-hover:to-red-600/30 transition-all">
                      <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                    </div>
                    <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Sign Out'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop View - Deluxe Style
  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-lime-100">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-lime-400 via-lime-500 to-lime-400"></div>
      
      <div className="max-w-7xl mx-auto px-6 py-3 relative">
        <div className="flex items-center justify-between">
          {/* Logo and Title - Premium */}
          <div className="flex items-center gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-lime-400/30 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <Image 
                src="/VendorCity_Rider.webp" 
                alt="Logo" 
                height={100} 
                width={100} 
                className="h-[100%] w-[auto] rounded-xl relative transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                VendorCity
                <span className="text-lime-600 ml-2">Rider</span>
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5 bg-lime-50 px-2 py-1 rounded-full">
                  <Package className="w-4 h-4 text-lime-600" />
                  <span className="text-sm font-medium text-lime-700">
                    {newDeliveriesCount} delivery piece{newDeliveriesCount !== 1 ? 's' : ''} available
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"} shadow-lg`} />
                  <span className="text-xs font-medium text-gray-600">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User Section with Dropdown - Premium */}
          <div className="flex items-center gap-4 relative" ref={dropdownRef}>
            {/* Notification Bell - Premium */}
            {newDeliveriesCount > 0 && activeTab !== "newDeliveries" && (
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-lime-400 to-lime-600 rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
                <Bell className="w-5 h-5 text-gray-600 relative z-10 group-hover:text-lime-600 transition-colors cursor-pointer" />
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg ring-2 ring-white">
                  {newDeliveriesCount > 9 ? '9+' : newDeliveriesCount}
                </span>
              </div>
            )}

            {/* User Info & Avatar - Premium Dropdown Trigger */}
            <button 
              onClick={toggleDropdown}
              disabled={isLoggingOut}
              className="flex items-center gap-3 hover:bg-gradient-to-r hover:from-lime-50 hover:to-white rounded-xl p-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-lime-500/50 disabled:opacity-50 group"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <div className="text-right">
                <p className="font-semibold text-gray-900 flex items-center gap-1 group-hover:text-lime-700 transition-colors">
                  {user?.name || 'Rider Name'}
                  <ChevronDown className={`w-4 h-4 transition-all duration-300 ${isDropdownOpen ? 'rotate-180 text-lime-600' : 'text-gray-400 group-hover:text-lime-600'}`} />
                </p>
                <div className="flex items-center gap-1 justify-end">
                  <Shield className="w-3 h-3 text-lime-500" />
                  <p className="text-sm text-gray-500">VC-001</p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-lime-400 to-lime-600 rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-lime-600 to-lime-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-xl ring-2 ring-white/50 group-hover:ring-lime-200 transition-all duration-300">
                  {user?.name?.charAt(0) || 'R'}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-red-500"} shadow-lg`} />
              </div>
            </button>

            {/* Desktop Dropdown Menu - Deluxe */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-lime-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Decorative Header */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-lime-400 via-lime-500 to-lime-400 rounded-t-2xl"></div>
                
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-lime-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'Rider'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="w-3 h-3 text-lime-500" />
                    <p className="text-xs text-gray-500">VC-001 • {user?.email || 'rider@example.com'}</p>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="px-4 py-3 border-b border-lime-100 bg-gradient-to-r from-lime-50/50 to-white">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <p className="text-xs text-gray-500">Rating</p>
                      <p className="text-sm font-bold text-lime-600">4.9 ★</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <p className="text-xs text-gray-500">On Time</p>
                      <p className="text-sm font-bold text-lime-600">98%</p>
                    </div>
                  </div>
                </div>

                {/* Status Toggle - Premium */}
                <button
                  onClick={() => {
                    setIsOnline(!isOnline);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-lime-50 hover:to-white flex items-center gap-3 transition-all duration-200 group border-b border-lime-100"
                >
                  <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"} shadow-lg`} />
                  <span className="font-medium">Set as {isOnline ? 'Offline' : 'Online'}</span>
                </button>

                {/* Payments Button */}
                <button
                  onClick={handlePayments}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-lime-50 hover:to-white flex items-center gap-3 transition-all duration-200 group"
                >
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-lime-400/20 to-lime-600/20 group-hover:from-lime-400/30 group-hover:to-lime-600/30 transition-all">
                    <CreditCard className="w-4 h-4 text-lime-600" />
                  </div>
                  <span className="font-medium">Billing & Payments</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-white flex items-center gap-3 transition-all duration-200 border-t border-lime-100 disabled:opacity-50 group"
                >
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-400/20 to-red-600/20 group-hover:from-red-400/30 group-hover:to-red-600/30 transition-all">
                    <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                  </div>
                  <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Sign Out'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
                    }
