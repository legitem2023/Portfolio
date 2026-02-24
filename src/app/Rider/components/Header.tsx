"use client";
import { useState } from "react";
import { Bell, Package } from "lucide-react";
import { useAuth } from '../hooks/useAuth';

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
      <header className="bg-white shadow-lg">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <Image 
              src="/VendorCity_Rider.webp" 
              alt="Logo" 
              height={100} 
              width={100} 
              className="h-[100%] w-[auto] rounded"
            />
              {/*<h1 className="text-lg font-bold text-gray-900">
                <span className="text-blue-600">VC</span> Rider
              </h1>
              <div className="flex items-center mt-0.5">
                <div className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                <p className="text-xs text-gray-500">{isOnline ? "Online" : "Offline"}</p>
              </div>*/}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-semibold text-xs">{user?.name}</p>
                <p className="text-gray-500 text-xs">{user?.userId}</p>
              </div>
              <div className="relative">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  MR
                </div>
                {newDeliveriesCount > 0 && activeTab !== "newDeliveries" && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {newDeliveriesCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              <span className="text-blue-600">VendorCity</span> Rider Portal
            </h1>
            <p className="text-gray-600 text-sm">
              {newDeliveriesCount} delivery pieces available
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">{user?.name}</p>
              <p className="font-semibold text-gray-500">{user?.userId}</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                MR
              </div>
              <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-red-500"}`}></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
