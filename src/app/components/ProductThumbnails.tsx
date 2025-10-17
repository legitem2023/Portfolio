// components/ProductThumbnails.tsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../Redux/cartSlice';
import QuickViewModal from './QuickViewModal';
import Image from 'next/image';
import { showToast } from '../../../utils/toastify'
import { Product } from '../../../types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import { Autoplay } from 'swiper/modules';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


interface ProductThumbnailsProps {
  products: Product[];
}

const ProductThumbnails: React.FC<ProductThumbnailsProps> = ({ products }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const dispatch = useDispatch();

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const handleAddToCart = (product: Product) => {
    /*const cartItem = {
      userId:"",
      id: product.id.toString(),
      name: product.name,
      description: product.description || '',
      price: product.price,
      quantity: 1,
      image: product.image,
      // Adding the missing properties with default values
      productCode: product.productCode || `PC-${product.id}`,
      color: product.colors && product.colors.length > 0 ? product.colors[0] : 'Default',
      size: product.size || 'M',
      category: product.category,
      rating: product.rating
    };*/
    
    //dispatch(addToCart(cartItem));
    
    //showToast('Added to Cart', 'success')
    // Optional: Show a notification or toast message
    // You can implement a toast notification system here
  };

  // Helper function to get unique colors from variants
  const getUniqueColors = (variants: Product['variants']) => {
    const colors = variants.map(variant => variant.color).filter(Boolean);
    return Array.from(new Set(colors));
  };
console.log(product.variants.filter((variant: any) => variant.sku === product.sku));
  
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-3 lg:gap:4">
        {products.map((product) => {
          // Get unique colors from variants using helper function
          const uniqueColors = getUniqueColors(product.variants);
          
          return (
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
              <div className="relative overflow-hidden aspect-[1/1] bg-gray-100">
                
<Swiper
  spaceBetween={10}
  slidesPerView={1}
  navigation
  autoplay={{
    delay: 3000,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  }}
  pagination={{ clickable: true }}
  modules={[Autoplay]}
  className="h-full"
>
  {product.variants
    .filter((variant: any) => variant.sku === product.sku)
    .flatMap((variant: any) => 
      variant.images?.map((image: string, index: number) => ({
        image,
        key: `${variant.sku}-${index}`
      })) || []
    )
    .map(({ image, key }) => (
      <SwiperSlide key={key}>
        <Image
          height="400"
          width="400"
          src={image || '/NoImage.webp'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </SwiperSlide>
    ))
  }
</Swiper>
                
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
                    <span className="text-xs text-gray-500 ml-1">0</span>
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
                  <button 
                    className="bg-amber-600 hover:bg-amber-700 text-white p-1.5 sm:p-2 rounded-full transition-colors"
                    onClick={() => handleAddToCart(product)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                
                {/* Color Options */}
                {uniqueColors.length > 0 && (
                  <div className="mt-2 flex items-center space-x-1">
                    <span className="text-xs text-gray-500">Colors:</span>
                    <div className="flex space-x-1">
                      {uniqueColors.slice(0, 4).map((color, index) => (
                        <span
                          key={index}
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: color }}
                        ></span>
                      ))}
                      {uniqueColors.length > 4 && (
                        <span className="text-xs text-gray-500">+{uniqueColors.length - 4}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Quick View Modal */}
       <QuickViewModal 
        product={selectedProduct} 
        isOpen={isQuickViewOpen} 
        onClose={handleCloseQuickView} 
        onAddToCart={handleAddToCart}
      />
    </>
  );
};

export default ProductThumbnails;
