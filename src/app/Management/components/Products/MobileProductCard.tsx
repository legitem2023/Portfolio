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
  onUpdateVariant?: (productId: string, variantId: string, updates: any) => void;
  isUploading: boolean;
}

export default function MobileProductCard({ 
  product, 
  onViewVariants,
  onImageUpload,
  onDeleteProduct,
  onUpdateVariant,
  isUploading 
}: MobileProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

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
    setEditingVariantId(null); // Reset editing when collapsing
  };

  const startEditing = (variantId: string, variant: any) => {
    setEditingVariantId(variantId);
    setEditData({
      name: variant.name,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      price: variant.price,
      salePrice: variant.salePrice,
      stock: variant.stock
    });
  };

  const cancelEditing = () => {
    setEditingVariantId(null);
    setEditData({});
  };

  const saveEdit = (variantId: string) => {
    if (onUpdateVariant) {
      onUpdateVariant(product.id, variantId, editData);
    }
    setEditingVariantId(null);
    setEditData({});
  };

  const handleEditChange = (field: string, value: any) => {
    setEditData({ ...editData, [field]: value });
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
      {/* Header Section */}
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
      
      {/* Product Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Price</span>
          <PriceDisplay price={product.price} salePrice={product.salePrice} />
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Stock</span>
          <span className="text-sm text-gray-900">{product.stock} units</span>
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
          isExpanded ? 'max-h-[2000px] opacity-100 mb-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-700">Variant Details</h4>
            <button
              onClick={() => {/* Add new variant logic */}}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              + Add Variant
            </button>
          </div>
          
          {/*<div className="space-y-3 max-h-[600px] overflow-y-auto">
            {safeVariants.length > 0 ? (
              safeVariants.map((variant, index) => (
                <div key={variant.id || index} className="bg-gray-50 rounded-lg p-3">
                  {editingVariantId === variant.id ? (
                    // Edit Mode
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Variant Name"
                        value={editData.name}
                        onChange={(e) => handleEditChange('name', e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                      <input
                        type="text"
                        placeholder="SKU"
                        value={editData.sku}
                        onChange={(e) => handleEditChange('sku', e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Color"
                          value={editData.color}
                          onChange={(e) => handleEditChange('color', e.target.value)}
                          className="px-2 py-1 text-sm border rounded"
                        />
                        <input
                          type="text"
                          placeholder="Size"
                          value={editData.size}
                          onChange={(e) => handleEditChange('size', e.target.value)}
                          className="px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Price"
                          value={editData.price}
                          onChange={(e) => handleEditChange('price', parseFloat(e.target.value))}
                          className="px-2 py-1 text-sm border rounded"
                        />
                        <input
                          type="number"
                          placeholder="Sale Price"
                          value={editData.salePrice}
                          onChange={(e) => handleEditChange('salePrice', parseFloat(e.target.value))}
                          className="px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <input
                        type="number"
                        placeholder="Stock"
                        value={editData.stock}
                        onChange={(e) => handleEditChange('stock', parseInt(e.target.value))}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveEdit(variant.id!)}
                          className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex-1 bg-gray-500 text-white px-2 py-1 rounded text-sm hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {variant.name || `Variant ${index + 1}`}
                          </p>
                          {variant.sku && (
                            <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
                          )}
                        </div>
                        <button
                          onClick={() => startEditing(variant.id!, variant)}
                          className="text-xs text-blue-600 hover:text-blue-800 ml-2"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
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
                      
                      
                      <div className="mt-2">
                        <label className="text-xs text-gray-500 block mb-1">Variant Images</label>
                        <div className="flex items-center space-x-2">
                          {variant.images && variant.images.length > 0 ? (
                            <div className="flex space-x-1 flex-wrap gap-1">
                              {variant.images.slice(0, 4).map((image, imgIndex) => (
                                <div key={imgIndex} className="relative">
                                  <img
                                    src={image}
                                    alt={`Variant ${index + 1} image ${imgIndex + 1}`}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                  <button
                                    onClick={() => {}}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              {variant.images.length > 4 && (
                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                                  +{variant.images.length - 4}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex-1">
                              <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 rounded px-3 py-1 text-xs inline-flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Upload Image
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && onUpdateVariant) {
                                      // Handle variant image upload
                                      console.log('Upload image for variant:', variant.id, file);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-2">No variants available</p>
                <button
                  onClick={() => {}}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Create First Variant
                </button>
              </div>
            )}
          </div>*/}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="pt-3 border-t border-gray-200">
        <ActionButtons productId={product.id} onDelete={onDeleteProduct} />
      </div>
    </div>
  );
                            }
