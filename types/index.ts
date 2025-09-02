// types/index.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[]; // Add this for multiple images
  category: string;
  rating: number;
  description: string;
  longDescription?: string; // Add this for detailed description
  features?: string[]; // Add this for product features
  stock?: number; // Add this for inventory
  colors?: string[]; // Add this for color options
  sizes?: string[]; // Add this for size options
}

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
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
