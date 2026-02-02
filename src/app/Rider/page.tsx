"use client";
import { useState } from "react";
import Head from "next/head";
import { useQuery } from "@apollo/client";
import { ORDER_LIST_QUERY, OrderListResponse } from '@/lib/types';
import { mapOrdersToDeliveriesBySupplier } from '@/lib/utils';
import { useWindowSize } from '@/hooks/useWindowSize';
import Header from '@/components/Header';
import NavigationTabs from '@/components/NavigationTabs';
import NewDeliveriesTab from '@/components/NewDeliveriesTab';
import TrackingTab from '@/components/TrackingTab';
import ActiveDeliveriesTab from '@/components/ActiveDeliveriesTab';
import MapTab from '@/components/MapTab';
import PerformanceTab from '@/components/PerformanceTab';
import { Bell } from "lucide-react";

export default function RiderDashboard() {
  // State to manage active tab
  const [activeTab, setActiveTab] = useState("newDeliveries");
  const [isOnline, setIsOnline] = useState(true);

  // Get window size
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < 1024;

  // GraphQL query for orders
  const { data } = useQuery<OrderListResponse>(ORDER_LIST_QUERY, {
    variables: {
      filter: {
        status: "PENDING"
      },
      pagination: {
        page: 1,
        pageSize: 10
      }
    },
    pollInterval: 10000
  });

  // Transform GraphQL data to delivery format
  const newDeliveries = data?.orderlist?.orders?.flatMap(mapOrdersToDeliveriesBySupplier) || [];
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
      case "tracking":
        return (
          <TrackingTab
            isMobile={isMobile}
            isOnline={isOnline}
            setIsOnline={setIsOnline}
          />
        );
      case "deliveries":
        return <ActiveDeliveriesTab isMobile={isMobile} />;
      case "map":
        return <MapTab isMobile={isMobile} />;
      case "performance":
        return <PerformanceTab isMobile={isMobile} />;
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
