"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function RiderDashboard() {
  // State to manage active tab
  const [activeTab, setActiveTab] = useState('tracking');
  const [isOnline, setIsOnline] = useState(true);
  const [windowWidth, setWindowWidth] = useState(0);
  
  // Get window width for responsive behavior
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if device is mobile/tablet (you can adjust breakpoints as needed)
  const isMobile = windowWidth < 1024; // Tailwind's lg breakpoint

  // Tabs for rider tracking system
  const tabs = [
    { id: 'tracking', label: 'Tracking', icon: '📍', desktopIcon: '📍 Live Tracking' },
    { id: 'deliveries', label: 'Deliveries', icon: '🛵', desktopIcon: '🛵 Active Deliveries' },
    { id: 'map', label: 'Map', icon: '🗺️', desktopIcon: '🗺️ Navigation Map' },
    { id: 'schedule', label: 'Schedule', icon: '📅', desktopIcon: '📅 Delivery Schedule' },
    { id: 'performance', label: 'Stats', icon: '📈', desktopIcon: '📈 Performance' },
    { id: 'messages', label: 'Messages', icon: '💬', desktopIcon: '💬 Messages' }
  ];

  // Tab content components (simplified for demo)
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tracking':
        return (
          <div className="p-4 lg:p-6">
            <div className="flex justify-between items-center mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl font-bold">Live Tracking Dashboard</h2>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`px-3 lg:px-4 py-1 lg:py-2 rounded-full font-semibold text-sm lg:text-base ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {isOnline ? '🟢 Online' : '🔴 Offline'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-2 bg-gray-200 rounded-lg p-4 h-48 lg:h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl mb-2 lg:mb-4">🗺️</div>
                  <p className="text-gray-600">Live Map View</p>
                  <p className="text-sm text-gray-500 mt-1 lg:mt-2">GPS Tracking Active</p>
                </div>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
                  <h3 className="font-semibold text-gray-600 text-sm lg:text-base">Active Deliveries</h3>
                  <p className="text-2xl lg:text-3xl font-bold">2</p>
                </div>
                <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
                  <h3 className="font-semibold text-gray-600 text-sm lg:text-base">Todays Earnings</h3>
                  <p className="text-2xl lg:text-3xl font-bold">$86.50</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'deliveries':
        return (
          <div className="p-4 lg:p-6">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Active Deliveries</h2>
            <div className="space-y-3 lg:space-y-4">
              {[1, 2].map((item) => (
                <div key={item} className="bg-white p-3 lg:p-4 rounded-lg shadow border-l-4 border-blue-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold lg:text-lg">ORD-7894{item}</h3>
                      <p className="text-gray-600 text-sm lg:text-base">Customer Address #{item}</p>
                      <div className="mt-1 lg:mt-2">
                        <span className={`px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-semibold ${item === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {item === 1 ? '🛒 Pickup' : '📦 Delivery'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl lg:text-2xl font-bold">{item === 1 ? '15' : '8'}min</p>
                      <p className="text-gray-500 text-xs lg:text-sm">ETA</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'map':
        return (
          <div className="p-4 lg:p-6">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Navigation Map</h2>
            <div className="bg-gray-800 h-64 lg:h-96 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-5xl lg:text-6xl mb-3 lg:mb-4">🗺️</div>
                <p className="text-lg lg:text-xl">Full Navigation Map</p>
                <button className="mt-3 lg:mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-semibold text-sm lg:text-base">
                  Open Full Screen
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'schedule':
        return (
          <div className="p-4 lg:p-6">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Delivery Schedule</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="p-3 lg:p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">ORD-7894{item}</p>
                      <p className="text-sm text-gray-600">{item === 1 ? '10:30 AM' : item === 2 ? '11:15 AM' : '12:00 PM'}</p>
                    </div>
                    <span className="px-2 lg:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs lg:text-sm">
                      {item === 1 ? 'Active' : item === 2 ? 'Scheduled' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'performance':
        return (
          <div className="p-4 lg:p-6">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Performance Stats</h2>
            <div className="grid grid-cols-2 gap-3 lg:gap-6">
              <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
                <div className="text-3xl lg:text-4xl mb-2 lg:mb-4">⚡</div>
                <h3 className="font-bold text-sm lg:text-lg">Avg. Speed</h3>
                <p className="text-xl lg:text-3xl font-bold mt-1 lg:mt-2">32 km/h</p>
              </div>
              <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
                <div className="text-3xl lg:text-4xl mb-2 lg:mb-4">🎯</div>
                <h3 className="font-bold text-sm lg:text-lg">On-time Rate</h3>
                <p className="text-xl lg:text-3xl font-bold mt-1 lg:mt-2">98%</p>
              </div>
            </div>
          </div>
        );
      
      case 'messages':
        return (
          <div className="p-4 lg:p-6">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Messages & Alerts</h2>
            <div className="space-y-3 lg:space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4">
                <div className="flex">
                  <div className="text-xl lg:text-2xl mr-2 lg:mr-3">📢</div>
                  <div>
                    <h4 className="font-bold text-sm lg:text-base">System Alert</h4>
                    <p className="text-gray-700 text-sm lg:text-base">Traffic alert on Main Street</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border rounded-lg p-3 lg:p-4">
                <div className="flex">
                  <div className="text-xl lg:text-2xl mr-2 lg:mr-3">👤</div>
                  <div>
                    <h4 className="font-bold text-sm lg:text-base">Customer</h4>
                    <p className="text-gray-700 text-sm lg:text-base">Leave package at door please</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>VendorCity Rider Dashboard</title>
        <meta name="description" content="VendorCity Rider Tracking System" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Desktop Header with Top Navigation */}
      <div className="hidden lg:block">
        <header className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  <span className="text-blue-600">VendorCity</span> Rider
                </h1>
                <p className="text-gray-600 text-sm">Real-time delivery tracking</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-semibold">Michael Rider</p>
                  <p className="text-sm text-gray-500">Vehicle: HD 4587</p>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    MR
                  </div>
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Desktop Top Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 px-4 py-3 border-b-2 font-medium text-sm lg:text-base flex items-center justify-center space-x-2 transition-all
                      ${activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.desktopIcon || tab.label}</span>
                    {tab.id === 'messages' && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        2
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Header (without top navigation) */}
      <div className="lg:hidden">
        <header className="bg-white shadow-lg">
          <div className="px-4 py-3">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  <span className="text-blue-600">VC</span> Rider
                </h1>
                <div className="flex items-center mt-1">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <p className="text-xs text-gray-500">{isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="font-semibold text-sm">Michael R.</p>
                  <p className="text-xs text-gray-500">HD 4587</p>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    MR
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content Area - Adjusted padding for mobile bottom nav */}
      <main className={`max-w-7xl mx-auto ${isMobile ? 'px-4 pb-24' : 'px-6'} ${isMobile ? 'pt-4' : 'pt-0'}`}>
        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {renderTabContent()}
        </div>

        {/* Status Footer for Desktop */}
        <div className="hidden lg:block mt-4 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="font-medium">{isOnline ? 'Live GPS Tracking Active' : 'Tracking Paused'}</span>
            </div>
            <div className="text-sm text-gray-600">
              Last Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile/Tablet Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center px-2 py-2">
          {tabs.slice(0, 3).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg transition-all w-20
                ${activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600'
                }
              `}
            >
              <span className="text-xl mb-1">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
              {tab.id === 'messages' && activeTab !== tab.id && (
                <span className="absolute top-1 right-6 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  2
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex justify-around items-center px-2 py-2 border-t border-gray-100">
          {tabs.slice(3).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg transition-all w-20
                ${activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600'
                }
              `}
            >
              <span className="text-xl mb-1">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
