"use client";
import { Package, Shield, CheckCircle, Clock } from "lucide-react";
import { formatPeso } from '@/lib/utils';

interface ActiveDeliveriesTabProps {
  isMobile: boolean;
}

export default function ActiveDeliveriesTab({ isMobile }: ActiveDeliveriesTabProps) {
  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
        <Package size={isMobile ? 20 : 24} />
        <span className="text-base lg:text-2xl">Active Deliveries</span>
      </h2>
      
      <div className="space-y-2 lg:space-y-4">
        {[1, 2].map((item) => (
          <div key={item} className="bg-white p-2 lg:p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1 lg:gap-2">
                  <Shield size={isMobile ? 14 : 16} className="text-blue-500" />
                  <h3 className="font-bold text-base lg:text-lg">ORD-7894{item}</h3>
                </div>
                <p className="text-gray-600 text-sm lg:text-base mt-0.5 lg:mt-1">Customer Address #{item}</p>
                <div className="mt-1 lg:mt-2 flex items-center gap-1 lg:gap-2">
                  <span className={`px-1.5 lg:px-3 py-0.5 lg:py-1 rounded-full text-xs font-semibold flex items-center gap-0.5 lg:gap-1 ${item === 1 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                    {item === 1 ? (
                      <>
                        <Package size={isMobile ? 10 : 12} />
                        <span className="text-xs">Pickup</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={isMobile ? 10 : 12} />
                        <span className="text-xs">Delivery</span>
                      </>
                    )}
                  </span>
                  <span className="text-gray-500 text-xs flex items-center gap-0.5 lg:gap-1">
                    <Clock size={isMobile ? 10 : 12} />
                    <span className="text-xs">{item === 1 ? "15 min" : "8 min"} ETA</span>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg lg:text-2xl">{item === 1 ? formatPeso(8.50) : formatPeso(12.00)}</p>
                <p className="text-gray-500 text-xs lg:text-sm">Earnings</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
