
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


export interface CartItem {
    userId: string;
    id: string; // You can change this to number if IDs are numeric
    productCode: string;
    image:string;
    name: string;
    color:string;
    size:string;
    price: number;
    quantity: number;
  }
  

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  privacy: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  posts: Post[];
  addresses: Address[]
  products: Product[]
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  productCode: string;
  images?: string[];
  category: string;
  rating: number;
  description: string;
  longDescription?: string;
  features?: string[];
  stock?: number;
  colors?: string[];
  sizes?: string[];
  variants: {
    id: string;
    size: string;
    color: string;
    price?: number;
    images?: string[];
    stock?: number;
  };
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


export interface ProductCardProps {
  product: Product;
}

// If you're using any state management, add those types here
export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  // Add other user properties as needed
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
