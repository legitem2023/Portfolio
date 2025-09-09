// components/ProductThumbnails.tsx
import React, { useState } from 'react';
import QuickViewModal from './QuickViewModal';
import Image from 'next/image';

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  category: string;
  onSale?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  colors?: string[];
}

interface ProductThumbnailsProps {
  products: Product[];
}

const ProductThumbnails: React.FC<ProductThumbnailsProps> = ({ products }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-3 lg:gap:4">
        {products.map((product) => (
          <div key={product.id} className="group relative bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100">
            {/* Sale/New Badge */}
            {(product.onSale || product.isNew) && (
              <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1">
                {product.onSale && (
                  <span className="px-2 py-1 text-xs font-bold bg-red-600 text-white rounded-md">SALE</span>
                )}
                {product.isNew && (
                  <span className="px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded-md">NEW</span>
                )}
              </div>
            )}
            
            {/* Featured Badge */}
            {product.isFeatured && (
              <div className="absolute top-3 right-3 z-10">
                <span className="px-2 py-1 text-xs font-bold bg-amber-600 text-white rounded-md">FEATURED</span>
              </div>
            )}
            
            {/* Product Image */}
            <div className="relative overflow-hidden h-48 bg-gray-100">
              <Image
                height="100"
                width="100"
                src={product.image || '/NoImage.svg'} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Quick View Button */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <button 
                  onClick={() => handleQuickView(product)} 
                  className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-gray-900 font-medium px-3 py-1.5 text-sm rounded-md"
                >
                  Quick View
                </button>
              </div>
            </div>
            
            {/* Product Details */}
            <div className="p-3">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900 text-xs sm:text-sm hover:text-amber-700 transition-colors cursor-pointer line-clamp-2">
                  {product.name}
                </h3>
                
                {/* Wishlist Button */}
                <button className="text-gray-400 hover:text-red-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center mb-2">
                {/* Rating */}
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-3 h-3 sm:w-4 sm:h-4 ${star <= Math.round(product.rating) ? 'text-amber-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs text-gray-500 ml-1">({product.reviewCount})</span>
                </div>
              </div>
              
              {/* Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="text-sm sm:text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs text-gray-500 line-through">${product.originalPrice.toFixed(2)}</span>
                  )}
                </div>
                
                {/* Add to Cart Button */}
                <button className="bg-amber-600 hover:bg-amber-700 text-white p-1.5 sm:p-2 rounded-full transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
              
              {/* Color Options */}
              {product.colors && product.colors.length > 0 && (
                <div className="mt-2 flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Colors:</span>
                  <div className="flex space-x-1">
                    {product.colors.slice(0, 4).map((color, index) => (
                      <span
                        key={index}
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      ></span>
                    ))}
                    {product.colors.length > 4 && (
                      <span className="text-xs text-gray-500">+{product.colors.length - 4}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick View Modal */}
      <QuickViewModal 
        product={selectedProduct} 
        isOpen={isQuickViewOpen} 
        onClose={handleCloseQuickView} 
      />
    </>
  );
};

// Function to generate sample products
export const generateSampleProducts = (count: number = 100): Product[] => {
  const categories = [
    "Clothing", "Accessories", "Footwear", "Jewelry", 
    "Beauty", "Home", "Electronics", "Gifts"
  ];
  
  const productNames = [
    "Premium Leather Jacket", "Luxury Silk Scarf", "Designer Sunglasses", 
    "Gold Plated Watch", "Cashmere Sweater", "Italian Leather Boots",
    "Pearl Necklace", "Velvet Evening Gown", "Suede Handbag", 
    "Diamond Stud Earrings", "Wool Fedora Hat", "Silk Tie", 
    "Crystal Champagne Flutes", "Marble Phone Case", "Velour Tracksuit",
    "Satin Pajamas", "Ceramic Vase", "Brass Desk Lamp", 
    "Porcelain Dinner Set", "Wooden Watch", "Titanium Bracelet",
    "Alphabet Necklace", "Personalized Ring", "Birthstone Pendant",
    "Smart Fitness Tracker", "Wireless Earbuds", "Portable Charger",
    "Bluetooth Speaker", "VR Headset", "Gaming Mouse",
    "Mechanical Keyboard", "4K Monitor", "External SSD",
    "Noise Cancelling Headphones", "Smartwatch", "E-Reader",
    "Action Camera", "Drone", "Instant Camera",
    "Photo Printer", "Air Purifier", "Humidifier",
    "Essential Oil Diffuser", "Weighted Blanket", "Yoga Mat",
    "Resistance Bands", "Adjustable Dumbbells", "Foam Roller",
    "Meditation Cushion", "Journal Notebook", "Calligraphy Set",
    "Watercolor Paint Set", "Sketchbook", "Digital Drawing Tablet",
    "Board Game", "Jigsaw Puzzle", "Playing Cards",
    "Cookbook", "Coffee Table Book", "Candle Making Kit",
    "Cocktail Shaker Set", "Wine Decanter", "Cheese Board",
    "Indoor Herb Garden", "Bonsai Tree", "Terrarium",
    "Wind Chimes", "Bird Feeder", "Hammock",
    "Picnic Basket", "Beach Towel", "Sunscreen",
    "Sunglasses Case", "Passport Holder", "Luggage Tag",
    "Neck Pillow", "Eye Mask", "Water Bottle",
    "Lunch Box", "Thermos", "Umbrella",
    "Rain Boots", "Winter Gloves", "Knit Beanie",
    "Scarf and Glove Set", "Thermal Socks", "Hand Warmers",
    "Fire Pit", "Porch Swing", "String Lights",
    "Plant Stand", "Bookends", "Desk Organizer",
    "Pen Holder", "Letter Tray", "Document Sorter"
  ];
  
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFBE0B", 
    "#FB5607", "#FF006E", "#8338EC", "#3A86FF",
    "#38B000", "#FDFFB6", "#9BF6FF", "#BDB2FF",
    "#A0C4FF", "#FFC6FF", "#FFFFFC", "#000000",
    "#FFFFFF", "#6A4C93", "#1982C4", "#8AC926"
  ];

  return Array.from({ length: count }, (_, i) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const name = productNames[Math.floor(Math.random() * productNames.length)];
    const price = Math.round(Math.random() * 200 + 10);
    const originalPrice = Math.random() > 0.7 ? Math.round(price * (1 + Math.random() * 0.5)) : undefined;
    const rating = Math.random() * 2 + 3; // Rating between 3 and 5
    const reviewCount = Math.floor(Math.random() * 500);
    const colorCount = Math.floor(Math.random() * 5) + 1;
    const productColors = Array.from({ length: colorCount }, () => 
      colors[Math.floor(Math.random() * colors.length)]
    );
    
    return {
      id: i + 1,
      name: `${name} ${i % 5 === 0 ? 'Deluxe' : ''} ${i % 7 === 0 ? 'Premium' : ''}`,
      price,
      originalPrice,
      rating: parseFloat(rating.toFixed(1)),
      reviewCount,
      image: `https://picsum.photos/400/500?random=${i + 1}`,
      category,
      onSale: Math.random() > 0.7,
      isNew: Math.random() > 0.8,
      isFeatured: Math.random() > 0.9,
      colors: productColors
    };
  });
};

export default ProductThumbnails;
