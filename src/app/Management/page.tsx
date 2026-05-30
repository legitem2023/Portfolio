"use client";
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { GETCATEGORY, MANAGEMENTPRODUCTS } from '../components/graphql/query';
import { useQuery } from '@apollo/client';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import NotificationPage from './components/NotificationPage';
import FoodManagement from './components/FoodManagement';
import ParentTab from './components/ParentTab';
import ProductsTab from './components/ProductsTab';
import OrderListComponent from './components/OrderListComponent';
import RemittancePage from './components/RemittancePage';
import SalesDashboard from'./components/SalesDashboard';
import CategoriesTab from './components/CategoriesTab';
import ApiBillsTab from './components/ApiBillsTab';
import LoadingShimmer from './components/LoadingShimmer';
import SalesList from './components/SalesList';
import VendorReturnManagement from "./components/VendorReturnManagement";
import VehicleTypeManager from './components/VehicleTypeManager';
import UserProfile from './components/UserProfile';
import ServicesTable from './components/ServicesTable';

import { Product, category, NewProduct, NewCategory } from '../../../types';
import UsersTab from './components/UsersTab';
import PMTab from './components/PMTab';
import SizeManager from './components/SizeManager';
import { useAuth } from './hooks/useAuth';
import { useDispatch, useSelector } from "react-redux";
import { setActiveIndex } from '../../../Redux/activeIndexSlice';

export default function ManagementDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useAuth();
  const filter:any = {
        status: 'DELIVERED', 
        supplierId: user?.userId
      }
  // Move all useState hooks to the top, before any conditional returns
  const activeIndex:number = useSelector((state: any) => state.activeIndex.value);
  const activeselectedUser:any = useSelector((state: any) => state.selectedUser.value);
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<category[]>([]);
  const handleTabClick = useCallback((tabId: number) => {
    
      setTimeout(() => {
        dispatch(setActiveIndex(tabId));
      }, 100);
    
  }, [dispatch]);

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



  // Handle authentication and authorization
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/Login');
    } else if (user?.role === 'USER') {
      router.push('/');
    } else if (user?.role === 'RIDER') {
      router.push('/Rider');
    }
    setIsLoading(false);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (categoryData?.categories) {
      const categoriesData = categoryData.categories.map((data: any) => ({
        id: data.id,
        image: data.image,
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
  
  switch (activeIndex) {
    case 0:
      return (
        <ParentTab
           title="Sales Performance Analytics"
           description="Comprehensive metrics and insights to track business growth, revenue trends, and operational performance"
           showRefresh={false}>
           <SalesDashboard />
        </ParentTab>        
      );
    case 1:
      return (
        <ParentTab
           title="User Access Management"
           description="Configure user roles, permissions, and access controls for system security"
           showRefresh={false}>
             <UsersTab />
        </ParentTab>
      );
    case 2:
      return (
        <ParentTab
           title="Product Inventory Management"
           description="Centralized control over product catalog, stock levels, and inventory tracking"
           showRefresh={false}>
        <ProductsTab
          supplierId={user?.userId || ''}
          products={products}
          refetch={refetch}
          categories={categories}
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          handleProductSubmit={handleProductSubmit}
        />
        </ParentTab>
      );
    case 3:
      return (
        <ParentTab
           title="Product Category Management"
           description="Organize and structure product categories for efficient browsing and sorting"
           showRefresh={false}>
        <CategoriesTab
          categories={categories}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          handleCategorySubmit={handleCategorySubmit}
        />
        </ParentTab>
      );
    case 4:
      return ( 
        <ParentTab
           title="Order Management"
           description="Manage and track all orders"
           showRefresh={false}>
        <OrderListComponent
          initialSupplierId={user?.userId}
          initialStatus="PENDING"
        />
        </ParentTab>
      );
      
    case 5:
      return (
        <ParentTab
           title="Remittance & Settlement Management"
           description="Financial reconciliation dashboard tracking rider earnings, vendor fees, and remittance amounts by supplier"
           showRefresh={false}>
        <RemittancePage
          initialSupplierId={user?.userId}
        />
        </ParentTab>
      );
    case 6:
      return (<SalesList filter={filter} pageSize={20}/>);
    case 7:
      return (
        <ParentTab
           title="API Billing & Usage Analytics"
           description="Monitor API service consumption, cost allocation, and usage patterns"
           showRefresh={false}>
           <ApiBillsTab />
        </ParentTab>
          );
    case 8:
      return <></>;
    case 9:
      return (
        <ParentTab
           title="Vehicle Type Configuration"
           description="Define and manage vehicle categories, specifications, and fleet parameters"
           showRefresh={false}>
            <VehicleTypeManager/>
        </ParentTab>
          );
    case 10:
      return <UserProfile userId={user?.userId?user?.userId:''}/>;
    case 11:
      return <UserProfile userId={activeselectedUser?activeselectedUser:''}/>;
    case 12:
      return <PMTab UserId={user?.userId?user?.userId:''}/>;
    case 13:
      return (
        <ParentTab
           title="Product Size Configuration"
           description="Manage size variants, dimensions, and规格 options for product listings"
           showRefresh={false}>
           <SizeManager/>
        </ParentTab>
          );
    case 14: 
      return (
        <ParentTab
           title="Return & Refund Processing"
           description="Handle customer return requests, approve refunds, and track reverse logistics"
           showRefresh={false}>
              <VendorReturnManagement supplierId={user?.userId?user?.userId:''}/>
        </ParentTab> 
          );
    case 15:
      return <ServicesTable/>;
    case 16:
      return <NotificationPage UserId={user?.userId?user?.userId:''}/>;
    case 17:
      return (
        <ParentTab
           title="Food Option Configuration"
           description="Manage customizable food options, add-ons, and modifiers for menu items"
           showRefresh={false}>
          <FoodManagement  accountId={user?.userId?user?.userId:''} />
        </ParentTab>
          )
    default:
      return <></>;
  }
};
  
/*  const renderContent = () => {
    
    switch (activeIndex) {
      case 0:
        return (
          <ParentTab
             title="Sales Analytics"
             description="Monitor your business performance and growth"
             showRefresh={false}>
             <SalesDashboard />
          </ParentTab>        
        );
      case 1:
        return (
          <ParentTab
             title="Users Management"
             description="Manage user roles and permissions"
             showRefresh={false}>
               <UsersTab />
          </ParentTab>
        );
      case 2:
        return (
          <ParentTab
             title="Product Management"
             description="Manage and track stock levels"
             showRefresh={false}>
          <ProductsTab
            // Only pass supplierId if it exists, otherwise pass an empty string or handle accordingly
            supplierId={user?.userId || ''}
            products={products}
            refetch={refetch}
            categories={categories}
            newProduct={newProduct}
            setNewProduct={setNewProduct}
            handleProductSubmit={handleProductSubmit}
          />
          </ParentTab>
        );
      case 3:
        return (
          <ParentTab
             title="Category Management"
             description="Manage to control sorting of products"
             showRefresh={false}>
          <CategoriesTab
            categories={categories}
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            handleCategorySubmit={handleCategorySubmit}
          />
          </ParentTab>
        );
      case 4:
        return (
          <OrderListComponent
            initialSupplierId={user?.userId}
            initialStatus="PENDING"
          />
        );
        
      case 5:
        return (
          <ParentTab
             title="Remittance Management"
             description="Financial summary for delivered orders – rider earnings, vendor city fees, and remittance amounts (filtered by supplier)"
             showRefresh={false}>
          <RemittancePage
            initialSupplierId={user?.userId}
          />
          </ParentTab>
        );
      case 6:
        return (<SalesList filter={filter} pageSize={20}/>);
      case 7:
        return (
          <ParentTab
             title="API Bills Management"
             description="Track API service costs and usage metrics"
             showRefresh={false}>
             <ApiBillsTab />
          </ParentTab>
            );
      case 8:
        return <></>;
      case 9:
        return (
          <ParentTab
             title="Vehicle Type Manager"
             description="Manage Vehicle types"
             showRefresh={false}>
              <VehicleTypeManager/>
          </ParentTab>
            );
      case 10:
        return <UserProfile userId={user?.userId?user?.userId:''}/>;
      case 11:
        return <UserProfile userId={activeselectedUser?activeselectedUser:''}/>;
      case 12:
        return <PMTab UserId={user?.userId?user?.userId:''}/>;
      case 13:
        return (
          <ParentTab
             title="Size Manager"
             description="Manage product sizes"
             showRefresh={false}>
             <SizeManager/>
          </ParentTab>
            );
      case 14: 
        return (
          <ParentTab
             title="Return Management"
             description="Manage customer return requests and process refunds"
             showRefresh={false}>
                <VendorReturnManagement supplierId={user?.userId?user?.userId:''}/>
          </ParentTab> 
            );
      case 15:
        return <ServicesTable/>;
      case 16:
        return <NotificationPage UserId={user?.userId?user?.userId:''}/>;
      case 17:
        return (
          <ParentTab
             title="Food Option Management"
             description="Manage and control Options"
             showRefresh={false}>
            <FoodManagement  accountId={user?.userId?user?.userId:''} />
          </ParentTab>
            )
      default:
        return <></>;
    }
  };
  */
  // Now we can have conditional returns after all hooks are called
  if (authLoading) { 
    return <LoadingShimmer />;
  }
  // Show loading state while checking authentication
  if (isLoading || categoryLoading || productLoading) {
    return <LoadingShimmer />;
  }
console.log(products);

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>E-Commerce Management Dashboard</title>
        <meta name="description" content="E-Commerce Management Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <TopNav onMenuClick={()=> setSidebarOpen(true)} user={user} />
      <Sidebar 
        activeTab={activeIndex} 
        setActiveTab={handleTabClick}
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
