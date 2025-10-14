'use client';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveIndex } from '../../../Redux/activeIndexSlice';
import UserProfile from './UserProfile';
import { decryptToken } from '../../../utils/decryptToken';
import PostDetail from './Posting/PostDetail';
import PMTab from './PMTab';
import FlashSale from './FlashSale';
import OrderTracking from './Orders/OrderTracking';
import MerchantDetails from './Merchants/MerchantDetails';
import {
  Home,
  ShoppingBag,
  Target,
  Star,
  Gift,
  Shirt,
  Briefcase,
  Footprints,
  Gem,
  Heart,
  House,
  Smartphone,
  Sparkles,
  MessageSquareText,
  ShoppingCart,
  Users,
  Tags,
} from 'lucide-react';
import ProductsTab from './ProductsTab';
import MessagesTab from './MessagesTab';
import DeluxeCart from './Cart/DeluxeCart';
import DeluxeHomePage from './Home/DeluxeHomePage';
import MerchantsPage from './MerchantsPage';
import { useSearchParams } from 'next/navigation'; // Change this import

interface Tab {
  id: number;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const DeluxeNavTabs: React.FC = () => {
  const activeIndex = useSelector((state: any) => state.activeIndex.value);
  const activePostId = useSelector((state: any) => state.activePostId.value);
  const dispatch = useDispatch();
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  
  // Get the URL parameter for merchant ID
  // Use useSearchParams to get query parameters
  const searchParams = useSearchParams();
  const merchantIdFromUrl = searchParams.get('id'); // This gets the ID from URL query parameter

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
        setName(payload.name);
        setAvatar(payload.image || "/NoImage.webp");
      } catch (err) {
        console.error('Error getting role:', err);
      }
    };
    getRole();
  }, []);
  
  const tabs: Tab[] = [
    {
      id: 1,
      label: 'Home',
      icon: <Home size={18} />,
      content: <DeluxeHomePage />,
    },
    {
      id: 2,
      label: 'Products',
      icon: <Tags size={18} />,
      content: <ProductsTab />,
    },
    {
      id: 3,
      label: 'Exclusive Deals',
      icon: <Target size={18} />,
      content: (
        <FlashSale/>
      ),
    },
    {
      id:4,
      label: 'Luxe Brands',
      icon: <Star size={18} />,
      content: (
        <MerchantsPage/>
      ),
    },
    {
      id: 5,
      label: 'Messages',
      icon: <Users size={18} />,
      content: <MessagesTab />,
    },
    {
      id: 6,
      label: 'Cart',
      icon: <ShoppingCart size={18} />,
      content: <DeluxeCart />,
    },
    {
      id: 7,
      label: 'Profile',
      icon: <ShoppingCart size={18} />,
      content: <UserProfile userId={userId} /> // Uses JWT userId
    },
    {
      id: 8,
      label: 'Post',
      icon: <ShoppingCart size={18} />,
      content: <PostDetail postId={activePostId} />
    },
    {
      id: 9,
      label: 'PM',
      icon: <ShoppingCart size={18} />,
      content: <PMTab UserId={userId}/>
    },
    {
      id:10,
      label: 'Order',
      icon: <ShoppingCart size={18} />,
      content:<OrderTracking userId={userId} /> // Uses JWT userId
    },
    {
      id:11,
      label: 'Merchants',
      icon: <ShoppingCart size={18} />,
      content:<MerchantDetails userId={merchantIdFromUrl || ""} /> // Uses URL id instead of JWT userId
    }
  ];

  function getCategoryIcon(category: string): React.ReactNode {
    const icons: Record<string, React.ReactNode> = {
      Clothing: <Shirt size={16} />,
      Accessories: <Briefcase size={16} />,
      Footwear: <Footprints size={16} />,
      Jewelry: <Gem size={16} />,
      Beauty: <Heart size={16} />,
      Home: <House size={16} />,
      Electronics: <Smartphone size={16} />,
      Gifts: <Gift size={16} />,
    };
    return icons[category] || <Star size={16} />;
  }

  return (
    <div className="w-full mx-auto font-sans z-10">
      
      <div className="w-full flex justify-between md:justify-center overflow-x-auto hide-scrollbar mb-1 bg-gradient-to-t from-violet-50 to-white z-20">
        {tabs.slice(0,6).map((tab) => (
          <button
            key={tab.id}
            onClick={() => dispatch(setActiveIndex(tab.id))}
            className={`flex-1 md:flex-none flex items-center justify-center px-2 md:px-5 py-3 text-lg font-large whitespace-nowrap transition-all duration-300 border-b-4 ${
              activeIndex === tab.id
                ? 'border-amber-200 text-amber-800 bg-gradient-to-t from-amber-50 to-white'
                : 'border-violet-600 text-violet-600 hover:text-violet-600 hover:border-violet-400'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
          </button>
        ))}
      </div>

      
      <div className="bg-white rounded-b-xl rounded-tr-xl shadow-lg border border-gray-200 overflow-hidden">
        {tabs.find((tab) => tab.id === activeIndex)?.content}
      </div>

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default DeluxeNavTabs;
