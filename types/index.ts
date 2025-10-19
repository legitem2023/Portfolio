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
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  size: string;
  price: number;
  onSale: boolean;
  isNew: boolean;
  isFeatured: boolean;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  colors?: string[];
  description?: string;
  productCode?: string;
  category: category;
  variants: {
    id: string;
    sku: string;
    size: string;
    color: string;
    price?: number;
    images?: string[];
    stock?: number;
  }[];
}

export interface Variant {
    id: string;
    sku: string;
    size: string;
    color: string;
    price: number;
    images?: string[];
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
  color: string;
  size: string;
  price:number;
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
