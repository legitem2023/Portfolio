'use client';
import React, { useState } from 'react';
import { 
  Home, 
  ShoppingBag, 
  Target, 
  Star, 
  Gift,
  Shirt,
  Briefcase,  // Replaced Handbag
  Footprints,
  Gem,
  Heart,      // Replaced Lipstick
  House,
  Smartphone,
  Sparkles
} from 'lucide-react';
import ProductsTab from './ProductsTab';
import MessagesTab from './MessagesTab';
interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const DeluxeNavTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');

  const tabs: Tab[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home size={18} />,
      content: (
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Welcome to LuxeShop</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
              <h4 className="font-medium text-amber-800">New Arrivals</h4>
              <p className="text-sm text-amber-600">Discover our latest collection</p>
            </div>
            <div className="bg-gradient-to-r from-rose-50 to-rose-100 p-4 rounded-lg border border-rose-200">
              <h4 className="font-medium text-rose-800">Summer Sale</h4>
              <p className="text-sm text-rose-600">Up to 70% off selected items</p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800">Premium Members</h4>
              <p className="text-sm text-blue-600">Exclusive benefits await</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'products',
      label: 'Products',
      icon: <ShoppingBag size={18} />,
      content: (
        <ProductsTab/>
      ),
    },
    {
      id: 'deals',
      label: 'Exclusive Deals',
      icon: <Target size={18} />,
      content: (
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Special Offers</h3>
          <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-5 rounded-xl mb-4 shadow-lg">
            <h4 className="font-bold text-lg">Flash Sale</h4>
            <p className="text-sm">Ends in: 02:45:33</p>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2 mt-2">
              <div className="bg-amber-400 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-amber-300 rounded-lg p-4 bg-amber-50 flex items-center">
              <div className="bg-amber-100 p-3 rounded-full mr-4">
                <Sparkles className="text-amber-700" size={20} />
              </div>
              <div>
                <h4 className="font-medium">New Customer Discount</h4>
                <p className="text-sm text-amber-700">15% off your first order</p>
              </div>
            </div>
            <div className="border border-rose-300 rounded-lg p-4 bg-rose-50 flex items-center">
              <div className="bg-rose-100 p-3 rounded-full mr-4">
                <Gift className="text-rose-700" size={20} />
              </div>
              <div>
                <h4 className="font-medium">Valentines Special</h4>
                <p className="text-sm text-rose-700">Buy one, get one 50% off</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'brands',
      label: 'Luxe Brands',
      icon: <Star size={18} />,
      content: (
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Featured Brands</h3>
          <div className="flex flex-wrap gap-4">
            {['Gucci', 'Prada', 'Hermès', 'Tiffany', 'Rolex', 'Dior', 'Chanel', 'Louis Vuitton'].map((brand) => (
              <div key={brand} className="flex-1 min-w-[120px] p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <div className="font-medium mb-2">{brand}</div>
                <div className="text-xs text-gray-500">Exclusive collection</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'services',
      label: 'Services',
      icon: <Gift size={18} />,
      content: (
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Premium Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="mb-3">
                <Gift size={24} className="text-amber-600" />
              </div>
              <h4 className="font-semibold mb-2">Gift Wrapping</h4>
              <p className="text-sm text-gray-600">Elegant gift wrapping with personalized message.</p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="mb-3">
                <ShoppingBag size={24} className="text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">Express Delivery</h4>
              <p className="text-sm text-gray-600">Next-day delivery available for all orders.</p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="mb-3">
                <Target size={24} className="text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Easy Returns</h4>
              <p className="text-sm text-gray-600">30-day return policy for all items.</p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="mb-3">
                <Star size={24} className="text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">VIP Membership</h4>
              <p className="text-sm text-gray-600">Exclusive benefits and early access to sales.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'Messages',
      label: 'Messages',
      icon: <Gift size={18} />,
      content: (
        <MessagesTab/>
      ),
    },
  ];

  // If you're using getCategoryIcon in ProductsTab, you might need to update it there too
  function getCategoryIcon(category: string): React.ReactNode {
    const icons: Record<string, React.ReactNode> = {
      'Clothing': <Shirt size={16} />,
      'Accessories': <Briefcase size={16} />,  // Updated from Handbag
      'Footwear': <Footprints size={16} />,
      'Jewelry': <Gem size={16} />,
      'Beauty': <Heart size={16} />,           // Updated from Lipstick
      'Home': <House size={16} />,
      'Electronics': <Smartphone size={16} />,
      'Gifts': <Gift size={16} />,
    };
    return icons[category] || <Star size={16} />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto font-sans">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar mb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-5 py-3 text-sm font-medium whitespace-nowrap transition-all duration-300 border-b-2 ${activeTab === tab.id
              ? 'border-amber-600 text-amber-700 bg-gradient-to-t from-amber-50 to-white'
              : 'border-transparent text-gray-600 hover:text-amber-600 hover:border-amber-400'
              }`}
          >
            <span>{tab.icon}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl rounded-tr-xl shadow-lg border border-gray-200 overflow-hidden">
        {tabs.find((tab) => tab.id === activeTab)?.content}
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
