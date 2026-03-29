import { useState, useRef, useEffect } from 'react';
import { Variant } from '../../../../../types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';

interface VariantCardProps {
  variant: Variant;
  onImageUpload: (variantId: string, file: File) => void;
  onImageDelete: (variantId: string, imageIndex: number) => void;
  isUploading: boolean;
  onEdit?: (variant: Variant) => void;
}

export default function VariantCard({ 
  variant, 
  onImageUpload,
  onImageDelete,
  isUploading,
  onEdit
}: VariantCardProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
   
    if (file) {
      onImageUpload(variant.id, file);
      if (fileInputRef.current) {
       // fileInputRef.current.value = '';
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
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(variant);
    }
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

  // Stock status indicator with responsive text
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
    <div className="group bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                <h4 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">
                  {variant.name}
                </h4>
                <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${stockStatus.color} whitespace-nowrap`}>
                  {stockStatus.label}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 font-mono truncate">SKU: {variant.sku || 'N/A'}</p>
            </div>
            
            {/* Edit Button - Larger touch target on mobile */}
            {onEdit && (
              <button
                onClick={handleEditClick}
                className="flex-shrink-0 p-2 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-all duration-200 active:bg-blue-100"
                title="Edit variant"
                aria-label="Edit variant"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Image Gallery Section - Optimized for touch */}
      <div className="px-3 sm:px-5 pb-3 sm:pb-5">
        <div className="relative">
          {hasImages ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Main Image Container */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl overflow-hidden">
                <div className="aspect-video">
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
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          
                          {/* Delete Button - Larger on mobile for better touch */}
                          <button
                            onClick={() => handleDeleteClick(index)}
                            className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-sm text-red-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-red-600 hover:text-white transition-all duration-200 shadow-lg z-20 active:scale-95"
                            aria-label={`Delete image ${index + 1}`}
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>

                  {/* Navigation Buttons - Hidden on very small screens, visible on tablet+ */}
                  {imageCount > 1 && !isMobile && (
                    <>
                      <button className="swiper-button-prev absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-white shadow-lg transition-all duration-200 flex items-center justify-center z-20">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button className="swiper-button-next absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-white shadow-lg transition-all duration-200 flex items-center justify-center z-20">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Upload Overlay - Touch friendly */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 active:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 w-[calc(100%-1rem)] sm:w-auto">
                      <button
                        onClick={handleAddImageClick}
                        className="w-full sm:w-auto bg-white text-gray-900 px-3 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>Add Image</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thumbnails - Responsive layout */}
              {imageCount > 1 && (
                <div className="relative px-4 sm:px-6">
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
                          <div className="bg-gray-100 rounded-lg sm:rounded-xl overflow-hidden border-2 border-transparent transition-all duration-200 group-[.swiper-slide-thumb-active]:border-blue-500 group-[.swiper-slide-thumb-active]:shadow-md">
                            <img 
                              src={image} 
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          
                          {/* Delete Button on Thumbnail - Touch friendly */}
                          <button
                            onClick={() => handleDeleteClick(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white p-1 sm:p-1.5 rounded-full hover:bg-red-600 transition-all opacity-0 group-hover/thumb:opacity-100 active:opacity-100 shadow-lg z-10"
                            aria-label={`Delete image ${index + 1}`}
                          >
                            <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            /* Empty State - Touch friendly */
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="aspect-video flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-center mb-2 sm:mb-3">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4">No images yet</p>
                <button
                  onClick={handleAddImageClick}
                  className="bg-blue-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center space-x-2 hover:bg-blue-700 transition-all duration-200 shadow-md active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Upload Image</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Variant Details Grid - Responsive layout */}
      <div className="px-3 sm:px-5 py-3 sm:py-4 bg-gray-50/50 border-y border-gray-100">
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">Color</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{variant.color || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">Size</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{variant.size || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">Price</p>
            <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-bold text-gray-900">{formatPrice(variant.price)}</span>
              {variant.salePrice && variant.price && variant.salePrice < variant.price && (
                <span className="text-[10px] sm:text-xs text-red-500 line-through">
                  {formatPrice(variant.salePrice)}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">Stock</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900">{variant.stock} units</p>
          </div>
        </div>
      </div>
      
      {/* Footer - Responsive layout */}
      <div className="px-3 sm:px-5 py-3 sm:py-4 bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <div className="text-[10px] sm:text-xs text-gray-400">
            <div>Created {new Date(variant.createdAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div className="font-mono text-[9px] sm:text-[11px] mt-0.5">ID: {variant.id.slice(-8)}</div>
          </div>
          
          {/* Edit Button - Touch friendly */}
          {onEdit && (
            <button
              onClick={handleEditClick}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg sm:rounded-lg transition-all duration-200 active:bg-blue-200"
              aria-label="Edit variant"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Details
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal - Mobile optimized */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-sm w-full shadow-2xl transform transition-all mx-3 sm:mx-0">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full mx-auto mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 text-center mb-1 sm:mb-2">
              Delete Image?
            </h3>
            <p className="text-gray-600 text-center text-xs sm:text-sm mb-4 sm:mb-6">
              Are you sure you want to delete this image? This action cannot be undone.
            </p>
            <div className="flex space-x-2 sm:space-x-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-200 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm active:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelete(showDeleteConfirm)}
                className="flex-1 bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl hover:bg-red-700 transition-colors font-medium text-sm shadow-sm active:bg-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay - Mobile optimized */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-40 rounded-xl sm:rounded-2xl">
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-3 border-blue-600 border-t-transparent mx-auto mb-2 sm:mb-3"></div>
            <p className="text-xs sm:text-sm font-medium text-gray-700">Uploading image...</p>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className=""
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
                  }
