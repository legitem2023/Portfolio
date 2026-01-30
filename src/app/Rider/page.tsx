"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import { 
  Navigation, 
  Package, 
  Map, 
  Calendar,
  BarChart,
  MessageSquare,
  User,
  Bell,
  Shield,
  Battery,
  Wifi,
  Zap,
  Target,
  Star,
  Clock,
  Phone,
  AlertTriangle,
  MapPin,
  CheckCircle,
  Power,
  Truck,
  DollarSign,
  AlertCircle,
  ThumbsUp,
  X
} from "lucide-react";

export default function RiderDashboard() {
  // State to manage active tab
  const [activeTab, setActiveTab] = useState("newDeliveries");
  const [isOnline, setIsOnline] = useState(true);
  const [windowWidth, setWindowWidth] = useState(0);
  const [newDeliveries, setNewDeliveries] = useState([
    {
      id: 1,
      orderId: "ORD-78947",
      restaurant: "Burger Palace",
      customer: "Alex Johnson",
      distance: "1.2 miles",
      pickup: "123 Main St",
      dropoff: "456 Oak Ave",
      payout: "$8.75",
      expiresIn: "45s",
      items: 2
    },
    {
      id: 2,
      orderId: "ORD-78948",
      restaurant: "Pizza Corner",
      customer: "Maria Garcia",
      distance: "0.8 miles",
      pickup: "789 Center St",
      dropoff: "321 Pine Rd",
      payout: "$12.50",
      expiresIn: "1m 20s",
      items: 4
    },
    {
      id: 3,
      orderId: "ORD-78949",
      restaurant: "Sushi World",
      customer: "David Kim",
      distance: "2.1 miles",
      pickup: "555 River Blvd",
      dropoff: "888 Hill St",
      payout: "$15.25",
      expiresIn: "2m 10s",
      items: 3
    }
  ]);
  
  // Get window width for responsive behavior
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if device is mobile/tablet
  const isMobile = windowWidth < 1024;

  // Tabs for rider tracking system - New Deliveries first
  const tabs = [
    { 
      id: "newDeliveries", 
      label: "New", 
      icon: <Bell size={isMobile ? 20 : 24} />,
      desktopLabel: "New Deliveries",
      hasNotification: true 
    },
    { 
      id: "tracking", 
      label: "Tracking", 
      icon: <Navigation size={isMobile ? 20 : 24} />,
      desktopLabel: "Live Tracking" 
    },
    { 
      id: "deliveries", 
      label: "Active", 
      icon: <Package size={isMobile ? 20 : 24} />,
      desktopLabel: "Active Deliveries" 
    },
    { 
      id: "map", 
      label: "Map", 
      icon: <Map size={isMobile ? 20 : 24} />,
      desktopLabel: "Navigation Map" 
    },
    { 
      id: "performance", 
      label: "Stats", 
      icon: <BarChart size={isMobile ? 20 : 24} />,
      desktopLabel: "Performance" 
    }
  ];

  // Handle accepting a delivery
  const handleAcceptDelivery = (deliveryId) => {
    const delivery = newDeliveries.find(d => d.id === deliveryId);
    alert(`Accepted delivery: ${delivery.orderId} - ${delivery.payout} payout`);
    setNewDeliveries(newDeliveries.filter(d => d.id !== deliveryId));
  };

  // Handle rejecting a delivery
  const handleRejectDelivery = (deliveryId) => {
    const delivery = newDeliveries.find(d => d.id === deliveryId);
    alert(`Rejected delivery: ${delivery.orderId}`);
    setNewDeliveries(newDeliveries.filter(d => d.id !== deliveryId));
  };

  // Tab content components
  const renderTabContent = () => {
    switch (activeTab) {
      case "newDeliveries":
        return (
          <div className="p-4 lg:p-6">
            <div className="flex justify-between items-center mb-4 lg:mb-6">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
                  <Bell size={24} className="text-orange-500" />
                  New Delivery Requests
                </h2>
                <p className="text-gray-600 text-sm lg:text-base mt-1">
                  {newDeliveries.length} pending request{newDeliveries.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle size={16} />
                <span>Requests auto-expire in 2 minutes</span>
              </div>
            </div>

            {newDeliveries.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Bell size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No New Requests</h3>
                <p className="text-gray-500 mt-2">New delivery requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-4 lg:space-y-6">
                {newDeliveries.map((delivery) => (
                  <div key={delivery.id} className="bg-white rounded-lg shadow-lg border border-orange-200 overflow-hidden">
                    {/* Header with timer */}
                    <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <span className="font-bold text-orange-700">NEW REQUEST</span>
                        </div>
                        <div className="flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full">
                          <Clock size={14} className="text-orange-600" />
                          <span className="font-bold text-orange-700">{delivery.expiresIn}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 lg:p-6">
                      {/* Order info */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Shield size={18} className="text-blue-500" />
                            <h3 className="text-lg lg:text-xl font-bold">{delivery.orderId}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <Truck size={16} />
                            <span className="font-medium">{delivery.restaurant}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <User size={16} />
                            <span>{delivery.customer}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl lg:text-3xl font-bold text-green-600">{delivery.payout}</div>
                          <p className="text-sm text-gray-500">Payout</p>
                        </div>
                      </div>

                      {/* Route info */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin size={16} className="text-blue-500" />
                            <span className="font-semibold text-sm">Pickup</span>
                          </div>
                          <p className="text-gray-700">{delivery.pickup}</p>
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <div className="w-full border-t-2 border-dashed border-gray-300 relative">
                            <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                              <div className="flex items-center gap-1 text-gray-500">
                                <Navigation size={14} />
                                <span className="text-sm font-medium">{delivery.distance}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin size={16} className="text-green-500" />
                            <span className="font-semibold text-sm">Dropoff</span>
                          </div>
                          <p className="text-gray-700">{delivery.dropoff}</p>
                        </div>
                      </div>

                      {/* Additional info */}
                      <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                          <Package size={16} className="text-gray-600" />
                          <span className="text-sm font-medium">{delivery.items} item{delivery.items !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                          <Navigation size={16} className="text-gray-600" />
                          <span className="text-sm font-medium">{delivery.distance} away</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                          <Clock size={16} className="text-gray-600" />
                          <span className="text-sm font-medium">~15-20 min</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-3 lg:gap-4">
                        <button
                          onClick={() => handleRejectDelivery(delivery.id)}
                          className="bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                        >
                          <X size={20} />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => handleAcceptDelivery(delivery.id)}
                          className="bg-green-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
                        >
                          <ThumbsUp size={20} />
                          <span>Accept Delivery</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom stats */}
            <div className="mt-6 lg:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <div className="bg-blue-50 p-3 lg:p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-gray-600">Today&apos;s Earnings</p>
                <p className="text-xl lg:text-2xl font-bold">$86.50</p>
              </div>
              <div className="bg-green-50 p-3 lg:p-4 rounded-lg border border-green-100">
                <p className="text-sm text-gray-600">Acceptance Rate</p>
                <p className="text-xl lg:text-2xl font-bold">94%</p>
              </div>
              <div className="bg-purple-50 p-3 lg:p-4 rounded-lg border border-purple-100">
                <p className="text-sm text-gray-600">Avg. Payout</p>
                <p className="text-xl lg:text-2xl font-bold">$12.15</p>
              </div>
              <div className="bg-orange-50 p-3 lg:p-4 rounded-lg border border-orange-100">
                <p className="text-sm text-gray-600">Response Time</p>
                <p className="text-xl lg:text-2xl font-bold">8s</p>
              </div>
            </div>
          </div>
        );
      
      case "tracking":
        return (
          <div className="p-4 lg:p-6">
            <div className="flex justify-between items-center mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl font-bold">Live Tracking Dashboard</h2>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`flex items-center gap-2 px-3 lg:px-4 py-1 lg:py-2 rounded-full font-semibold text-sm lg:text-base ${isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {isOnline ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Online
                  </>
                ) : (
                  <>
                    <Power size={16} />
                    Offline
                  </>
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-2 bg-gray-100 rounded-lg p-4 h-48 lg:h-64 flex flex-col items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 lg:w-20 lg:h-20 text-blue-600 mx-auto mb-3 lg:mb-4" />
                  <p className="text-gray-700 font-medium">Live Map View</p>
                  <p className="text-sm text-gray-500 mt-1 lg:mt-2">GPS Tracking Active</p>
                </div>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <div className="bg-white p-3 lg:p-4 rounded-lg shadow border">
                  <h3 className="font-semibold text-gray-600 text-sm lg:text-base flex items-center gap-2">
                    <Package size={18} />
                    Active Deliveries
                  </h3>
                  <p className="text-2xl lg:text-3xl font-bold mt-2">2</p>
                </div>
                <div className="bg-white p-3 lg:p-4 rounded-lg shadow border">
                  <h3 className="font-semibold text-gray-600 text-sm lg:text-base flex items-center gap-2">
                    <Zap size={18} />
                    Today&apos;s Earnings
                  </h3>
                  <p className="text-2xl lg:text-3xl font-bold mt-2">$86.50</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
              <button className="bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2">
                <MapPin size={18} />
                <span className="hidden sm:inline">Set Destination</span>
                <span className="sm:hidden">Destination</span>
              </button>
              <button className="bg-red-500 text-white p-3 rounded-lg font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2">
                <AlertTriangle size={18} />
                <span className="hidden sm:inline">Emergency</span>
                <span className="sm:hidden">Emergency</span>
              </button>
              <button className="bg-green-500 text-white p-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2">
                <CheckCircle size={18} />
                <span className="hidden sm:inline">Complete</span>
                <span className="sm:hidden">Complete</span>
              </button>
              <button className="bg-purple-500 text-white p-3 rounded-lg font-semibold hover:bg-purple-600 transition flex items-center justify-center gap-2">
                <Phone size={18} />
                <span className="hidden sm:inline">Call</span>
                <span className="sm:hidden">Call</span>
              </button>
            </div>
          </div>
        );
      
      case "deliveries":
        return (
          <div className="p-4 lg:p-6">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6 flex items-center gap-2">
              <Package size={24} />
              Active Deliveries
            </h2>
            
            <div className="space-y-3 lg:space-y-4">
              {[1, 2].map((item) => (
                <div key={item} className="bg-white p-3 lg:p-4 rounded-lg shadow border-l-4 border-blue-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-blue-500" />
                        <h3 className="font-bold lg:text-lg">ORD-7894{item}</h3>
                      </div>
                      <p className="text-gray-600 text-sm lg:text-base mt-1">Customer Address #{item}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-semibold flex items-center gap-1 ${item === 1 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                          {item === 1 ? (
                            <>
                              <Package size={12} />
                              Pickup
                            </>
                          ) : (
                            <>
                              <CheckCircle size={12} />
                              Delivery
                            </>
                          )}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={12} />
                          {item === 1 ? "15 min" : "8 min"} ETA
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl lg:text-2xl font-bold">${item === 1 ? "8.50" : "12.00"}</p>
                      <p className="text-gray-500 text-xs lg:text-sm">Earnings</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case "map":
        return (
          <div className="p-4 lg:p-6">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6 flex items-center gap-2">
              <Map size={24} />
              Navigation Map
            </h2>
            <div className="bg-gray-900 h-64 lg:h-96 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Map className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-3 lg:mb-4 text-blue-400" />
                <p className="text-lg lg:text-xl font-medium">Full Navigation Map</p>
                <p className="text-gray-400 mt-1 lg:mt-2">Interactive GPS View</p>
              </div>
            </div>
          </div>
        );
      
      case "performance":
        return (
          <div className="p-4 lg:p-6">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6 flex items-center gap-2">
              <BarChart size={24} />
              Performance Stats
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:gap-6">
              <div className="bg-white p-4 lg:p-6 rounded-lg shadow border">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3 lg:mb-4">
                  <Zap size={24} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-sm lg:text-lg">Avg. Speed</h3>
                <p className="text-xl lg:text-3xl font-bold mt-1 lg:mt-2">32 km/h</p>
              </div>
              <div className="bg-white p-4 lg:p-6 rounded-lg shadow border">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3 lg:mb-4">
                  <Target size={24} className="text-green-600" />
                </div>
                <h3 className="font-bold text-sm lg:text-lg">On-time Rate</h3>
                <p className="text-xl lg:text-3xl font-bold mt-1 lg:mt-2">98%</p>
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
                  <span className="text-blue-600">VendorCity</span> Rider Portal
                </h1>
                <p className="text-gray-600 text-sm">New delivery requests available</p>
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
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-red-500"}`}></div>
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
                      flex-1 px-4 py-3 border-b-2 font-medium text-sm lg:text-base flex items-center justify-center gap-2 transition-all
                      ${activeTab === tab.id
                        ? "border-blue-600 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }
                    `}
                  >
                    {tab.icon}
                    <span>{tab.desktopLabel}</span>
                    {tab.hasNotification && newDeliveries.length > 0 && activeTab !== tab.id && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {newDeliveries.length}
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
                  <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                  <p className="text-xs text-gray-500">{isOnline ? "Online" : "Offline"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-sm">Michael R.</p>
                  <p className="text-xs text-gray-500">HD 4587</p>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    MR
                  </div>
                  {newDeliveries.length > 0 && activeTab !== "newDeliveries" && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {newDeliveries.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content Area - Adjusted padding for mobile bottom nav */}
      <main className={`max-w-7xl mx-auto ${isMobile ? "px-4 pb-24" : "px-6"} ${isMobile ? "pt-4" : "pt-0"}`}>
        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {renderTabContent()}
        </div>

        {/* Status Footer for Desktop */}
        <div className="hidden lg:block mt-4 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
              <span className="font-medium">{isOnline ? "Live GPS Tracking Active" : "Tracking Paused"}</span>
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Bell size={16} />
              {newDeliveries.length} new request{newDeliveries.length !== 1 ? "s" : ""} available
            </div>
          </div>
        </div>
      </main>

      {/* Mobile/Tablet Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center px-2 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg transition-all w-16
                ${activeTab === tab.id
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600"
                }
              `}
            >
              <div className="relative">
                {tab.icon}
                {tab.hasNotification && newDeliveries.length > 0 && activeTab !== tab.id && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {newDeliveries.length}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
