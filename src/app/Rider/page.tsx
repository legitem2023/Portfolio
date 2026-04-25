"use client";
import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { ACCEPT_BY_RIDER, ORDER_LIST_QUERY, OrderListResponse } from './lib/types';
import { mapOrdersToDeliveriesBySupplier } from './lib/utils';
import { useWindowSize } from './hooks/useWindowSize';
import Header from './components/Header';
import TopNav from './components/TopNav';
import { useDispatch, useSelector } from "react-redux";
import { setActiveIndex } from '../../../Redux/activeIndexSlice';

import NavigationTabs from './components/NavigationTabs';
import NewDeliveriesTab from './components/NewDeliveriesTab';
import TrackingTab from './components/TrackingTab';
import ActiveDeliveriesTab from './components/ActiveDeliveriesTab';
import PerformanceTab from './components/PerformanceTab';
import { Bell } from "lucide-react";
import dynamic from 'next/dynamic';
import { useAuth } from './hooks/useAuth';
import RiderPaymentHistory from './components/RiderPaymentHistory';
import PMTab from './components/PMTab';
import UserProfile from './components/UserProfile';
import { gql } from '@apollo/client';
import { showToast } from '../../../utils/toastify';

// Dynamically import MapTab to avoid SSR
const MapTab = dynamic(() => import('./components/MapTab'), {
  ssr: false,
  loading: () => (
    <div className="p-2 lg:p-6">
      <div className="bg-gray-100 h-48 lg:h-96 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 lg:w-16 lg:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    </div>
  )
});

// ONLY the mutation - no type definitions here!
const LOCATION_TRACKING_MUTATION = gql`
  mutation LocationTracking($input: LocationTrackingInput) {
    locationTracking(input: $input) {
      userID
      latitude
      longitude
    }
  }
`;

// Define valid tabs for validation
const VALID_TABS = ["newDeliveries", "deliveries", "map", "history", "message", "user"];

export default function RiderDashboard() {
  const router = useRouter();
  const dispatch = useDispatch()
  const { user, loading: authLoading } = useAuth();
    const activeIndex:number = useSelector((state: any) => state.activeIndex.value);

  // State to manage active tab with persistence from localStorage
  const [activeTab, setActiveTab] = useState(() => {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      try {
        const storedTab = localStorage.getItem('riderActiveTab');
        // Validate that the stored tab is one of the valid tabs
        if (storedTab && VALID_TABS.includes(storedTab)) {
          console.log(`📑 Restored tab from localStorage: ${storedTab}`);
          return storedTab;
        }
      } catch (error) {
        console.error("Error reading from localStorage:", error);
      }
    }
    return "newDeliveries";
  });
  
  const [isOnline, setIsOnline] = useState(true);
  
  // Get window size
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < 1024;

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('riderActiveTab', activeTab);
        console.log(`💾 Saved tab to localStorage: ${activeTab}`);
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }
  }, [activeTab]);

  // Refs for tracking optimization
  const watchIdRef = useRef<number | null>(null);
  const lastSendTimeRef = useRef(0);

  // Location tracking mutation
  const [locationTracking] = useMutation(LOCATION_TRACKING_MUTATION);
  
  // GraphQL query for orders
  const { data } = useQuery<OrderListResponse>(ORDER_LIST_QUERY, {
    variables: {
      filter: {
        status: "PENDING",
        riderId: user?.userId
      },
      pagination: {
        page: 1,
        pageSize: 10
      }
    },
    pollInterval: 30000
  });
  
  // Function to send location with rate limiting
  const sendCurrentLocation = async (position: GeolocationPosition) => {
    if (!user?.userId) {
      console.log("❌ No user ID available, skipping location tracking");
      return;
    }
    
    if (!isOnline) {
   //   console.log("📍 Tracking paused (offline mode)");
      return;
    }

    // Rate limiting: Minimum 5 seconds between sends
    const now = Date.now();
    if (now - lastSendTimeRef.current < 5000) {
   //   console.log("⏸️ Rate limited - skipping location send");
      return;
    }

    const { latitude, longitude, accuracy } = position.coords;
   // console.log(`📍 Got location: Lat ${latitude}, Lng ${longitude}, Accuracy: ${accuracy}m`);
    
    try {
     
      
      const result = await locationTracking({
        variables: {
          input: {
            userID: user.userId,
            latitude: latitude,
            longitude: longitude
          }
        }
      });
      
     
      
      lastSendTimeRef.current = now;
    } catch (error) {
      console.error("❌ Error sending location:", error);
    }
  };

  // Start location tracking using watchPosition instead of setInterval
  useEffect(() => {
    // Clean up previous watch if exists
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    if (isOnline && user?.userId && navigator.geolocation) {
      
      // Use watchPosition for continuous tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        sendCurrentLocation,
        (error: GeolocationPositionError) => {
          console.error("❌ Error getting current location:", {
            code: error.code,
            message: error.message,
          });
          
          switch(error.code) {
            case 1:
              console.log("⚠️ User denied geolocation permission");
              break;
            case 2:
              console.log("⚠️ Position unavailable (check GPS)");
              break;
            case 3:
              console.log("⚠️ Location request timed out");
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
      
    //  console.log("📍 Location watch started");
    } else {
      if (watchIdRef.current !== null) {
        console.log("🔴 Location tracking stopped - Offline mode or no user");
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        console.log("🛑 Cleaning up location tracking");
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isOnline, user?.userId]);

  // Also track location when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("👁️ Tab became visible - checking location");
        if (isOnline && user?.userId && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            sendCurrentLocation,
            (error: GeolocationPositionError) => console.error("Error getting location:", error),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOnline, user?.userId]);

  // Log when online status changes
  useEffect(() => {
    console.log(`🔄 Online status changed to: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
  }, [isOnline]);

  // Log when user is loaded
  useEffect(() => {
    if (user) {
      console.log(`👤 User loaded: ${user.userId} (${user.role})`);
    }
  }, [user]);

  // Redirect to login if no user
  useEffect(() => {
    if (!authLoading && !user) {
      // Clear stored tab when redirecting to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('riderActiveTab');
      }
      router.push('/Login');
    }
    if (user?.role === 'USER') {
      router.push('/');
    }
    if (user?.role === 'MANAGER') {
      router.push('/Management');
    }
  }, [authLoading, user, router]);

  // Show nothing while checking auth or if no user (will redirect)
  if (authLoading || !user) {
    return null;
  }

  // Transform GraphQL data to delivery format
  const newDeliveries = data?.neworder?.orders.flatMap(mapOrdersToDeliveriesBySupplier) || [];
  const newDeliveriesCount = newDeliveries.length;

  // Handle accepting a delivery
  const handleAcceptDelivery = (deliveryId: string) => {
    const delivery = newDeliveries.find(d => d.id === deliveryId);
    if (delivery) {
const truncate = (str:any, maxLen:number) => {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str;
};

// Get max content length
const contents = [
  `🏪 ${delivery.restaurant}`,
  `🆔 ${delivery.orderId}`,
  `💰 $${delivery.payout}`,
  `📦 ${delivery.items}`,
  `📍 ${delivery.pickup}`,
  `🎯 ${delivery.dropoff}`
];

const maxLen = Math.min(Math.max(...contents.map(c => c.length)), 28); // Cap at 28 chars

const formatRow = (icon: any, value: any) => {
  // Convert to string and handle null/undefined
  const stringValue = value === null || value === undefined ? '' : String(value);
  const truncated = truncate(stringValue, maxLen - 3);
  const padded = truncated.padEnd(maxLen - 3);
  return `${icon} ${padded}`;
};
      
const border = '─'.repeat(maxLen + 2);

showToast('Delivery Accepted!','success');
    }
  };

  // Handle rejecting a delivery
  const handleRejectDelivery = (deliveryId: string) => {
    const delivery = newDeliveries.find(d => d.id === deliveryId);
    if (delivery) {
      alert(`Rejected delivery piece from ${delivery.restaurant}\nOrder: ${delivery.orderId}\nFrom: ${delivery.restaurant}\nCustomer address: ${delivery.dropoff}`);
    }
  };

  // Handle tab change with persistence
  const handleTabChange = (tab: number) => {
    dispatch(setActiveIndex(tab));
    // The useEffect will handle saving to localStorage
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeIndex) {
      case 0:
        return (
          <NewDeliveriesTab
            isMobile={isMobile}
            onAcceptDelivery={handleAcceptDelivery}
            onRejectDelivery={handleRejectDelivery}
          />
        );
      case 1:
        return <ActiveDeliveriesTab 
                 isMobile={isMobile} 
                 onAcceptDelivery={handleAcceptDelivery}
                 onRejectDelivery={handleRejectDelivery}
                />;
      case 2:
        return <RiderPaymentHistory
          riderId={user?.userId}
          showSummary={true}
        />;
      case 3:
        return <PMTab UserId={user?.userId} />;
      case 4:
        return <UserProfile userId={user?.userId}/>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100">
      <Head>
        <title>VendorCity Rider Dashboard</title>
        <meta name="description" content="VendorCity Rider Tracking System" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* TopNav */}
      <Header user={user}/>
      {/*<TopNav
        isMobile={isMobile}
        isOnline={isOnline}
        setIsOnline={setIsOnline}
        activeTab={activeTab}
        newDeliveriesCount={newDeliveriesCount}
      />*/}

      {/* Desktop Navigation Tabs */}
      {!isMobile && (
        <NavigationTabs
          activeTab={activeIndex}
          setActiveTab={handleTabChange}
          isMobile={isMobile}
          newDeliveriesCount={newDeliveriesCount}
        />
      )}

      {/* Main Content Area */}
      <main className={`max-w-7xl mx-auto ${isMobile ? "px-2 pb-24" : "px-6"} ${isMobile ? "pt-2" : "pt-0"}`}>
        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {renderTabContent()}
        </div>

        {/* Status Footer for Desktop */}
        {!isMobile && (
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                <span className="font-medium">{isOnline ? "Live GPS Tracking Active" : "Tracking Paused"}</span>
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Bell size={16} />
                {newDeliveriesCount} delivery piece{newDeliveriesCount !== 1 ? "s" : ""} available
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile/Tablet Bottom Navigation */}
      {isMobile && (
        <NavigationTabs
          activeTab={activeIndex}
          setActiveTab={handleTabChange}
          isMobile={isMobile}
          newDeliveriesCount={newDeliveriesCount}
        />
      )}
    </div>
  );
      }
