
import { gql } from "@apollo/client";

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus(
    $itemId: ID!, 
    $riderId: ID, 
    $supplierId: ID, 
    $userId: ID!, 
    $status: String!, 
    $title: String!, 
    $message: String!
  ) {
    updateOrderStatus(
      itemId: $itemId
      riderId: $riderId
      supplierId: $supplierId
      userId: $userId
      status: $status
      title: $title
      message: $message
    ) {
      statusText
    }
  }
`;


export const REJECT_BY_RIDER_MUTATION = gql`
  mutation RejectByRider($itemId: ID!, $riderId: ID!) {
    rejectByRider(itemId: $itemId, riderId: $riderId) {
      statusText
    }
  }
`;

export const ACCEPT_BY_RIDER = gql`
  mutation AcceptByRider(
    $itemId: ID!
    $riderId: ID!
    $supplierId: ID!
    $userId: ID!
  ) {
    acceptByRider(
      itemId: $itemId
      riderId: $riderId
      supplierId: $supplierId
      userId: $userId
    ) {
      statusText
    }
  }
`;

export const ACTIVE_ORDER_LIST = gql`
  query ActiveOrder(
    $filter: OrderFilterInput
    $pagination: OrderPaginationInput
  ) {
    activeorder(filter: $filter, pagination: $pagination) {
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
          lat
          lng
        }
        items {
          id
          orderId
          supplierId
          quantity
          price
          status
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
              lat
              lng
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

// GraphQL Query with address field
export const ORDER_LIST_QUERY = gql`
  query NewOrder(
    $filter: OrderFilterInput
    $pagination: OrderPaginationInput
  ) {
    neworder(filter: $filter, pagination: $pagination) {
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
          lat
          lng
        }
        items {
          id
          orderId
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
              lat
              lng
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

// TypeScript interfaces for the GraphQL response
export interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  lat: number | null;
  lng: number | null;
}

export interface Supplier {
  id: string;
  firstName: string;
  addresses: Address[];
}

export interface OrderItem {
  id: string;
  supplierId: string;
  quantity: number;
  price: number;
  status: string;
  product: {
    name: string;
    sku: string;
  };
  supplier?: Supplier[];
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
}

export interface OrderUser {
  id: string;
  firstName: string;
  email: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderId: string;
  status: string;
  total: number;
  createdAt: string;
  user: OrderUser;
  address: Address;
  items: OrderItem[];
  payments: Payment[];
}

export interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrderListResponse {
  neworder: {
    orders: Order[];
    pagination: Pagination;
  };
}
export interface ActiveOrderListResponse {
  activeorder: {
    orders: Order[];
    pagination: Pagination;
  };
}
export interface SupplierGroup {
  supplierId: string;
  items: OrderItem[];
  supplierInfo?: {
    address?: Address;
    supplierName: string;
    supplier?: Supplier;
  };
}

// Delivery type for transformed data
export interface Delivery {
  id: string;
  originalOrderId: string;
  orderId: string;
  orderParentId: string
  restaurant: string;
  customer: string;
  customerId: string;
  distance: string;
  pickup: string;
  dropoff: string;
  payout: string;
  payoutAmount: number;
  expiresIn: string;
  items: number;
  orderData: Order;
  dropoffAddress?: Address;
  pickupAddress?: Address;
  supplierName: string;
  supplier?: Supplier;
  subtotal: string;
  supplierItems?: OrderItem[];
  isPartialDelivery: boolean;
  totalSuppliersInOrder: number;
  supplierIndex: number;
}

// ... other interfaces ...
// Add to existing Delivery interface
export interface MapDelivery extends Delivery {
  pickupCoords?: [number, number];
  dropoffCoords?: [number, number];
  route?: [number, number][];
}
export interface TabType {
  id: string;
  label: string;
  icon: React.ReactNode;
  desktopLabel: string;
  hasNotification?: boolean;
}
