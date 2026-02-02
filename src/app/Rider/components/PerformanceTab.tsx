"use client";
import { BarChart, Zap, Target, Star, Truck, DollarSign, Clock } from "lucide-react";
import { formatPeso } from '../lib/utils';

interface PerformanceTabProps {
  isMobile: boolean;
}

export default function PerformanceTab({ isMobile }: PerformanceTabProps) {
  const stats = [
    { icon: <Zap size={isMobile ? 20 : 24} />, label: "Avg. Speed", value: "32 km/h", color: "blue" },
    { icon: <Target size={isMobile ? 20 : 24} />, label: "On-time Rate", value: "98%", color: "green" },
    { icon: <Star size={isMobile ? 20 : 24} />, label: "Rating", value: "4.9/5", color: "yellow" },
    { icon: <Truck size={isMobile ? 20 : 24} />, label: "Today's Trips", value: "7", color: "purple" },
    { icon: <DollarSign size={isMobile ? 20 : 24} />, label: "Avg. Earnings/Trip", value: formatPeso(12.35), color: "green" },
    { icon: <Clock size={isMobile ? 20 : 24} />, label: "Avg. Trip Time", value: "18 min", color: "orange" },
  ];

  const weeklyEarnings = [
    { day: "Mon", earnings: 124.50 },
    { day: "Tue", earnings: 156.75 },
    { day: "Wed", earnings: 142.25 },
    { day: "Thu", earnings: 167.80 },
    { day: "Fri", earnings: 189.40 },
    { day: "Sat", earnings: 212.60 },
    { day: "Sun", earnings: 178.90 },
  ];

  const maxEarnings = Math.max(...weeklyEarnings.map(e => e.earnings));

  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6 flex items-center gap-1 lg:gap-2">
        <BarChart size={isMobile ? 20 : 24} />
        <span className="text-base lg:text-2xl">Performance Stats</span>
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-6 mb-6 lg:mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-3 lg:p-6 rounded-lg shadow border">
            <div className={`flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 ${
              stat.color === 'blue' ? 'bg-blue-100' :
              stat.color === 'green' ? 'bg-green-100' :
              stat.color === 'yellow' ? 'bg-yellow-100' :
              stat.color === 'purple' ? 'bg-purple-100' :
              'bg-orange-100'
            } rounded-lg mb-2 lg:mb-4`}>
              <div className={
                stat.color === 'blue' ? 'text-blue-600' :
                stat.color === 'green' ? 'text-green-600' :
                stat.color === 'yellow' ? 'text-yellow-600' :
                stat.color === 'purple' ? 'text-purple-600' :
                'text-orange-600'
              }>
                {stat.icon}
              </div>
            </div>
            <h3 className="font-bold text-sm lg:text-lg text-center">{stat.label}</h3>
            <p className="font-bold text-xl lg:text-3xl mt-1 lg:mt-2 text-center">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Weekly Earnings Chart */}
      <div className="bg-white p-3 lg:p-6 rounded-lg shadow border">
        <h3 className="font-bold text-lg lg:text-xl mb-4 lg:mb-6">Weekly Earnings</h3>
        <div className="flex items-end justify-between h-40 lg:h-48 border-b border-l border-gray-200 pl-4 lg:pl-6 pb-4 lg:pb-6">
          {weeklyEarnings.map((day, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full max-w-8 lg:max-w-12 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all hover:opacity-90"
                style={{ height: `${(day.earnings / maxEarnings) * 100}%` }}
                title={`₱${day.earnings.toFixed(2)}`}
              ></div>
              <span className="mt-2 text-xs lg:text-sm font-medium text-gray-600">{day.day}</span>
              <span className="mt-1 text-xs text-gray-500">{formatPeso(day.earnings)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 lg:mt-6 flex justify-between items-center">
          <div>
            <p className="text-gray-600 text-sm lg:text-base">Total Weekly Earnings</p>
            <p className="font-bold text-xl lg:text-3xl">
              {formatPeso(weeklyEarnings.reduce((sum, day) => sum + day.earnings, 0))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-green-600 font-semibold text-sm lg:text-base">+12.5% from last week</p>
            <p className="text-gray-500 text-xs lg:text-sm">Best day: Saturday</p>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-4 lg:mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white p-3 lg:p-6 rounded-lg shadow border">
          <h4 className="font-bold text-base lg:text-lg mb-3 lg:mb-4">Top Performance Metrics</h4>
          <div className="space-y-3 lg:space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm lg:text-base">Acceptance Rate</span>
                <span className="font-semibold text-sm lg:text-base">94%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm lg:text-base">Customer Rating</span>
                <span className="font-semibold text-sm lg:text-base">4.9/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '98%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm lg:text-base">On-time Delivery</span>
                <span className="font-semibold text-sm lg:text-base">97.8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '97.8%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 lg:p-6 rounded-lg shadow border">
          <h4 className="font-bold text-base lg:text-lg mb-3 lg:mb-4">Recent Achievements</h4>
          <div className="space-y-3 lg:space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-sm lg:text-base">Perfect Week</p>
                <p className="text-gray-600 text-xs lg:text-sm">100% on-time for 7 days</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Truck size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm lg:text-base">Speed Demon</p>
                <p className="text-gray-600 text-xs lg:text-sm">Avg. delivery time: 15 min</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm lg:text-base">Top Earner</p>
                <p className="text-gray-600 text-xs lg:text-sm">₱1,172.20 this week</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
            }
