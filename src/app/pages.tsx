import LuxuryTabs from './components/ui/LuxuryTabs';
import ProductCard from './components/ui/ProductCard';
import { Product } from '../../types';

const LuxuryEcommercePage: React.FC = () => {
  // Sample product data
  const featuredProducts: Product[] = [
    {
      id: '1',
      name: 'Premium Leather Handbag',
      price: 299,
      image: '/images/handbag.jpg',
      category: 'Accessories',
      rating: 4.8,
      description: 'Handcrafted genuine leather handbag with gold accents'
    },
    {
      id: '2',
      name: 'Luxury Watch',
      price: 1250,
      image: '/images/watch.jpg',
      category: 'Accessories',
      rating: 4.9,
      description: 'Swiss automatic movement with diamond markers'
    },
    {
      id: '3', 
      name: 'Cashmere Scarf',
      price: 189,
      image: '/images/scarf.jpg',
      category: 'Accessories',
      rating: 4.7,
      description: '100% pure cashmere with heritage pattern'
    }
  ];

  const newArrivals: Product[] = [
    // New arrival products
  ];

  const tabs = [
    {
      id: 'featured',
      label: 'Featured',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {featuredProducts.map((product) => (
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
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )
    },
    {
      id: 'collections',
      label: 'Collections',
      content: (
        <div className="text-center py-12">
          <h2 className="text-3xl font-serif font-light text-gray-900 mb-6">
            Luxury Collections
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our exclusive collections curated for the discerning customer
          </p>
        </div>
      )
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
