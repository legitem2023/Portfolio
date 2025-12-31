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
import { useRouter, usePathname } from 'next/navigation'; // Add usePathname

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

interface Tab  {
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
  const [isSliding, setIsSliding] = useState(false); // Add sliding state
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right'); // Track slide direction
  
  const router = useRouter();
  const pathname = usePathname(); // Get current path
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
    // Determine slide direction based on tab order
    if (tabId > activeIndex) {
      setSlideDirection('left');
    } else {
      setSlideDirection('right');
    }
    
    // Start sliding animation
    setIsSliding(true);
    
    // If not on homepage, redirect to homepage first
    if (pathname !== '/') {
      router.push('/');
      // Optionally, you can set a timeout to dispatch the active index after navigation
      setTimeout(() => {
        dispatch(setActiveIndex(tabId));
        // End sliding animation after a short delay
        setTimeout(() => setIsSliding(false), 300);
      }, 100);
    } else {
      // If already on homepage, update the active tab
      dispatch(setActiveIndex(tabId));
      // End sliding animation after a short delay
      setTimeout(() => setIsSliding(false), 300);
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
    /*{
      id: 3,
      label: 'Exclusive Deals',
      icon: <Target size={20} />,
      content: (
        <FlashSale/>
      ),
    },*/
    {
      id:4,
      label: 'Merchants',
      icon: <Store size={20} />,
      content: (
        <MerchantsPage/>
      ),
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
      content: <UserProfile userId={userId} /> // Uses JWT userId
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
      id:10,
      label: 'Order',
      icon: <ShoppingCart size={20} />,
      content:<OrderTracking userId={userId} /> // Uses JWT userId
    },
    {
      id:11,
      label: 'Merchants',
      icon: <ShoppingCart size={20} />,
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
       <div className="fixed md:static bottom-0 left-0 right-0 w-full flex justify-between md:justify-center overflow-x-auto hide-scrollbar bg-gradient-to-t from-violet-100 to-white z-50 md:z-20 md:mb-1">
        {tabs.slice(0,5).map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`relative flex-1 md:flex-none flex items-center justify-center px-2 md:px-5 py-3 text-lg font-large whitespace-nowrap transition-all duration-300 border-b-4 ${
              activeIndex === tab.id
                ? 'border-amber-800 text-amber-800 bg-gradient-to-t from-amber-50 to-white'
                : 'border-violet-600 text-violet-600 hover:text-violet-600 hover:border-violet-400'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xl ml-2 hidden md:inline">{tab.label}</span>
            {tab.label==='Cart' && (<BellBadge count={10} variant={`danger`}/>)}
          </button>
        ))}
      </div>
      <Ads/>
      <InstallPWAButton/>
      
      {/* Add sliding container wrapper */}
      <div className={`relative bg-white shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
        isSliding ? (slideDirection === 'left' ? 'slide-out-left' : 'slide-out-right') : ''
      }`}>
        <div className={isSliding ? (slideDirection === 'left' ? 'slide-in-right' : 'slide-in-left') : ''}>
          {tabs.find((tab) => tab.id === activeIndex)?.content}
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* Facebook-like sliding animations */
        .slide-out-left {
          animation: slideOutLeft 0.3s ease-in-out forwards;
        }
        
        .slide-out-right {
          animation: slideOutRight 0.3s ease-in-out forwards;
        }
        
        .slide-in-left {
          animation: slideInLeft 0.3s ease-in-out forwards;
        }
        
        .slide-in-right {
          animation: slideInRight 0.3s ease-in-out forwards;
        }
        
        @keyframes slideOutLeft {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(-100%);
            opacity: 0.3;
          }
        }
        
        @keyframes slideOutRight {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0.3;
          }
        }
        
        @keyframes slideInLeft {
          0% {
            transform: translateX(-100%);
            opacity: 0.3;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideInRight {
          0% {
            transform: translateX(100%);
            opacity: 0.3;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        /* Smooth fade transition for non-sliding content */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }
      `}</style>
    </div>
  );
};

export default DeluxeNavTabs;
