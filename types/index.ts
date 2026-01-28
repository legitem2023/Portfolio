// Core User interface with all fields from GraphQL type
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar: string;
  phone: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
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
  receiver: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
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
  userId: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  createdAt: string;
  user: User;
  items: OrderItem[];
  payments: Payment[];
  address: Address;
}

export interface OrderItem {
  id: string;
  quantity: number;
  supplierId: string;
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
  addedAt: string;
}

export interface CartItem {
  id: number;
  userId: string;
  supplierId: string;
  sku: string;
  name: string;
  quantity?: number;
  color?: string;
  size?: string;
  price?: number;
  images?: string[];
  product?: Product;
}

export interface Product {
  id: string;
  sku: string;
  supplierId: string;
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
  createdAt: string;
  author: User;
  user: User;
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


// types/product.ts
export interface ProductVariant {
  id?: string;
  color: string;
  size: string;
  price: string;
  stock: string;
  sku: string;
  image?: string;
}

export interface ModifyProduct {
  id?: string;
  name: string;
  description: string;
  price: string;
  color: string;
  size: string;
  salePrice: string;
  sku: string;
  stock: string;
  categoryId: string;
  brand: string;
  isActive: boolean;
  featured: boolean;
  variants: ProductVariant[];
  images?: string[];
}
