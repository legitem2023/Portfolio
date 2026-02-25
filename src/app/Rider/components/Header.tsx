"use client";
import { useState } from "react";
import { Bell, Package } from "lucide-react";
import { useAuth } from '../hooks/useAuth';
import Image from 'next/image';

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
  
  if (isMobile) {
    return (
      <header className="bg-gray-900 shadow-md sticky top-0 z-50">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-2">
              <Image 
                src="/VendorCity_Rider.webp" 
                alt="VendorCity Rider" 
                height={58} 
                width={58} 
                className="h-16 w-auto rounded-lg"
              />
            </div>

            {/* User Section */}
            <div className="flex items-center gap-3">
              {/* Notification Badge */}
              {newDeliveriesCount > 0 && activeTab !== "newDeliveries" && (
                <div className="relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {newDeliveriesCount > 9 ? '9+' : newDeliveriesCount}
                  </span>
                </div>
              )}

              {/* User Info & Avatar */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {user?.name || 'Rider'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.userId || 'VC-001'}
                  </p>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {user?.name?.charAt(0) || 'R'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Image 
              src="/VendorCity_Rider.webp" 
              alt="VendorCity Rider" 
              height={52} 
              width={52} 
              className="h-13 w-auto rounded-lg"
              priority
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                <span className="text-blue-600">VendorCity</span> Rider
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

          {/* User Section */}
          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            {newDeliveriesCount > 0 && activeTab !== "newDeliveries" && (
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-600 hover:text-blue-600 cursor-pointer transition-colors" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {newDeliveriesCount > 9 ? '9+' : newDeliveriesCount}
                </span>
              </div>
            )}

            {/* User Info & Avatar */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold text-gray-900">{user?.name || 'Rider Name'}</p>
                <p className="text-sm text-gray-500">{user?.userId || 'VC-001'}</p>
              </div>
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {user?.name?.charAt(0) || 'R'}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
