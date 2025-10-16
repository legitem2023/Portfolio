// types/index.ts
export interface Address {
  type: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  addresses: Address[];
  avatar: string;
  phone: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  role: string;
}

export interface Variant {
    id: string;
    name: string;
    createdAt: string;
    sku: string;
    color: string;
    size: string;
    price: number;
    salePrice?: number;
    stock: number;
    images: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  color: string;
  size: string;
  salePrice?: number;
  sku: string;
  stock: number;
  category: string;
  brand?: string;
  status: 'Active' | 'Inactive';
  variants: {
    id: string;
    size: string;
    color: string;
    price?: number;
    images?: string[];
    stock?: number;
  }[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
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

