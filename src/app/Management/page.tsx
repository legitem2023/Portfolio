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

export default function ManagementDashboard() {
  const [activeTab, setActiveTab] = useState<string>('products');
  const [userId, setUserId] = useState("");

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
        productCount: 0, // Changed from empty string to number
        status: data.isActive ? "Active" : "Inactive" // Convert boolean to string
      }));
      setCategories(categoriesData);
    }
console.log(productData);
   if (productData?.getProducts) {
     const productsData = productData.getProducts.map((data:any)=> ({
           id: 1, 
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
     }))
     
   setProducts(productsData);
     
   }
    
  }, [categoryData,productData]);

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
      id: products.id,
      name: newProduct.name,
      variants: newProduct.variants,
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
      variants:[],
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
      default:
        return <div>Select a tab</div>;
    }
  };

  if (categoryLoading && productLoading) return <div>Category Loading...</div>;

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
