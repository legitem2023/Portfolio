"use client";
import { useState } from 'react';
import Head from 'next/head';
import { GETCATEGORY } from '../components/graphql/query';
import { useQuery } from '@apollo/client';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import ProductsTab from './components/ProductsTab';
import CategoriesTab from './components/CategoriesTab';
import { Product, Category, NewProduct, NewCategory } from './types/types';

export default function ManagementDashboard() {
  const [activeTab, setActiveTab] = useState<string>('categories');
  const { data:categoryData,loading:categoryLoading} = useQuery(GETCATEGORY);
// With actual data:
const [products, setProducts] = useState<Product[]>([
  { id: 1, name: "Wireless Headphones", description: "Noise-cancelling wireless headphones", price: 199.99, salePrice: 179.99, sku: "WH1000XM4", stock: 45, category: "Electronics", brand: "Sony", status: "Active" },
  { id: 2, name: "Running Shoes", description: "Lightweight running shoes with cushioning", price: 129.99, sku: "RS2023", stock: 23, category: "Footwear", brand: "Nike", status: "Active" },
  { id: 3, name: "Coffee Maker", description: "Programmable coffee maker with thermal carafe", price: 89.99, sku: "CM4500", stock: 0, category: "Appliances", brand: "KitchenAid", status: "Inactive" },
]);

if(categoryLoading) return "Category Loading";
const [categories, setCategories] = useState<Category[]>(
  categoryData.categories.map((data:any)=>{
    return {
      id:data.id,
      name:data.name,
      description:data.description,
      productCount:"",
      status:data.status
    }
  })
  );

const [newProduct, setNewProduct] = useState<NewProduct>({
  name: "",
  description: "",
  price: "",
  salePrice: "",
  sku: "",
  stock: "",
  categoryId: "",
  brand: "",
  isActive: true,
  featured: false
});

const [newCategory, setNewCategory] = useState<NewCategory>({
  name: "",
  description: "",
  parentId: "",
  isActive: true
});


// With the actual function implementations:
const handleProductSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const category = categories.find(c => c.id === parseInt(newProduct.categoryId));
  
  const product: Product = {
    id: products.length + 1,
    name: newProduct.name,
    description: newProduct.description,
    price: parseFloat(newProduct.price),
    salePrice: newProduct.salePrice ? parseFloat(newProduct.salePrice) : undefined,
    sku: newProduct.sku,
    stock: parseInt(newProduct.stock),
    category: category?.name || "Uncategorized",
    brand: newProduct.brand || undefined,
    status: newProduct.isActive ? "Active" : "Inactive"
  };
  
  setProducts([...products, product]);
  setNewProduct({
    name: "",
    description: "",
    price: "",
    salePrice: "",
    sku: "",
    stock: "",
    categoryId: "",
    brand: "",
    isActive: true,
    featured: false
  });
};

const handleCategorySubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const category: Category = {
    id: categories.length + 1,
    name: newCategory.name,
    description: newCategory.description || undefined,
    productCount: 0,
    status: newCategory.isActive ? "Active" : "Inactive",
    parentId: newCategory.parentId ? parseInt(newCategory.parentId) : undefined
  };
  
  setCategories([...categories, category]);
  setNewCategory({
    name: "",
    description: "",
    parentId: "",
    isActive: true
  });
};

  
  const renderContent = () => {
    switch(activeTab) {
      case 'products':
        return <ProductsTab 
          products={products} 
          categories={categories}
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          handleProductSubmit={handleProductSubmit}
        />;
      case 'categories':
        return <CategoriesTab 
          categories={categories}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          handleCategorySubmit={handleCategorySubmit}
        />;
      // ... other cases
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>E-Commerce Management Dashboard</title>
        <meta name="description" content="E-Commerce Management Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <TopNav />
      
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="md:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
