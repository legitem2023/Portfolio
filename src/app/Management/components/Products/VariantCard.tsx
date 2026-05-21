import { useState, useRef, useEffect } from 'react';
import { Variant } from '../../../../../types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import { useMutation } from '@apollo/client';
import { useFoodCategories } from '../../../components/hooks/useFoodCategories';
import sizeData from '../Json/sizes.json';
import { useAuth } from '../../hooks/useAuth';

import { UPDATE_VARIANT_MUTATION } from '../../../components/graphql/mutation';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';

interface VariantCardProps {
  variant: Variant;
  onImageUpload: (variantId: string, file: File) => void;
  onImageDelete: (variantId: string, imageIndex: number) => void;
  refetch: any;
  isUploading: boolean;
  productCategoryName?: string;
}

// Helper function to check if a color is a valid hex color
const isValidHexColor = (color: string): boolean => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

// Helper function to check if should show color swatch or image
const shouldShowColorSwatch = (color: string): boolean => {
  if (!color) return false;
  if (!color.startsWith('#')) return false;
  return isValidHexColor(color);
};

// Helper function to check if category is Foods and Drinks
const isFoodsAndDrinksCategory = (categoryName?: string): boolean => {
  if (!categoryName) return false;
  const foodsAndDrinksKeywords = ['Foods and Drinks', 'Food & Drinks', 'Foods & Drinks', 'Food and Drinks', 'Food', 'Drinks', 'Beverages'];
  return foodsAndDrinksKeywords.some(keyword => 
    categoryName.toLowerCase().includes(keyword.toLowerCase())
  );
};

export default function VariantCard({ 
  variant, 
  onImageUpload,
  onImageDelete,
  refetch,
  isUploading,
  productCategoryName
}: VariantCardProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSizeParent, setSelectedSizeParent] = useState('');
  const [showCustomSize, setShowCustomSize] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();

  // Get food categories data
  const { foodCategories, loading: categoriesLoading } = useFoodCategories(user?.userId);
  
  // State for flavor selection
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  
  // Extract food categories array
  const foodCategoriesArray = foodCategories?.food_categories || (Array.isArray(foodCategories) ? foodCategories : []);
  
  // Determine if this variant should show as Flavor or Color
  const showAsFlavor = !shouldShowColorSwatch(variant.color || '');
  const displayLabel = showAsFlavor ? 'Flavor' : 'Color';
  
  // Check if this is a Foods and Drinks category
  const isFoodDrinks = isFoodsAndDrinksCategory(productCategoryName);
  
  const [editData, setEditData] = useState({
    name: variant.name,
    sku: variant.sku || '',
    color: variant.color || '',
    size: variant.size || '',
    price: variant.price?.toString() || '',
    salePrice: variant.salePrice?.toString() || '',
    stock: variant.stock?.toString() || ''
  });

  const [updateVariant] = useMutation(UPDATE_VARIANT_MUTATION, {
    refetchQueries: ['GetProducts']
  });

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Detect size category when editing starts (only for non-food products)
  useEffect(() => {
    if (!isFoodDrinks && isEditing && variant.size) {
      const detectedParent = sizeData.find(category => 
        category.values.includes(variant.size)
      )?.parent || '';
      
      setSelectedSizeParent(detectedParent);
      setShowCustomSize(!detectedParent && variant.size !== '');
    }
  }, [isEditing, variant.size, isFoodDrinks]);

  // Initialize flavor selection when editing a food product
  useEffect(() => {
    if (isFoodDrinks && isEditing && variant.color && foodCategoriesArray.length > 0) {
      // Find which category and item matches the current flavor
      for (const category of foodCategoriesArray) {
        const foundItem = category.items?.find((item: any) => item.name === variant.color);
        if (foundItem) {
          setSelectedCategory(category.id);
          setSelectedItem(foundItem.id);
          break;
        }
      }
    }
  }, [isEditing, variant.color, isFoodDrinks, foodCategoriesArray]);

  // Reset edit data when variant changes
  useEffect(() => {
    if (!isEditing) {
      setEditData({
        name: variant.name,
        sku: variant.sku || '',
        color: variant.color || '',
        size: variant.size || '',
        price: variant.price?.toString() || '',
        salePrice: variant.salePrice?.toString() || '',
        stock: variant.stock?.toString() || ''
      });
      setSelectedCategory('');
      setSelectedItem('');
    }
  }, [variant, isEditing]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file) {
      onImageUpload(variant.id, file);
      
      if (fileInputRef.current) {
        setTimeout(() => {
          refetch();
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 100);
      }
    }
  };

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteClick = (index: number) => {
    setShowDeleteConfirm(index);
  };

  const handleConfirmDelete = (index: number) => {
    onImageDelete(variant.id, index);
    setShowDeleteConfirm(null);
    setTimeout(() => refetch(), 500);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedSizeParent('');
    setShowCustomSize(false);
    setSelectedCategory('');
    setSelectedItem('');
    setEditData({
      name: variant.name,
      sku: variant.sku || '',
      color: variant.color || '',
      size: variant.size || '',
      price: variant.price?.toString() || '',
      salePrice: variant.salePrice?.toString() || '',
      stock: variant.stock?.toString() || ''
    });
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const input = {
        name: editData.name,
        sku: editData.sku || undefined,
        color: editData.color || undefined,
        size: editData.size || undefined,
        price: editData.price ? parseFloat(editData.price) : undefined,
        salePrice: editData.salePrice ? parseFloat(editData.salePrice) : undefined,
        stock: parseInt(editData.stock) || 0
      };

      await updateVariant({
        variables: {
          id: variant.id,
          input
        }
      });

      setIsEditing(false);
      setSelectedSizeParent('');
      setShowCustomSize(false);
      setSelectedCategory('');
      setSelectedItem('');
      refetch();
    } catch (error) {
      console.error('Error updating variant:', error);
      alert('Error updating variant. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSizeCategoryChange = (parent: string) => {
    setSelectedSizeParent(parent);
    setShowCustomSize(parent === 'Custom');
    if (parent !== 'Custom') {
      setEditData(prev => ({ ...prev, size: '' }));
    }
  };

  const handleSizeSelect = (size: string) => {
    setEditData(prev => ({ ...prev, size }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedItem('');
    setEditData(prev => ({ ...prev, color: '' }));
  };

  const handleItemChange = (itemId: string) => {
    const selectedCategoryObj = foodCategoriesArray.find((cat: any) => cat.id === selectedCategory);
    const selectedItemObj = selectedCategoryObj?.items.find((item: any) => item.id === itemId);
    setSelectedItem(itemId);
    setEditData(prev => ({ ...prev, color: selectedItemObj?.name || itemId }));
  };

  const hasImages = variant.images && variant.images.length > 0;
  const imageCount = variant.images?.length || 0;

  // Format price to Philippine Peso format
  const formatPrice = (price: number | null | undefined) => {
    if (!price) return '₱0.00';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price).replace('PHP', '₱');
  };

  // Stock status indicator
  const getStockStatus = (stock: number | undefined) => {
    const stockValue = stock ?? 0;
    if (stockValue === 0) return { label: isMobile ? 'Out' : 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stockValue < 10) return { label: isMobile ? `Low: ${stockValue}` : `Low Stock: ${stockValue} left`, color: 'bg-orange-100 text-orange-800' };
    return { label: isMobile ? `${stockValue} in stock` : `${stockValue} units in stock`, color: 'bg-green-100 text-green-800' };
  };

  const stockStatus = getStockStatus(variant.stock ?? 0);

  // Responsive thumbnail count
  const getThumbnailSlidesPerView = () => {
    if (isMobile) return 3;
    if (window.innerWidth < 768) return 4;
    return 5;
  };

  return (
    <div className="group bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 overflow-hidden relative">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm sm:text-base font-bold text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Variant name"
                    autoFocus
                  />
                  <input
                    type="text"
                    name="sku"
                    value={editData.sku}
                    onChange={handleEditChange}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="SKU"
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                    <h4 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
                      {variant.name}
                    </h4>
                    <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${stockStatus.color} whitespace-nowrap`}>
                      {stockStatus.label}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-500 font-mono">SKU: {variant.sku || 'N/A'}</p>
                </>
              )}
            </div>
            
            {/* Edit/Save/Cancel Buttons */}
            {isEditing ? (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Cancel"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                  title="Save"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleEditClick}
                className="flex-shrink-0 p-2 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-all duration-200 active:bg-blue-100"
                title="Edit variant"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Image Gallery Section */}
      <div className="px-4 sm:px-5 pb-3 sm:pb-5">
        <div className="relative">
          {hasImages ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Main Image Container */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl overflow-hidden">
                <Swiper
                  modules={[Navigation, Pagination, Thumbs]}
                  navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                  }}
                  pagination={{
                    clickable: true,
                    type: imageCount > 1 ? 'bullets' : 'fraction',
                    dynamicBullets: isMobile,
                  }}
                  thumbs={{ swiper: thumbsSwiper }}
                  spaceBetween={0}
                  slidesPerView={1}
                  className="h-full w-full"
                  touchRatio={1.5}
                  resistanceRatio={0.85}
                >
                  {variant.images!.map((image, index) => (
                    <SwiperSlide key={index}>
                      <div className="relative w-full h-full bg-gray-100">
                        <img 
                          src={image} 
                          alt={`${variant.name} - Image ${index + 1}`}
                          className="w-full h-48 sm:h-64 object-cover"
                          loading="lazy"
                        />
                        
                        <button
                          onClick={() => handleDeleteClick(index)}
                          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-red-600 p-1.5 sm:p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200 shadow-lg z-20"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Navigation Buttons */}
                {imageCount > 1 && !isMobile && (
                  <>
                    <button className="swiper-button-prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 w-7 h-7 rounded-full hover:bg-white shadow-lg transition-all duration-200 flex items-center justify-center z-20">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button className="swiper-button-next absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 w-7 h-7 rounded-full hover:bg-white shadow-lg transition-all duration-200 flex items-center justify-center z-20">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 active:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 w-[calc(100%-1rem)] sm:w-auto">
                    <button
                      onClick={handleAddImageClick}
                      className="w-full sm:w-auto bg-white text-gray-900 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Add Image</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Thumbnails */}
              {imageCount > 1 && (
                <div className="relative px-4">
                  <Swiper
                    modules={[Thumbs]}
                    watchSlidesProgress
                    onSwiper={setThumbsSwiper}
                    spaceBetween={6}
                    slidesPerView={getThumbnailSlidesPerView()}
                    className="thumbnail-swiper"
                  >
                    {variant.images!.map((image, index) => (
                      <SwiperSlide key={index}>
                        <div className="relative group/thumb">
                          <div className="bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent transition-all duration-200 group-[.swiper-slide-thumb-active]:border-blue-500">
                            <img 
                              src={image} 
                              alt={`Thumbnail ${index + 1}`}
                              className="aspect-square w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <button
                            onClick={() => handleDeleteClick(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-all opacity-0 group-hover/thumb:opacity-100 active:opacity-100 shadow-lg z-10"
                          >
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
              <div className="aspect-video flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm mb-3">No images yet</p>
                <button
                  onClick={handleAddImageClick}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center space-x-2 hover:bg-blue-700 transition-all duration-200"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Upload Image</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Variant Details - Vertical Layout */}
      <div className="px-4 sm:px-5 py-4 bg-gray-50/50 border-y border-gray-100">
        {isEditing ? (
          // Edit Mode - Vertical Form Layout
          <div className="space-y-4">
            {/* Color/Flavor with dynamic label */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {displayLabel}
              </label>
              
              {isFoodDrinks ? (
                // Dropdown selection for Foods and Drinks category
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Food Category
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      disabled={categoriesLoading}
                    >
                      <option value="">Select category</option>
                      {foodCategoriesArray.map((category: any) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCategory && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Food Item (Flavor)
                      </label>
                      <select
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={selectedItem}
                        onChange={(e) => handleItemChange(e.target.value)}
                      >
                        <option value="">Select item</option>
                        {foodCategoriesArray
                          .find((cat: any) => cat.id === selectedCategory)
                          ?.items.map((item: any) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Selected item will be used as flavor
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Color picker for non-food categories
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editData.color && editData.color.startsWith('#') ? editData.color : '#000000'}
                    onChange={(e) => setEditData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="color"
                    value={editData.color}
                    onChange={handleEditChange}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Color name or hex code"
                  />
                </div>
              )}
            </div>

            {/* Size - Conditional rendering based on category */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Size
              </label>
              
              {isFoodDrinks ? (
                // Simple text input for Foods and Drinks category
                <input
                  type="text"
                  name="size"
                  value={editData.size}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter size (e.g., Regular, Large, 12oz, 500ml)"
                />
              ) : (
                // Dropdown selection for other categories
                <div className="space-y-2">
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={selectedSizeParent}
                    onChange={(e) => handleSizeCategoryChange(e.target.value)}
                  >
                    <option value="">Select size category</option>
                    {sizeData.map((category) => (
                      <option key={category.parent} value={category.parent}>
                        {category.parent}
                      </option>
                    ))}
                  </select>

                  {selectedSizeParent && selectedSizeParent !== 'Custom' && (
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={editData.size}
                      onChange={(e) => handleSizeSelect(e.target.value)}
                    >
                      <option value="">Select a size</option>
                      {sizeData
                        .find(cat => cat.parent === selectedSizeParent)
                        ?.values.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                  )}

                  {(showCustomSize || selectedSizeParent === 'Custom') && (
                    <input
                      type="text"
                      name="size"
                      value={editData.size}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter custom size"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Regular Price (₱)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={editData.price}
                  onChange={handleEditChange}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Sale Price */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Sale Price (₱)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="salePrice"
                  value={editData.salePrice}
                  onChange={handleEditChange}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock"
                value={editData.stock}
                onChange={handleEditChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        ) : (
          // Display Mode - Vertical Layout
          <div className="space-y-3">
            {/* Color/Flavor row - shows image for flavors, swatch for colors */}
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{displayLabel}</span>
              <div className="flex items-center gap-2">
                {/* Show color swatch only for valid hex colors */}
                {!showAsFlavor && shouldShowColorSwatch(variant.color || '') && variant.color && (
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                    style={{ backgroundColor: variant.color }}
                  />
                )}
                {/* Show variant image for flavors (non-hex colors) */}
                {showAsFlavor && hasImages && (
                  <div className="w-6 h-6 rounded-md overflow-hidden border border-gray-200 shadow-sm">
                    <img 
                      src={variant.images![0]} 
                      alt={variant.color || variant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span className="text-sm font-semibold text-gray-900">{variant.color || '—'}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Size</span>
              <span className="text-sm font-semibold text-gray-900">{variant.size || '—'}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Price</span>
              <div className="text-right">
                <div className="flex flex-wrap items-center gap-1 justify-end">
                  <span className="text-sm font-bold text-gray-900">{formatPrice(variant.price)}</span>
                  {variant.salePrice && variant.price && variant.salePrice < variant.price && (
                    <span className="text-xs text-red-500 line-through">
                      {formatPrice(variant.salePrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</span>
              <span className="text-sm font-semibold text-gray-900">{variant.stock} units</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 sm:px-5 py-3 bg-white">
        <div className="flex flex-col gap-2">
          <div className="text-[10px] text-gray-400">
            <div>Created {new Date(variant.createdAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div className="font-mono text-[9px] mt-0.5">ID: {variant.id.slice(-8)}</div>
          </div>
          
          {!isEditing && (
            <button
              onClick={handleEditClick}
              className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Details
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Image?</h3>
            <p className="text-gray-600 text-center text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelete(showDeleteConfirm)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-40 rounded-xl">
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
            <p className="text-sm font-medium text-gray-700">Uploading image...</p>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
      }
