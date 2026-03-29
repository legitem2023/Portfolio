import { useState } from 'react';
import { Product } from '../../../../../types';
import PriceDisplay from './PriceDisplay';
import StatusBadge from './StatusBadge';
import ActionButtons from './ActionButtons';
import VariantButton from './VariantButton';

interface MobileProductCardProps {
  product: Product;
  onViewVariants: (product: Product) => void;
  onImageUpload: (productId: string, file: File) => void;
  onDeleteProduct: (productId: string) => void;
  isUploading: boolean;
}

export default function MobileProductCard({ 
  product, 
  onViewVariants, 
  onImageUpload,
  onDeleteProduct,
  isUploading 
}: MobileProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(product.id, file);
    }
  };

  const safeVariants = (product.variants || []).map(variant => ({
    ...variant,
    name: variant.name || '',
    sku: variant.sku || '',
    color: variant.color || '',
    size: variant.size || '',
    price: variant.price || 0,
    salePrice: variant.salePrice || 0,
    stock: variant.stock || 0,
    images: variant.images || [],
    createdAt: variant.createdAt || new Date().toISOString()
  }));

  const hasVariantsWithImages = safeVariants.length > 0 && 
                               safeVariants[0].images && 
                               safeVariants[0].images.length > 0;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 h-12 w-12 bg-gray-300 rounded-md flex items-center justify-center relative overflow-hidden">
            {hasVariantsWithImages ? (
              <div className="h-full w-full">
                <img 
                  src={safeVariants[0].images![0]} 
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <span className="text-gray-600 text-sm">No Image</span>
            )}
            
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <label className="cursor-pointer text-white text-xs text-center p-1">
                <svg className="w-3 h-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-500">{product.sku}</p>
          </div>
        </div>
        <StatusBadge status={product.isActive} />
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Price</span>
          <PriceDisplay price={product.price} salePrice={product.salePrice} />
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Variants</span>
          <button
            onClick={toggleExpand}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span className="text-sm font-medium">
              {safeVariants.length} {safeVariants.length === 1 ? 'variant' : 'variants'}
            </span>
            <svg
              className={`w-4 h-4 transform transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible Variants Section */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[500px] opacity-100 mb-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Variant Details</h4>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {safeVariants.length > 0 ? (
              safeVariants.map((variant, index) => (
                <div key={variant.id || index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {variant.name || `Variant ${index + 1}`}
                      </p>
                      {variant.sku && (
                        <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onViewVariants(product)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {variant.color && (
                      <div>
                        <span className="text-gray-500">Color:</span>{' '}
                        <span className="text-gray-700">{variant.color}</span>
                      </div>
                    )}
                    {variant.size && (
                      <div>
                        <span className="text-gray-500">Size:</span>{' '}
                        <span className="text-gray-700">{variant.size}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Price:</span>{' '}
                      <span className="text-gray-700">
                        ${variant.salePrice || variant.price}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Stock:</span>{' '}
                      <span className="text-gray-700">{variant.stock}</span>
                    </div>
                  </div>
                  {variant.images && variant.images.length > 0 && (
                    <div className="mt-2 flex space-x-1">
                      {variant.images.slice(0, 3).map((image, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={image}
                          alt={`Variant ${index + 1} image ${imgIndex + 1}`}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ))}
                      {variant.images.length > 3 && (
                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                          +{variant.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No variants available
              </p>
            )}
          </div>
          
          {/* Quick action button to manage all variants */}
          <button
            onClick={() => onViewVariants(product)}
            className="mt-3 w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2 border-t border-gray-200"
          >
            Manage All Variants
          </button>
        </div>
      </div>
      
      <div className="pt-3 border-t border-gray-200">
        <ActionButtons productId={product.id} onDelete={onDeleteProduct} />
      </div>
    </div>
  );
}
