export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  sku: string;
  stock: number;
  category: string;
  brand?: string;
  status: 'Active' | 'Inactive';
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
}

export interface NewCategory {
  name: string;
  description: string;
  parentId: string;
  isActive: boolean;
}

