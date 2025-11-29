import { useState, useRef } from 'react';
import { Variant } from '../../types/types';

interface VariantCardProps {
  variant: Variant;
  onImageUpload: (variantId: string, file: File) => void;
  isUploading: boolean;
}

export default function VariantCard({ 
  variant, 
  onImageUpload,
  isUploading 
}: VariantCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  const nextImage = () => {
    if (variant.images && variant.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === variant.images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (variant.images && variant.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? variant.images!.length - 1 : prev - 1
      );
    }
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const hasImages = variant.images && variant.images.length > 0;
  const imageCount = variant.images?.length || 0;

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-lg truncate">{variant.name}</h4>
          <p className="text-sm text-gray-500 mt-1">SKU: {variant.sku || 'N/A'}</p>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {variant.stock} in stock
          </span>
        </div>
      </div>
      
      {/* Image Slider Section */}
      <div className="mb-4">
        <div className="relative h-40 sm:h-48 bg-gray-100 rounded-lg overflow-hidden">
          {hasImages ? (
            <>
              {/* Main Image Display */}
              <img 
                src={variant.images![currentImageIndex]} 
                alt={`${variant.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Navigation Arrows - Only show if multiple images */}
              {imageCount > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Previous image"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Next image"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md">
                {currentImageIndex + 1} / {imageCount}
              </div>

              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all group">
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
            </>
          ) : (
            /* No Images State */
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 relative">
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

          {/* Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
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

        {/* Image Thumbnails/Dots */}
        {hasImages && imageCount > 1 && (
          <div className="flex justify-center space-x-2 mt-3">
            {variant.images!.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex 
                    ? 'bg-indigo-600 w-4' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
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
      
      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Created: {new Date(variant.createdAt || '').toLocaleDateString()}</span>
          <span>ID: {variant.id.slice(-8)}</span>
        </div>
      </div>
    </div>
  );
}
