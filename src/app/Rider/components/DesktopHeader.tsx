"use client";
import { Bell } from "lucide-react";

interface DesktopHeaderProps {
  newDeliveries: any[];
  loading: boolean;
}

export default function DesktopHeader({ newDeliveries, loading }: DesktopHeaderProps) {
  return (
    <div className="hidden lg:block">
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                <span className="text-blue-600">VendorCity</span> Rider Portal
              </h1>
              <p className="text-gray-600 text-sm">
                {loading ? "Loading..." : `${newDeliveries.length} new delivery requests available`}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">Michael Rider</p>
                <p className="text-sm text-gray-500">Vehicle: HD 4587</p>
              </div>
              <div className="relative">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  MR
                </div>
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-green-500`}></div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
