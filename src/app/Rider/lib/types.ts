import { gql } from "@apollo/client";

// GraphQL Query with address field
export const ORDER_LIST_QUERY = gql`
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

// TypeScript interfaces for the GraphQL response
export interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
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
  orderlist: {
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
  restaurant: string;
  customer: string;
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

export interface TabType {
  id: string;
  label: string;
  icon: React.ReactNode;
  desktopLabel: string;
  hasNotification?: boolean;
}
