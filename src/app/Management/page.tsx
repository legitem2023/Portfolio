"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { GETCATEGORY, MANAGEMENTPRODUCTS } from '../components/graphql/query';
import { useQuery } from '@apollo/client';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import ProductsTab from './components/ProductsTab';
import SalesDashboard from'./components/SalesDashboard';
import CategoriesTab from './components/CategoriesTab';
import { Product, Category, NewProduct, NewCategory } from './types/types';
import { decryptToken } from '../../../utils/decryptToken';
import UsersPage from './components/Users/UsersPage';

export default function ManagementDashboard() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const { data: categoryData, loading: categoryLoading } = useQuery(GETCATEGORY);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const getRole = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/protected', {
          credentials: 'include'
        });
        
        // Redirect to login if unauthorized (no active user)
        if (response.status === 401) {
          router.push('./Login');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        const token = data?.user;
        
        if (!token) {
          router.push('./Login');
          return;
        }
        
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";
        const payload = await decryptToken(token, secret.toString());
        
        // Check if user role is admin or manager
       
        if (payload.role === 'admin' && payload.role === 'manager') {
          router.push('./');
          return;
        }
        
        setUserId(payload.userId);
        setUserRole(payload.role);
        console.log(payload.role);
        
      } catch (err) {
        console.error('Error getting role:', err);
        router.push('./Login');
      } finally {
        setIsLoading(false);
      }
    };
    getRole();
  }, [router]);

  const { data: productData, loading: productLoading } = useQuery(MANAGEMENTPRODUCTS,{
    variables :{
      userId:userId
    },
    skip: !userId // Skip query until userId is available
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

  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: "",
    description: "",
    price: "",
    color:"",
    size:"",
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

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const category = categories.find(c => c.id === parseInt(newProduct.categoryId));
    
    const product: Product = {
      id: newProduct.name,
      name: newProduct.name,
      variants: newProduct.variants,
      description: newProduct.description,
      price: parseFloat(newProduct.price),
      salePrice: newProduct.salePrice ? parseFloat(newProduct.salePrice) : undefined,
      sku: newProduct.sku,
      color:newProduct.color,
      size:newProduct.size,
      stock: parseInt(newProduct.stock),
      category: category?.name || "Uncategorized",
      brand: newProduct.brand || undefined,
      status: newProduct.isActive ? "Active" : "Inactive"
    };
    
    setProducts([...products, product]);
    setNewProduct({
      name: "",
      description: "",
      variants:[],
      price: "",
      salePrice: "",
      sku: "",
      color:"",
      size:"",
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
      case 'dashboard':
        return <SalesDashboard/>;
      case 'products':
        return <ProductsTab 
          supplierId={userId}
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
      case 'users':
        // Optionally, you can add additional role-based restrictions here
        if (userRole !== 'admin') {
          return <div className="p-4">Access denied. Admin privileges required.</div>;
        }
        return <UsersPage/>;
      default:
        return <div>Select a tab</div>;
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render anything if redirecting
  /*if (!userId || (userRole !== 'admin' && userRole !== 'manager')) {
    return null;
  }*/

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
      
      <div className="md:pl-64 flex flex-col flex-1 bg-amber-500">
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
        }
