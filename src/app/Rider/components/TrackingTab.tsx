"use client";
import { Package, Zap, MapPin, AlertTriangle, CheckCircle, Phone, Power, Navigation } from "lucide-react";
import { formatPeso } from "@/lib/utils";

interface TrackingTabProps {
  isMobile: boolean;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

export default function TrackingTab({ isMobile, isOnline, setIsOnline }: TrackingTabProps) {
  return (
    <div className="p-2 lg:p-6">
      <div className="flex justify-between items-center mb-3 lg:mb-6">
        <h2 className="text-lg lg:text-2xl font-bold">Live Tracking Dashboard</h2>
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-0.5 lg:py-2 rounded-full font-semibold text-xs lg:text-base ${isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {isOnline ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs lg:text-base">Online</span>
            </>
          ) : (
            <>
              <Power size={isMobile ? 14 : 16} />
              <span className="text-xs lg:text-base">Offline</span>
            </>
          )}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
        <div className="lg:col-span-2 bg-gray-100 rounded-lg p-3 lg:p-4 h-40 lg:h-64 flex flex-col items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 lg:w-20 lg:h-20 text-blue-600 mx-auto mb-2 lg:mb-4" />
            <p className="text-gray-700 font-medium text-sm lg:text-base">Live Map View</p>
            <p className="text-gray-500 text-xs lg:text-sm mt-0.5 lg:mt-2">GPS Tracking Active</p>
          </div>
        </div>

        <div className="space-y-2 lg:space-y-4">
          <div className="bg-white p-2 lg:p-4 rounded-lg shadow border">
            <h3 className="font-semibold text-gray-600 text-xs lg:text-base flex items-center gap-1 lg:gap-2">
              <Package size={isMobile ? 16 : 18} />
              <span className="text-sm lg:text-base">Active Deliveries</span>
            </h3>
            <p className="font-bold text-xl lg:text-3xl mt-1 lg:mt-2">2</p>
          </div>
          <div className="bg-white p-2 lg:p-4 rounded-lg shadow border">
            <h3 className="font-semibold text-gray-600 text-xs lg:text-base flex items-center gap-1 lg:gap-2">
              <Zap size={isMobile ? 16 : 18} />
              <span className="text-sm lg:text-base">Today&apos;s Earnings</span>
            </h3>
            <p className="font-bold text-xl lg:text-3xl mt-1 lg:mt-2">{formatPeso(86.50)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 lg:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 lg:gap-4">
        <button className="bg-blue-500 text-white p-2 lg:p-3 rounded-lg font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-1 lg:gap-2 text-xs lg:text-sm">
          <MapPin size={isMobile ? 16 : 18} />
          <span className="hidden sm:inline">Set Destination</span>
          <span className="sm:hidden">Destination</span>
        </button>
        <button className="bg-red-500 text-white p-2 lg:p-3 rounded-lg font-semibold hover:bg-red-600 transition flex items-center justify-center gap-1 lg:gap-2 text-xs lg:text-sm">
          <AlertTriangle size={isMobile ? 16 : 18} />
          <span className="hidden sm:inline">Emergency</span>
          <span className="sm:hidden">Emergency</span>
        </button>
        <button className="bg-green-500 text-white p-2 lg:p-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-1 lg:gap-2 text-xs lg:text-sm">
          <CheckCircle size={isMobile ? 16 : 18} />
          <span className="hidden sm:inline">Complete</span>
          <span className="sm:hidden">Complete</span>
        </button>
        <button className="bg-purple-500 text-white p-2 lg:p-3 rounded-lg font-semibold hover:bg-purple-600 transition flex items-center justify-center gap-1 lg:gap-2 text-xs lg:text-sm">
          <Phone size={isMobile ? 16 : 18} />
          <span className="hidden sm:inline">Call</span>
          <span className="sm:hidden">Call</span>
        </button>
      </div>
    </div>
  );
}
