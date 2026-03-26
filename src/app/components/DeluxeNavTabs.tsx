'use client';
import Ads from './Ads/Ads'
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
import { useRouter, usePathname } from 'next/navigation';
import ParticleBackground from './ParticleBackground';
import { CartItem } from '../../../types'; // Import CartItem type

import {
  Home,
  ShoppingBag,
  Target,
  Star,
  Store,
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
import { useSearchParams } from 'next/navigation';
import InstallPWAButton from './InstallPWAButton';
import BellBadge from './ui/BellBadge';

interface Tab {
  id: number;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const DeluxeNavTabs: React.FC = () => {
  const activeIndex = useSelector((state: any) => state.activeIndex.value);
  const activePostId = useSelector((state: any) => state.activePostId.value);
  // Import cart items from Redux store
  const cartItems = useSelector((state: any) => state.cart.cartItems as CartItem[]);
  const dispatch = useDispatch();
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  
  // Calculate total cart count
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const merchantIdFromUrl = searchParams.get('id');

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
  
  const handleTabClick = (tabId: number) => {
    if (pathname !== '/') {
      router.push('/');
      setTimeout(() => {
        dispatch(setActiveIndex(tabId));
      }, 100);
    } else {
      dispatch(setActiveIndex(tabId));
    }
  };

  const tabs: Tab[] = [
    {
      id: 1,
      label: 'Home',
      icon: <Home size={20} />,
      content: <DeluxeHomePage />,
    },
    {
      id: 2,
      label: 'Products',
      icon: <Tags size={20} />,
      content: <ProductsTab />,
    },
    {
      id: 4,
      label: 'Merchants',
      icon: <Store size={20} />,
      content: <MerchantsPage/>,
    },
    {
      id: 5,
      label: 'Messages',
      icon: <Users size={20} />,
      content: <MessagesTab />,
    },
    {
      id: 6,
      label: 'Cart',
      icon: <ShoppingCart size={20} />,
      content: <DeluxeCart />,
    },
    {
      id: 7,
      label: 'Profile',
      icon: <ShoppingCart size={20} />,
      content: <UserProfile userId={userId} />
    },
    {
      id: 8,
      label: 'Post',
      icon: <ShoppingCart size={20} />,
      content: <PostDetail postId={activePostId} />
    },
    {
      id: 9,
      label: 'PM',
      icon: <ShoppingCart size={20} />,
      content: <PMTab UserId={userId}/>
    },
    {
      id: 10,
      label: 'Order',
      icon: <ShoppingCart size={20} />,
      content: <OrderTracking userId={userId} />
    },
    {
      id: 11,
      label: 'Merchants',
      icon: <ShoppingCart size={20} />,
      content: <MerchantDetails userId={merchantIdFromUrl || ""} />
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
      <div className="fixed bg-violet-50 md:static bottom-0 left-0 right-0 w-full flex justify-between md:justify-center overflow-x-auto hide-scrollbar z-50 md:z-20 md:mb-1">
        {tabs.slice(0,5).map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`relative flex-1 md:flex-none flex items-center justify-center px-2 md:px-5 py-3 text-lg font-large whitespace-nowrap transition-all duration-300 border-b-4 ${
              activeIndex === tab.id
                ? 'border-indigo-800 text-white bg-gradient-to-t from-indigo-900 to-violet-900'
                : 'border-violet-600 text-violet-600 hover:text-violet-600 hover:border-violet-400'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xl ml-2 hidden md:inline">{tab.label}</span>
            {/* Cart notification badge with dynamic count */}
            {tab.label === 'Cart' && cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        ))}
      </div>
      <Ads/>
      <InstallPWAButton/>
      <div className="checkard w-full max-w-7xl relative border border-gray-200 overflow-hidden">
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
