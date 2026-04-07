"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { ACCEPT_BY_RIDER, ORDER_LIST_QUERY, OrderListResponse } from './lib/types';
import { mapOrdersToDeliveriesBySupplier } from './lib/utils';
import { useWindowSize } from './hooks/useWindowSize';
import Header from './components/Header';
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
import UserProfileTab from './components/UserProfileTab';
import { gql } from '@apollo/client';

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

const LOCATION_TRACKING_MUTATION = gql`
  mutation LocationTracking($input: LocationInput!) {
    locationTracking(input: $input) {
      userID
      latitude
      longitude
    }
  }
`;

export default function RiderDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // State to manage active tab
  const [activeTab, setActiveTab] = useState("newDeliveries");
  const [isOnline, setIsOnline] = useState(true);
  
  // Get window size
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < 1024;

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
    pollInterval: 10000
  });
  
  // Function to get current location and send to server
  const sendCurrentLocation = async () => {
    if (!user?.userId) {
      console.log("❌ No user ID available, skipping location tracking");
      return;
    }
    
    if (!isOnline) {
      console.log("📍 Tracking paused (offline mode)");
      return;
    }

    if (!navigator.geolocation) {
      console.error("❌ Geolocation is not supported by this browser");
      return;
    }

    console.log("🔍 Attempting to get current location...");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`📍 Got location: Lat ${latitude}, Lng ${longitude}, Accuracy: ${accuracy}m`);
        
        try {
          console.log("📤 Sending location to server...", {
            userID: user.userId,
            latitude,
            longitude
          });
          
          const result = await locationTracking({
            variables: {
              input: {
                userID: user.userId,
                latitude: latitude,
                longitude: longitude
              }
            }
          });
          
          console.log("✅ Location sent successfully!", {
            response: result.data?.locationTracking,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error("❌ Error sending location:", error);
        }
      },
      (error) => {
        console.error("❌ Error getting current location:", {
          code: error.code,
          message: error.message,
          // 1: PERMISSION_DENIED, 2: POSITION_UNAVAILABLE, 3: TIMEOUT
        });
        
        // Handle specific error cases
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
  };

  // Start location tracking when online and user is available
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isOnline && user?.userId) {
      console.log("🟢 Starting location tracking - Online mode active");
      console.log(`👤 User ID: ${user.userId}`);
      
      // Send location immediately
      sendCurrentLocation();
      
      // Then send every 15 seconds
      intervalId = setInterval(() => {
        console.log("⏰ 15-second interval triggered - sending location...");
        sendCurrentLocation();
      }, 15000); // Changed to 15 seconds
      
      console.log("⏲️ Location tracking interval set to 15 seconds");
    } else {
      console.log("🔴 Location tracking stopped - Offline mode or no user");
    }

    return () => {
      if (intervalId) {
        console.log("🛑 Cleaning up location tracking interval");
        clearInterval(intervalId);
      }
    };
  }, [isOnline, user?.userId]);

  // Also track location when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("👁️ Tab became visible - sending location update");
        if (isOnline && user?.userId) {
          sendCurrentLocation();
        }
      } else {
        console.log("👻 Tab hidden - continuing background tracking");
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
      router.push('/Login');
    }
    if (user?.role==='USER') {
      router.push('/');
    }
    if (user?.role==='MANAGER') {
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
      alert(`Accepted delivery piece from ${delivery.restaurant}\nOrder: ${delivery.orderId}\nPayout: ${delivery.payout}\nItems: ${delivery.items}\nFrom: ${delivery.pickup}\nTo: ${delivery.dropoff}`);
    }
  };

  // Handle rejecting a delivery
  const handleRejectDelivery = (deliveryId: string) => {
    const delivery = newDeliveries.find(d => d.id === deliveryId);
    if (delivery) {
      alert(`Rejected delivery piece from ${delivery.restaurant}\nOrder: ${delivery.orderId}\nFrom: ${delivery.restaurant}\nCustomer address: ${delivery.dropoff}`);
    }
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "newDeliveries":
        return (
          <NewDeliveriesTab
            isMobile={isMobile}
            onAcceptDelivery={handleAcceptDelivery}
            onRejectDelivery={handleRejectDelivery}
          />
        );
      case "deliveries":
        return <ActiveDeliveriesTab 
                 isMobile={isMobile} 
                 onAcceptDelivery={handleAcceptDelivery}
                 onRejectDelivery={handleRejectDelivery}
                />;
      case "map":
        return <MapTab 
          isMobile={isMobile} 
          deliveries={newDeliveries.map(d => ({
            id: d.id,
            orderId: d.orderId,
            restaurant: d.restaurant,
            customer: d.customer,
            pickup: d.pickup,
            dropoff: d.dropoff,
            pickupAddress: d.pickupAddress,
            dropoffAddress: d.dropoffAddress,
            status: 'PENDING'
          }))}
        />;
      case "history":
        return <RiderPaymentHistory
          riderId={user?.userId}
          showSummary={true}
           // Admin can process payouts manually
        />;
      case "message":
        return <PMTab UserId={user?.userId} />;
      case "user":
        return <UserProfileTab userId={user?.userId}/>;
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

      {/* Header */}
      <Header
        isMobile={isMobile}
        isOnline={isOnline}
        setIsOnline={setIsOnline}
        activeTab={activeTab}
        newDeliveriesCount={newDeliveriesCount}
      />

      {/* Desktop Navigation Tabs */}
      {!isMobile && (
        <NavigationTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobile={isMobile}
          newDeliveriesCount={newDeliveriesCount}
        />
      )}
    </div>
  );
      }
