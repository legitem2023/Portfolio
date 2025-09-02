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
      image: '/images/handbag.jpg',
      images: ['/images/handbag.jpg', '/images/handbag-2.jpg', '/images/handbag-3.jpg'],
      category: 'Accessories',
      rating: 4.8,
      description: 'Handcrafted genuine leather handbag with gold accents',
      longDescription: 'This exquisite handbag is crafted from the finest genuine leather, featuring meticulous stitching and luxurious gold hardware.',
      features: ['Genuine leather', 'Gold hardware', 'Adjustable strap', 'Multiple compartments'],
      stock: 15,
      colors: ['Black', 'Brown', 'Burgundy'],
      sizes: ['One Size']
    },
    {
      id: '2',
      name: 'Luxury Watch',
      price: 1250,
      image: '/images/watch.jpg',
      images: ['/images/watch.jpg', '/images/watch-2.jpg', '/images/watch-3.jpg'],
      category: 'Accessories',
      rating: 4.9,
      description: 'Swiss automatic movement with diamond markers',
      longDescription: 'Experience precision and elegance with our Swiss-made automatic timepiece.',
      features: ['Swiss automatic movement', 'Sapphire crystal', 'Diamond markers', 'Water resistant'],
      stock: 8,
      colors: ['Silver', 'Gold', 'Rose Gold'],
      sizes: ['Standard']
    },
    {
      id: '3', 
      name: 'Cashmere Scarf',
      price: 189,
      image: '/images/scarf.jpg',
      images: ['/images/scarf.jpg', '/images/scarf-2.jpg', '/images/scarf-3.jpg'],
      category: 'Accessories',
      rating: 4.7,
      description: '100% pure cashmere with heritage pattern',
      longDescription: 'Wrap yourself in luxury with our 100% pure cashmere scarf.',
      features: ['100% pure cashmere', 'Heritage pattern', 'Lightweight warmth', 'Hand-finished edges'],
      stock: 22,
      colors: ['Cream', 'Navy', 'Burgundy', 'Grey'],
      sizes: ['One Size']
    },
    {
      id: '4',
      name: 'Designer Sunglasses',
      price: 350,
      image: '/images/sunglasses.jpg',
      category: 'Accessories',
      rating: 4.6,
      description: 'Polarized lenses with premium acetate frames',
      stock: 12,
      colors: ['Black', 'Tortoise', 'Clear'],
      sizes: ['One Size']
    }
  ];

  const newArrivals: Product[] = [
    {
      id: '5',
      name: 'Silk Evening Dress',
      price: 450,
      image: '/images/dress.jpg',
      category: 'Clothing',
      rating: 4.9,
      description: 'Elegant silk dress with hand-embellished details',
      stock: 6,
      colors: ['Black', 'Navy', 'Emerald'],
      sizes: ['XS', 'S', 'M', 'L']
    },
    {
      id: '6',
      name: 'Italian Leather Shoes',
      price: 380,
      image: '/images/shoes.jpg',
      category: 'Footwear',
      rating: 4.7,
      description: 'Handcrafted leather shoes with cushioned insoles',
      stock: 10,
      colors: ['Brown', 'Black', 'Oxblood'],
      sizes: ['7', '8', '9', '10', '11']
    }
  ];

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
