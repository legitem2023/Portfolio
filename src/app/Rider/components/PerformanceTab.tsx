"use client";
import { BarChart, Zap, Target } from "lucide-react";

interface PerformanceTabProps {
  isMobile: boolean;
}

export default function PerformanceTab({ isMobile }: PerformanceTabProps) {
  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
        <BarChart size={isMobile ? 20 : 24} />
        <span className="text-base lg:text-2xl">Performance Stats</span>
      </h2>
      <div className="grid grid-cols-2 gap-2 lg:gap-6">
        <div className="bg-white p-3 lg:p-6 rounded-lg shadow border">
          <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg mb-2 lg:mb-4">
            <Zap size={isMobile ? 20 : 24} className="text-blue-600" />
          </div>
          <h3 className="font-bold text-sm lg:text-lg">Avg. Speed</h3>
          <p className="font-bold text-xl lg:text-3xl mt-1 lg:mt-2">32 km/h</p>
        </div>
        <div className="bg-white p-3 lg:p-6 rounded-lg shadow border">
          <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg mb-2 lg:mb-4">
            <Target size={isMobile ? 20 : 24} className="text-green-600" />
          </div>
          <h3 className="font-bold text-sm lg:text-lg">On-time Rate</h3>
          <p className="font-bold text-xl lg:text-3xl mt-1 lg:mt-2">98%</p>
        </div>
      </div>
    </div>
  );
}
