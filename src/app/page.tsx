// pages/index.tsx
import LuxuryTabs from './components/ui/LuxuryTabs';
import ProductCard from './components/ui/ProductCard';
import { Product, Tab } from '../../types';

const LuxuryEcommercePage: React.FC = () => {
  // Sample product data
  const featuredProducts: Product[] = [
    {
      id: '1',
      name: 'Premium Leather Handbag',
      price: 299,
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      category: 'Accessories',
      rating: 4.8,
      description: 'Handcrafted genuine leather handbag with gold accents'
    },
    {
      id: '2',
      name: 'Luxury Watch',
      price: 1250,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      category: 'Accessories',
      rating: 4.9,
      description: 'Swiss automatic movement with diamond markers'
    },
    {
      id: '3', 
      name: 'Cashmere Scarf',
      price: 189,
      image: 'https://images.unsplash.com/photo-1600904265854-9b0d0c6115cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      category: 'Accessories',
      rating: 4.7,
      description: '100% pure cashmere with heritage pattern'
    },
    {
      id: '4',
      name: 'Designer Sunglasses',
      price: 350,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      category: 'Accessories',
      rating: 4.6,
      description: 'Polarized lenses with premium acetate frames'
    }
  ];

  const newArrivals: Product[] = [
    {
      id: '5',
      name: 'Silk Evening Dress',
      price: 450,
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      category: 'Clothing',
      rating: 4.9,
      description: 'Elegant silk dress with hand-embellished details'
    },
    {
      id: '6',
      name: 'Italian Leather Shoes',
      price: 380,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      category: 'Footwear',
      rating: 4.7,
      description: 'Handcrafted leather shoes with cushioned insoles'
    }
  ];

  const collectionsContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="relative group overflow-hidden rounded-2xl luxury-shadow">
        <div className="aspect-[4/3] bg-gradient-to-r from-golden-400 to-golden-600 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <h3 className="text-2xl font-serif font-semibold mb-2">Spring Collection</h3>
            <p className="mb-4">Fresh designs for the new season</p>
            <button className="px-6 py-2 bg-white text-golden-600 rounded-full font-medium">
              Explore
            </button>
          </div>
        </div>
      </div>
      
      <div className="relative group overflow-hidden rounded-2xl luxury-shadow">
        <div className="aspect-[4/3] bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <h3 className="text-2xl font-serif font-semibold mb-2">Limited Edition</h3>
            <p className="mb-4">Exclusive pieces for discerning tastes</p>
            <button className="px-6 py-2 bg-golden-500 text-white rounded-full font-medium">
              Discover
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs: Tab[] = [
    {
      id: 'featured',
      label: 'Featured',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {featuredProducts.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )
    },
    {
      id: 'new',
      label: 'New Arrivals',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {newArrivals.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )
    },
    {
      id: 'collections',
      label: 'Collections',
      content: collectionsContent
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-serif font-light text-gray-900 mb-4">
            Luxury Collection
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover exquisite pieces crafted with unparalleled attention to detail
          </p>
        </header>

        <LuxuryTabs tabs={tabs} defaultTab="featured" />
      </div>
    </div>
  );
};

export default LuxuryEcommercePage;
