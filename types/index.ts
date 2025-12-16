// TypeScript interfaces for the sales queries
/*export interface SalesFilters {
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
  description: string;
  price: number;
  salePrice: number;
  originalPrice?: number;
  onSale: boolean;
  isNew: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  image: string;
  model: string;
  colors?: string[];
  brand: string;
  productCode?: string;
  category: string;
  createdAt: string;
  isActive: boolean;
  color: string;           // From first interface
  size: string;           // From first interface (duplicate with variants but kept for top-level)
  stock: number;          // From first interface
  status: 'Active' | 'Inactive';  // From first interface
  variants: {
    id: string;
    name?: string;        // From first interface
    sku: string;
    size: string;
    color: string;
    price?: number;
    salePrice?: number;   // From first interface
    images?: string[];
    model?: string;
    stock?: number;
    createdAt?: string;   // From first interface
  }[];
}

export interface Variant {
    id: string;
    name?: string;        // From first interface
    sku: string;
    size: string;
    color: string;
    price?: number;
    salePrice?: number;   // From first interface
    images?: string[];
    model?: string;
    stock?: number;
    createdAt?: string
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
  role: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  posts: Post[];
  email: string;
  phone: string;
  addresses: Address[];
  products: Product[];
  emailVerified: boolean;
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
*/
// Core User interface with all fields from GraphQL type
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar: string;
  phone: string;
  emailVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  role: string;
  addresses: Address[];
  orders: Order[];
  reviews: Review[];
  wishlist: WishlistItem[];
  cart: CartItem[];
  products: Product[];
  payments: Payment[];
  messagesSent: Message[];
  messagesReceived: Message[];
  supportTickets: SupportTicket[];
  notifications: Notification[];
  ticketResponses: TicketResponse[];
  
  // Social media fields
  posts: Post[];
  followers: User[];
  following: User[];
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

// Supporting interfaces
export interface Role {
  id: string;
  name: string;
  permissions: string[];
}


// With this complete version:
export interface Address {
  id: string;
  type: AddressType;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date | string;
  user: User;
  orders: Order[];
}

// Add this enum after the Address interface:
export enum AddressType {
  HOME = "HOME",
  WORK = "WORK",
  BILLING = "BILLING",
  SHIPPING = "SHIPPING",
  OTHER = "OTHER"
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  createdAt: Date | string;
  user: User;
  items: OrderItem[];
  payments: Payment[];
  address: Address;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  variantInfo: string;
  product: Product;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  product: Product;
  user: User;
  createdAt: Date | string;
}

export interface WishlistItem {
  id: string;
  product: Product;
  user: User;
  addedAt: Date | string;
}

export interface CartItem {
  id: number;
  userId: string;
  sku: string;
  name: string;
  quantity: number;
  color?: string;
  size?: string;
  price?: number;
  images?: string[];
  product?: Product;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  salePrice: number;
  originalPrice?: number;
  onSale: boolean;
  isNew: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  image: string;
  model: string;
  colors?: string[];
  brand: string;
  productCode?: string;
  category: string;
  createdAt: string;
  isActive: boolean;
  color: string;
  size: string;
  stock: number;
  status: 'Active' | 'Inactive';
  variants: Variant[];
  images: string[];
  user: User;
}

export interface Variant {
  id: string;
  name?: string;
  sku: string;
  size: string;
  color: string;
  price?: number;
  salePrice?: number;
  images?: string[];
  model?: string;
  stock?: number;
  createdAt?: string;
}

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  details?: string;
  createdAt: Date | string;
  user: User;
  order: Order;
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  receiver: User;
  read: boolean;
  createdAt: Date | string;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  user: User;
  responses: TicketResponse[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date | string;
  user: User;
}

export interface TicketResponse {
  id: string;
  content: string;
  ticket: SupportTicket;
  author: User;
  createdAt: Date | string;
}

export interface Post {
  id: string;
  content: string;
  images: string[];
  background: string;
  privacy: string;
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
  createdAt: Date | string;
  author: User;
  taggedUsers: User[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  post: Post;
  createdAt: Date | string;
}

// Enums
export enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED"
}

export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  PAYPAL = "PAYPAL",
  STRIPE = "STRIPE",
  BANK_TRANSFER = "BANK_TRANSFER",
  COD = "COD"
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED"
}

// Other interfaces from your existing code
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

export interface SalesListResponse {
  salesList: {
    orders: Order[];
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
  salesOrder: Order;
}

export interface TabConfig {
  id: string;
  label: string;
  icon: string;
}

export interface category {
  id: string;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  createdAt: string;
  items: string;
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

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ProductFilters {
  category?: string;
  priceRange?: [number, number];
  rating?: number;
  sortBy?: 'price' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
}
