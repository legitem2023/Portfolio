"use client";
import { useState, useRef, useEffect } from "react";
import { Bell, Package, LogOut, CreditCard, ChevronDown } from "lucide-react";
import { useAuth } from '../hooks/useAuth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
    setIsDropdownOpen(false);
    // Add your logout logic here
    // await signOut();
    router.push('/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Mobile View
  if (isMobile) {
    return (
      <div>
        <div className="relative p-0 aspect-[4/1] sm:aspect-[9/1] bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(200,240,100,0.5)_100%)] shadow-md sticky top-0 z-50">
          <div className="z-20 flex items-center justify-between p-2 h-[100%] w-[100%]">
        
            <div className="z-20 h-[100%] flex items-center">
              <Image 
                src="/VendorCity_Rider.webp" 
                alt="VendorCity Rider" 
                height={60} 
                width={60} 
                className="h-[100%] w-auto rounded-lg"
              />
            </div>

            {/* User Section with Dropdown */}
            <div className="flex items-center gap-3 relative" ref={dropdownRef}>
              {/* Notification Badge */}
              {newDeliveriesCount > 0 && activeTab !== "newDeliveries" && (
                <div className="relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {newDeliveriesCount > 9 ? '9+' : newDeliveriesCount}
                  </span>
                </div>
              )}

              {/* User Info & Avatar - Clickable Dropdown Trigger */}
              <button 
                onClick={toggleDropdown}
                className="flex items-center gap-2 focus:outline-none"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {user?.name || 'Rider'}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                    {'VC-001'}
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </p>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-lime-600 to-lime-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {user?.name?.charAt(0) || 'R'}
                  </div>
                </div>
              </button>

              {/* Mobile Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {/* Quick User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.name || 'Rider'}</p>
                    <p className="text-xs text-gray-500">VC-001</p>
                  </div>

                  {/* Payments Button */}
                  <button
                    onClick={handlePayments}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span>Billing & Payments</span>
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors border-t border-gray-100"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop View
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Image 
              src="/VendorCity_Rider.webp" 
              alt="Logo" 
              height={100} 
              width={100} 
              className="h-[100%] w-[auto] rounded"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                <span className="text-lime-600">VendorCity</span> Rider
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {newDeliveriesCount} delivery piece{newDeliveriesCount !== 1 ? 's' : ''} available
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                  <span className="text-xs font-medium text-gray-600">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User Section with Dropdown */}
          <div className="flex items-center gap-6 relative" ref={dropdownRef}>
            {/* Notification Bell */}
            {newDeliveriesCount > 0 && activeTab !== "newDeliveries" && (
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-600 hover:text-blue-600 cursor-pointer transition-colors" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {newDeliveriesCount > 9 ? '9+' : newDeliveriesCount}
                </span>
              </div>
            )}

            {/* User Info & Avatar - Clickable Dropdown Trigger */}
            <button 
              onClick={toggleDropdown}
              className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <div className="text-right">
                <p className="font-semibold text-gray-900 flex items-center gap-1">
                  {user?.name || 'Rider Name'}
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </p>
                <p className="text-sm text-gray-500">VC-001</p>
              </div>
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {user?.name?.charAt(0) || 'R'}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
              </div>
            </button>

            {/* Desktop Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'Rider'}</p>
                  <p className="text-xs text-gray-500">VC-001 • {user?.email || 'rider@example.com'}</p>
                </div>

                {/* Status Toggle */}
                <button
                  onClick={() => setIsOnline(!isOnline)}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100"
                >
                  <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
                  <span>Set as {isOnline ? 'Offline' : 'Online'}</span>
                </button>

                {/* Payments Button */}
                <button
                  onClick={handlePayments}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span>Billing & Payments</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors border-t border-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
                    }
