"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { GETCATEGORY, MANAGEMENTPRODUCTS } from '../components/graphql/query';
import { useQuery } from '@apollo/client';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import ProductsTab from './components/ProductsTab';
import OrderListComponent from './components/OrderListComponent';
import SalesDashboard from'./components/SalesDashboard';
import CategoriesTab from './components/CategoriesTab';
import ApiBillsTab from './components/ApiBillsTab';
import LoadingShimmer from './components/LoadingShimmer';
import SalesList from './components/SalesList';

import { Product, category, NewProduct, NewCategory } from '../../../types';
import { decryptToken } from '../../../utils/decryptToken';
import UsersTab from './components/UsersTab';
import { useAuth } from './hooks/useAuth';

export default function ManagementDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // Move all useState hooks to the top, before any conditional returns
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [userId, setUserId] = useState<string | undefined>('');
  const [userRole, setUserRole] = useState<string | undefined>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<category[]>([]);

  // Move useQuery hooks to the top as well
  const { data: categoryData, loading: categoryLoading } = useQuery(GETCATEGORY);
  const { data: productData, loading: productLoading, refetch } = useQuery(MANAGEMENTPRODUCTS, {
    variables: {
      userId: user?.userId
    },
    skip: !user?.userId // Skip query until userId is available
  });

  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: "",
    description: "",
    price: "",
    color: "",
    size: "",
    salePrice: "",
    sku: "",
    stock: "",
    categoryId: "",
    brand: "",
    isActive: true,
    featured: false,
    variants: [],
  });

  const [newCategory, setNewCategory] = useState<NewCategory>({
    name: "",
    description: "",
    parentId: "",
    isActive: true
  });

  // Now we can have conditional returns after all hooks are called
  if (authLoading) { 
    return <LoadingShimmer />;
  }

  // Handle authentication and authorization
  useEffect(() => {
    if (!user) {
      router.push('/Login');
    } else if (user?.role === 'USER') {
      router.push('/');
    } else if (user?.role === 'RIDER') {
      router.push('/Rider');
    } else {
      setUserId(user?.userId);
      setUserRole(user?.role);
    }
  }, [authLoading, user, router]);

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
      const productsData = productData.getProducts.map((data: any) => ({
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

  const handleProductSubmit = (e: React.FormEvent) => {
    // Your existing product submit logic
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    // Your existing category submit logic
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SalesDashboard />;
      case 'products':
        return (
          <ProductsTab
            supplierId={userId}
            products={products}
            refetch={refetch}
            categories={categories}
            newProduct={newProduct}
            setNewProduct={setNewProduct}
            handleProductSubmit={handleProductSubmit}
          />
        );
      case 'categories':
        return (
          <CategoriesTab
            categories={categories}
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            handleCategorySubmit={handleCategorySubmit}
          />
        );
      case 'users':
        return <UsersTab />;
      case 'orders':
        return (
          <OrderListComponent
            initialSupplierId={userId}
            initialStatus="PENDING"
          />
        );
      case 'sales':
        return <SalesList />;
      case 'bills':
        return <ApiBillsTab />;
      default:
        return <SalesDashboard />;
    }
  };

  // Show loading state while checking authentication
  if (isLoading || categoryLoading || productLoading) {
    return <LoadingShimmer />;
  }

  // Don't render anything if redirecting or unauthorized
  if (!userId || (userRole !== 'admin' && userRole !== 'manager')) {
    return null;
  }

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
