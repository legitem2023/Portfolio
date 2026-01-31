"use client";
import { Bell, Power } from "lucide-react";

interface HeaderProps {
  isMobile: boolean;
  isOnline: boolean;
  newDeliveries: any[];
  loading: boolean;
  setIsOnline: (online: boolean) => void;
}

export default function Header({ isMobile, isOnline, newDeliveries, loading, setIsOnline }: HeaderProps) {
  return (
    <div className="lg:hidden">
      <header className="bg-white shadow-lg">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                <span className="text-blue-600">VC</span> Rider
              </h1>
              <div className="flex items-center mt-0.5">
                <div className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                <p className="text-xs text-gray-500">{isOnline ? "Online" : "Offline"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-semibold text-xs">Michael R.</p>
                <p className="text-gray-500 text-xs">HD 4587</p>
              </div>
              <div className="relative">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  MR
                </div>
                {newDeliveries.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {newDeliveries.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
