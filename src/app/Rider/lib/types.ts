// TypeScript interfaces for the GraphQL response
export interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
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
