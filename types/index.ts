// TypeScript interfaces for the sales queries
export interface SalesFilters {
  status?: OrderStatus;
  userId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  minAmount?: number;
  maxAmount?: number;
}

enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED"
}

enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  PAYPAL = "PAYPAL",
  STRIPE = "STRIPE",
  BANK_TRANSFER = "BANK_TRANSFER",
  COD = "COD"
}

enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED"
}

export interface SalesListResponse {
  salesList: {
    orders: Array<{
      id: string;
      orderNumber: string;
      status: OrderStatus;
      total: number;
      subtotal: number;
      tax: number;
      shipping: number;
      discount: number;
      createdAt: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar: string;
      };
      address: {
        id: string;
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };
      items: Array<{
        id: string;
        quantity: number;
        price: number;
        variantInfo: string;
        product: {
          id: string;
          name: string;
          price: number;
          images: string[];
        };
      }>;
      payments: Array<{
        id: string;
        amount: number;
        method: PaymentMethod;
        status: PaymentStatus;
        transactionId: string;
        createdAt: string;
      }>;
    }>;
    totalCount: number;
    totalPages: number;
    currentPage: number;
    summary: {
      totalRevenue: number;
      totalOrders: number;
      averageOrderValue: number;
      pendingOrders: number;
      completedOrders: number;
    };
  };
}

export interface SalesOrderResponse {
  salesOrder: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    total: number;
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      avatar: string;
    };
    address: {
      id: string;
      type: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      isDefault: boolean;
    };
    items: Array<{
      id: string;
      quantity: number;
      price: number;
      variantInfo: string;
      product: {
        id: string;
        name: string;
        description: string;
        price: number;
        salePrice: number;
        sku: string;
        stock: number;
        images: string[];
        category: {
          id: string;
          name: string;
        };
        variants: Array<{
          id: string;
          name: string;
          sku: string;
          color: string;
          size: string;
          price: number;
          stock: number;
        }>;
      };
    }>;
    payments: Array<{
      id: string;
      amount: number;
      method: PaymentMethod;
      status: PaymentStatus;
      transactionId: string;
      details: string;
      createdAt: string;
    }>;
  };
}


export interface TabConfig {
  id: string;
  label: string;
  icon: string;
}

export interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

export interface category {
  id: string;
  name: string;
  description: string;
  image: string;
  isActive:boolean;
  createdAt:string;
  items:string;
  productCount: number;
  status: 'Active' | 'Inactive';
  parentId?: number;
}


export interface NewProduct {
  name: string;
  description: string;
  price: string;
  salePrice: string;
  sku: string;
  stock: string;
  categoryId: string;
  brand: string;
  isActive: boolean;
  featured: boolean;
  variants: Variant[];
  color: string;
  size: string;
}

export interface NewCategory {
  name: string;
  description: string;
  parentId: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  size: string;
  price: number;
  salePrice: number;
  onSale: boolean;
  isNew: boolean;
  isFeatured: boolean;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  model:string;
  colors?: string[];
  description?: string;
  productCode?: string;
  category: category;
  createdAt:string;
  variants: {
    id: string;
    sku: string;
    size: string;
    color: string;
    price?: number;
    images?: string[];
    model?:string;
    stock?: number;
  }[];
}

export interface Variant {
    id: string;
    sku: string;
    size: string;
    color: string;
    price?: number;
    images?: string[];
    model?:string;
    stock?: number;
  };

// FIXED: Single CartItem definition that extends Product
export interface CartItem {
  id: number;
  images?:string[];
  name:string;
  userId: string;
  sku: string;
  quantity: number;
  color?: string;
  size?: string;
  price?:number;
}

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  privacy: string;
  user: User;
  background: string;
  images:string[];
  isLikedByMe:boolean;
  taggedUsers:User[];
}

export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  posts: Post[];
  addresses: Address[];
  products: Product[];
}

export interface ProductCardProps {
  product: Product;
}

export interface Tab {
  id: string;
  label: string;
  content: React.ReactElement;
  icon?: React.ReactElement;
}

export interface LuxuryTabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// If you have filters for products
export interface ProductFilters {
  category?: string;
  priceRange?: [number, number];
  rating?: number;
  sortBy?: 'price' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
}
