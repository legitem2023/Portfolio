'use client';
import React, { useState } from 'react';
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
  MessageCircle,
  ShoppingCart,
  Tags
} from 'lucide-react';
import ProductsTab from './ProductsTab';
import MessagesTab from './MessagesTab';
import CartTab from './CartTab';
import DeluxeHomePage from './DeluxeHomePage';

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
      icon: <Home size={20} className="text-gold" />,
      content: <DeluxeHomePage/>,
    },
    {
      id: 'products',
      label: 'Products',
      icon: <Tags size={20} className="text-gold" />,
      content: <ProductsTab/>,
    },
    {
      id: 'deals',
      label: 'Exclusive Deals',
      icon: <Target size={20} className="text-gold" />,
      content: (
        <div className="p-8 bg-gradient-to-br from-charcoal to-jet-black rounded-xl shadow-2xl border border-gold/20">
          <h3 className="text-2xl font-bold mb-6 text-gold">Exclusive Offers</h3>
          <div className="bg-gradient-to-r from-gold to-amber-400 text-charcoal p-6 rounded-2xl mb-6 shadow-lg border border-gold/30">
            <h4 className="font-bold text-xl mb-2">VIP Flash Sale</h4>
            <p className="text-sm mb-3">Ends in: 02:45:33</p>
            <div className="w-full bg-charcoal/20 rounded-full h-2.5 mt-3">
              <div className="bg-charcoal h-2.5 rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border border-gold/30 rounded-xl p-5 bg-gradient-to-br from-charcoal to-jet-black flex items-center shadow-md">
              <div className="bg-gold/10 p-3 rounded-xl mr-4">
                <Sparkles className="text-gold" size={24} />
              </div>
              <div>
                <h4 className="font-medium text-white">New Customer Offer</h4>
                <p className="text-sm text-gold">15% off your first order</p>
              </div>
            </div>
            <div className="border border-gold/30 rounded-xl p-5 bg-gradient-to-br from-charcoal to-jet-black flex items-center shadow-md">
              <div className="bg-gold/10 p-3 rounded-xl mr-4">
                <Gift className="text-gold" size={24} />
              </div>
              <div>
                <h4 className="font-medium text-white">Valentines Collection</h4>
                <p className="text-sm text-gold">Buy one, get one 50% off</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'brands',
      label: 'Luxe Brands',
      icon: <Star size={20} className="text-gold" />,
      content: (
        <div className="p-8 bg-gradient-to-br from-charcoal to-jet-black rounded-xl shadow-2xl border border-gold/20">
          <h3 className="text-2xl font-bold mb-6 text-gold">Haute Couture</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Gucci', 'Prada', 'Hermès', 'Tiffany', 'Rolex', 'Dior', 'Chanel', 'Louis Vuitton'].map((brand) => (
              <div key={brand} className="p-5 bg-charcoal/50 rounded-xl border border-gold/10 text-center backdrop-blur-sm transition-all hover:border-gold/30 hover:scale-105">
                <div className="font-semibold mb-2 text-white">{brand}</div>
                <div className="text-xs text-gold/80">Exclusive collection</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'services',
      label: 'Concierge',
      icon: <Gift size={20} className="text-gold" />,
      content: (
        <div className="p-8 bg-gradient-to-br from-charcoal to-jet-black rounded-xl shadow-2xl border border-gold/20">
          <h3 className="text-2xl font-bold mb-6 text-gold">Premium Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: <Gift size={28} className="text-gold" />, title: 'Gift Wrapping', desc: 'Elegant gift wrapping with personalized message.', color: 'gold' },
              { icon: <ShoppingBag size={28} className="text-gold" />, title: 'Express Delivery', desc: 'Next-day delivery available for all orders.', color: 'gold' },
              { icon: <Target size={28} className="text-gold" />, title: 'Easy Returns', desc: '30-day return policy for all items.', color: 'gold' },
              { icon: <Star size={28} className="text-gold" />, title: 'VIP Membership', desc: 'Exclusive benefits and early access to sales.', color: 'gold' }
            ].map((service, index) => (
              <div key={index} className="bg-charcoal/50 p-6 rounded-2xl border border-gold/10 backdrop-blur-sm transition-all hover:border-gold/30">
                <div className="mb-4">{service.icon}</div>
                <h4 className="font-semibold mb-2 text-white">{service.title}</h4>
                <p className="text-sm text-gold/80">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'Messages',
      label: 'Messages',
      icon: <MessageCircle size={20} className="text-gold" />,
      content: <MessagesTab/>,
    },{
      id: 'Cart',
      label: 'Cart',
      icon: <ShoppingCart size={20} className="text-gold" />,
      content: <CartTab/>,
    },
  ];

  function getCategoryIcon(category: string): React.ReactNode {
    const icons: Record<string, React.ReactNode> = {
      'Clothing': <Shirt size={18} className="text-gold" />,
      'Accessories': <Briefcase size={18} className="text-gold" />,
      'Footwear': <Footprints size={18} className="text-gold" />,
      'Jewelry': <Gem size={18} className="text-gold" />,
      'Beauty': <Heart size={18} className="text-gold" />,
      'Home': <House size={18} className="text-gold" />,
      'Electronics': <Smartphone size={18} className="text-gold" />,
      'Gifts': <Gift size={18} className="text-gold" />,
    };
    return icons[category] || <Star size={18} className="text-gold" />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto font-sans">
      {/* Tab Navigation */}
      <div className="flex justify-center overflow-x-auto hide-scrollbar mb-2 bg-gradient-to-t from-charcoal to-jet-black border-b border-gold/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-6 py-4 text-md font-bold whitespace-nowrap transition-all duration-300 border-b-2 ${activeTab === tab.id
              ? 'border-gold text-gold bg-gradient-to-t from-gold/10 to-transparent'
              : 'border-gold/30 text-gold/70 hover:text-gold hover:border-gold/60'
              }`}
          >
            <span className="mr-2">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gradient-to-br from-charcoal to-jet-black rounded-2xl shadow-2xl border border-gold/20 overflow-hidden">
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
      
      <style jsx global>{`
        :root {
          --color-gold: #D4AF37;
          --color-charcoal: #1a1a1a;
          --color-jet-black: #0d0d0d;
        }
        
        .text-gold {
          color: #D4AF37;
        }
        
        .border-gold {
          border-color: #D4AF37;
        }
        
        .bg-gold {
          background-color: #D4AF37;
        }
        
        .from-charcoal {
          --tw-gradient-from: #1a1a1a;
          --tw-gradient-to: rgb(26 26 26 / 0);
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
        }
        
        .to-jet-black {
          --tw-gradient-to: #0d0d0d;
        }
      `}</style>
    </div>
  );
};

export default DeluxeNavTabs;
