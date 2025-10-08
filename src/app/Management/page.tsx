"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { GETCATEGORY, MANAGEMENTPRODUCTS } from '../components/graphql/query';
import { useQuery } from '@apollo/client';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import ProductsTab from './components/ProductsTab';
import CategoriesTab from './components/CategoriesTab';
import { Product, Category, NewProduct, NewCategory } from './types/types';
import { decryptToken } from '../../../utils/decryptToken';
import UsersPage from './components/Users/UsersPage';

export default function ManagementDashboard() {
  const [activeTab, setActiveTab] = useState<string>('products');
  const [userId, setUserId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: categoryData, loading: categoryLoading } = useQuery(GETCATEGORY);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const getRole = async () => {
      try {
        const response = await fetch('/api/protected', {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        const token = data?.user;
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";

        const payload = await decryptToken(token, secret.toString());
        setUserId(payload.userId);
        
      } catch (err) {
        console.error('Error getting role:', err);
      }
    };
    getRole();
  }, []);

  const { data: productData, loading: productLoading } = useQuery(MANAGEMENTPRODUCTS,{
    variables :{
      userId:userId
    }
  });
  
  useEffect(() => {
    if (categoryData?.categories) {
      const categoriesData = categoryData.categories.map((data: any) => ({
        id: data.id,
        name: data.name,
        description: data.description,
        productCount: 0,
        status: data.isActive ? "Active" : "Inactive"
      }));
      setCategories(categoriesData);
    }

    if (productData?.getProducts) {
      const productsData = productData.getProducts.map((data:any)=> ({
        id: data.id, 
        name: data.name, 
        description: data.description, 
        price: data.price,
        salePrice: data.salePrice, 
        sku: data.sku, 
        stock: data.stock,
        category: data.categoryId,
        brand: data.brand,
        status: data.isActive,
        variants: data.variants
      }));
      setProducts(productsData);
    }
  }, [categoryData, productData]);

  // ... rest of your existing state and handlers
  const renderContent = () => { switch(activeTab) { case 'products': return <ProductsTab  supplierId={userId} products={products}  categories={categories} newProduct={newProduct} setNewProduct={setNewProduct} handleProductSubmit={handleProductSubmit} />; case 'categories': return <CategoriesTab  categories={categories} newCategory={newCategory} setNewCategory={setNewCategory} handleCategorySubmit={handleCategorySubmit} />; case 'users': return <UsersPage/>; default: return <div>Select a tab</div>; } };
  if (categoryLoading && productLoading) return <div>Category Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>E-Commerce Management Dashboard</title>
        <meta name="description" content="E-Commerce Management Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <TopNav onMenuClick={() => setSidebarOpen(true)} />
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
