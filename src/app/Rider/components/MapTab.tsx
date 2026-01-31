"use client";
import { Map } from "lucide-react";

interface MapTabProps {
  isMobile: boolean;
}

export default function MapTab({ isMobile }: MapTabProps) {
  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
        <Map size={isMobile ? 20 : 24} />
        <span className="text-base lg:text-2xl">Navigation Map</span>
      </h2>
      <div className="bg-gray-900 h-48 lg:h-96 rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <Map className="w-12 h-12 lg:w-20 lg:h-20 mx-auto mb-2 lg:mb-4 text-blue-400" />
          <p className="text-base lg:text-xl font-medium">Full Navigation Map</p>
          <p className="text-gray-400 text-sm lg:text-base mt-0.5 lg:mt-2">Interactive GPS View</p>
        </div>
      </div>
    </div>
  );
}
