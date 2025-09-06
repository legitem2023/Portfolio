"use client";
import { useState } from 'react';
import Head from 'next/head';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import ProductsTab from './components/ProductsTab';
import CategoriesTab from './components/CategoriesTab';
import { Product, Category, NewProduct, NewCategory } from './types';

export default function ManagementDashboard() {
  const [activeTab, setActiveTab] = useState<string>('products');
  const [products, setProducts] = useState<Product[]>([...]);
  const [categories, setCategories] = useState<Category[]>([...]);
  const [newProduct, setNewProduct] = useState<NewProduct>({...});
  const [newCategory, setNewCategory] = useState<NewCategory>({...});

  const handleProductSubmit = (e: React.FormEvent) => {...};
  const handleCategorySubmit = (e: React.FormEvent) => {...};

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
