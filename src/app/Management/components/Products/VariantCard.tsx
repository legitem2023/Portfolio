import { useState, useRef } from 'react';
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
  onEdit?: (variant: Variant) => void; // Add this prop
}

export default function VariantCard({ 
  variant, 
  onImageUpload,
  onImageDelete,
  isUploading,
  onEdit // Add this to destructuring
}: VariantCardProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(variant.id, file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-fit">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-lg truncate">{variant.name}</h4>
          <p className="text-sm text-gray-500 mt-1">SKU: {variant.sku || 'N/A'}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {variant.stock} in stock
          </span>
          {/* Edit Button - Added here */}
          {onEdit && (
            <button
              onClick={handleEditClick}
              className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Edit variant"
              aria-label="Edit variant"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Image Swiper Section */}
      <div className="mb-4">
        <div className="relative">
          {hasImages ? (
            <div className="space-y-3">
              {/* Main Swiper with 16:9 Aspect Ratio */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
                <Swiper
                  modules={[Navigation, Pagination, Thumbs]}
                  navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                  }}
                  pagination={{
                    clickable: true,
                    type: imageCount > 1 ? 'bullets' : 'fraction',
                  }}
                  thumbs={{ swiper: thumbsSwiper }}
                  spaceBetween={0}
                  slidesPerView={1}
                  className="h-full w-full"
                >
                  {variant.images!.map((image, index) => (
                    <SwiperSlide key={index}>
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 relative">
                        <img 
                          src={image} 
                          alt={`${variant.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        
                        {/* Delete Button on Main Image */}
                        <button
                          onClick={() => handleDeleteClick(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg z-20"
                          aria-label={`Delete image ${index + 1}`}
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Custom Navigation Buttons */}
                {imageCount > 1 && (
                  <>
                    <button
                      className="swiper-button-prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all focus:outline-none focus:ring-2 focus:ring-white z-20"
                      aria-label="Previous image"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      className="swiper-button-next absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all focus:outline-none focus:ring-2 focus:ring-white z-20"
                      aria-label="Next image"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all group cursor-pointer z-10">
                  <button
                    onClick={handleAddImageClick}
                    className="bg-white text-gray-800 text-sm px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2 hover:bg-gray-50 font-medium shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Add Image</span>
                  </button>
                </div>
              </div>

              {/* Thumbnail Swiper with Delete Buttons */}
              {imageCount > 1 && (
                <div className="px-8 relative">
                  <Swiper
                    modules={[Thumbs]}
                    watchSlidesProgress
                    onSwiper={setThumbsSwiper}
                    spaceBetween={8}
                    slidesPerView={4}
                    breakpoints={{
                      320: {
                        slidesPerView: 3,
                      },
                      480: {
                        slidesPerView: 4,
                      },
                      640: {
                        slidesPerView: 5,
                      },
                    }}
                    className="thumbnail-swiper"
                  >
                    {variant.images!.map((image, index) => (
                      <SwiperSlide key={index}>
                        <div className="aspect-video bg-gray-100 rounded-md overflow-hidden border-2 border-transparent hover:border-indigo-400 transition-colors cursor-pointer relative group">
                          <img 
                            src={image} 
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          
                          {/* Delete Button on Thumbnail */}
                          <button
                            onClick={() => handleDeleteClick(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 shadow-lg z-10"
                            aria-label={`Delete image ${index + 1}`}
                          >
                            <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            /* No Images State with 16:9 Aspect Ratio */
            <div className="aspect-video flex flex-col items-center justify-center bg-gray-100 rounded-lg relative">
              <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-500 text-sm mb-4">No images available</span>
              
              <button
                onClick={handleAddImageClick}
                className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Upload Image</span>
              </button>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm !== null && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg z-50">
              <div className="bg-white rounded-lg p-6 m-4 max-w-sm w-full shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Image?
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this image? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancelDelete}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmDelete(showDeleteConfirm)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg z-40">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">Uploading...</p>
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
            disabled={isUploading}
          />
        </div>
      </div>
      
      {/* Variant Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="flex justify-between sm:block">
          <span className="text-gray-600 font-medium sm:font-normal">Color:</span>
          <span className="text-gray-900">{variant.color || 'N/A'}</span>
        </div>
        <div className="flex justify-between sm:block">
          <span className="text-gray-600 font-medium sm:font-normal">Size:</span>
          <span className="text-gray-900">{variant.size || 'N/A'}</span>
        </div>
        <div className="flex justify-between sm:block">
          <span className="text-gray-600 font-medium sm:font-normal">Price:</span>
          <div className="text-gray-900">
            ${variant.price}
            {variant.salePrice && variant.price && variant.salePrice < variant.price && (
              <span className="ml-2 text-red-500 line-through text-sm">${variant.salePrice}</span>
            )}
          </div>
        </div>
        <div className="flex justify-between sm:block">
          <span className="text-gray-600 font-medium sm:font-normal">Stock:</span>
          <span className="text-gray-900">{variant.stock} units</span>
        </div>
      </div>
      
      {/* Footer with Edit Button */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <div>Created: {new Date(variant.createdAt || '').toLocaleDateString()}</div>
            <div className="mt-1">ID: {variant.id.slice(-8)}</div>
          </div>
          
          {/* Edit Button - Secondary Location */}
          {onEdit && (
            <button
              onClick={handleEditClick}
              className="inline-flex items-center px-3 py-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors font-medium"
              aria-label="Edit variant"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
