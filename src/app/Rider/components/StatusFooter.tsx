"use client";
import { Bell } from "lucide-react";

interface StatusFooterProps {
  isOnline: boolean;
  newDeliveries: any[];
  loading: boolean;
}

export default function StatusFooter({ isOnline, newDeliveries, loading }: StatusFooterProps) {
  return (
    <div className="hidden lg:block mt-4 bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
          <span className="font-medium">{isOnline ? "Live GPS Tracking Active" : "Tracking Paused"}</span>
        </div>
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <Bell size={16} />
          {loading ? "Loading..." : `${newDeliveries.length} new request${newDeliveries.length !== 1 ? "s" : ""} available`}
        </div>
      </div>
    </div>
  );
}
