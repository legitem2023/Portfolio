"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import { useQuery, gql } from "@apollo/client";
import Header from "./components/Header";
import DesktopHeader from "./components/DesktopHeader";
import NavigationTabs from "./components/NavigationTabs";
import StatusFooter from "./components/StatusFooter";
import NewDeliveriesTab from "./components/NewDeliveriesTab";
import TrackingTab from "./components/TrackingTab";
import ActiveDeliveriesTab from "./components/ActiveDeliveriesTab";
import MapTab from "./components/MapTab";
import PerformanceTab from "./components/PerformanceTab";
import { mapOrderToDelivery } from "./lib/utils";

// GraphQL Query with address field
const ORDER_LIST_QUERY = gql`
  query OrderList(
    $filter: OrderFilterInput
    $pagination: OrderPaginationInput
  ) {
    orderlist(filter: $filter, pagination: $pagination) {
      orders {
        id
        orderNumber
        status
        total
        createdAt
        user {
          id
          firstName
          email
        }
        address {
          id
          street
          city
          state
          zipCode
          country
        }
        items {
          id
          supplierId
          quantity
          price
          product {
            name
            sku
          }
          supplier {
            id
            firstName
            addresses {
              street
              city
              state
              zipCode
              country
            }
          }
        }
        payments {
          id
          amount
          method
          status
        }
      }
      pagination {
        total
        page
        pageSize
        totalPages
      }
    }
  }
`;

export default function RiderDashboard() {
  // State to manage active tab
  const [activeTab, setActiveTab] = useState("newDeliveries");
  const [isOnline, setIsOnline] = useState(true);
  const [windowWidth, setWindowWidth] = useState(0);
  
  // GraphQL query for orders
  const { data, loading, error, refetch } = useQuery(ORDER_LIST_QUERY, {
    variables: {
      filter: {
        status: "PENDING"
      },
      pagination: {
        page: 1,
        pageSize: 10
      }
    },
    pollInterval: 10000,
    fetchPolicy: "network-only"
  });

  // Transform GraphQL data to delivery format
  const newDeliveries = data?.orderlist?.orders?.map(mapOrderToDelivery) || [];
  console.log("New deliveries:", newDeliveries);
  console.log("Raw order data:", data?.orderlist?.orders);

  // Get window width for responsive behavior
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if device is mobile/tablet
  const isMobile = windowWidth < 1024;

  // Handle accepting a delivery
  const handleAcceptDelivery = (deliveryId: string) => {
    const delivery = newDeliveries.find(d => d.id === deliveryId);
    if (delivery) {
      alert(`Accepted delivery: ${delivery.orderId} - ${delivery.payout} payout\nFrom: ${delivery.restaurant}\nTo: ${delivery.dropoff}`);
      refetch();
    }
  };

  // Handle rejecting a delivery
  const handleRejectDelivery = (deliveryId: string) => {
    const delivery = newDeliveries.find(d => d.id === deliveryId);
    if (delivery) {
      alert(`Rejected delivery: ${delivery.orderId}\nFrom: ${delivery.restaurant}\nCustomer address: ${delivery.dropoff}`);
      refetch();
    }
  };

  // Tab content components
  const renderTabContent = () => {
    switch (activeTab) {
      case "newDeliveries":
        return (
          <NewDeliveriesTab
            isMobile={isMobile}
            newDeliveries={newDeliveries}
            loading={loading}
            error={error}
            refetch={refetch}
            handleAcceptDelivery={handleAcceptDelivery}
            handleRejectDelivery={handleRejectDelivery}
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
        return (
          <ActiveDeliveriesTab isMobile={isMobile} />
        );
      
      case "map":
        return (
          <MapTab isMobile={isMobile} />
        );
      
      case "performance":
        return (
          <PerformanceTab isMobile={isMobile} />
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
      <DesktopHeader newDeliveries={newDeliveries} loading={loading} />

      {/* Mobile/Tablet Header (without top navigation) */}
      <Header
        isMobile={isMobile}
        isOnline={isOnline}
        newDeliveries={newDeliveries}
        loading={loading}
        setIsOnline={setIsOnline}
      />

      {/* Desktop Top Navigation Tabs */}
      <NavigationTabs
        isMobile={isMobile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        newDeliveries={newDeliveries}
      />

      {/* Main Content Area - Adjusted padding for mobile bottom nav */}
      <main className={`max-w-7xl mx-auto ${isMobile ? "px-2 pb-24" : "px-6"} ${isMobile ? "pt-2" : "pt-0"}`}>
        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {renderTabContent()}
        </div>

        {/* Status Footer for Desktop */}
        <StatusFooter
          isOnline={isOnline}
          newDeliveries={newDeliveries}
          loading={loading}
        />
      </main>

      {/* Mobile/Tablet Bottom Navigation */}
      <NavigationTabs
        isMobile={isMobile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        newDeliveries={newDeliveries}
      />
    </div>
  );
          }
