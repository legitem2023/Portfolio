import { 
  Navigation, 
  Package, 
  Map, 
  BarChart,
  Bell,
  User
} from "lucide-react";
import { TabType } from '../lib/types';

export const TABS: TabType[] = [
  { 
    id: "newDeliveries", 
    label: "New", 
    icon: <Bell size={24} />,
    desktopLabel: "New Deliveries",
    hasNotification: true 
  },
  { 
    id: "tracking", 
    label: "Tracking", 
    icon: <Navigation size={24} />,
    desktopLabel: "Live Tracking" 
  },
  { 
    id: "deliveries", 
    label: "Active", 
    icon: <Package size={24} />,
    desktopLabel: "Active Deliveries" 
  },
  { 
    id: "map", 
    label: "Map", 
    icon: <Map size={24} />,
    desktopLabel: "Navigation Map" 
  },
  { 
    id: "performance", 
    label: "Stats", 
    icon: <BarChart size={24} />,
    desktopLabel: "Performance" 
  }
];

export const MOCK_DELIVERIES = [
  {
    id: "1",
    orderId: "ORD-78941",
    restaurant: "Jollibee - Makati",
    customer: "Juan Dela Cruz",
    distance: "1-2 miles",
    pickup: "Jollibee, Ayala Avenue, Makati City, 1200",
    dropoff: "1234 Legaspi Street, Legaspi Village, Makati City, 1229",
    payout: "₱12.50",
    payoutAmount: 12.50,
    expiresIn: "1m 30s",
    items: 3,
    isPartialDelivery: false,
    totalSuppliersInOrder: 1,
    supplierIndex: 1,
    subtotal: "₱41.67",
    supplierItems: [
      {
        id: "item1",
        product: { name: "Chickenjoy Bucket", sku: "JB-001" },
        quantity: 1,
        price: 299.00
      },
      {
        id: "item2",
        product: { name: "Jolly Spaghetti", sku: "JB-002" },
        quantity: 2,
        price: 59.00
      }
    ]
  },
  {
    id: "2",
    orderId: "ORD-78942",
    restaurant: "McDonald's - BGC",
    customer: "Maria Santos",
    distance: "2-3 miles",
    pickup: "McDonald's, 5th Avenue, BGC, Taguig City, 1634",
    dropoff: "4567 McKinley Parkway, BGC, Taguig City, 1634",
    payout: "₱8.75",
    payoutAmount: 8.75,
    expiresIn: "45s",
    items: 2,
    isPartialDelivery: true,
    totalSuppliersInOrder: 3,
    supplierIndex: 1,
    subtotal: "₱29.17",
    supplierItems: [
      {
        id: "item3",
        product: { name: "Big Mac Meal", sku: "MC-001" },
        quantity: 1,
        price: 149.00
      }
    ]
  }
];
