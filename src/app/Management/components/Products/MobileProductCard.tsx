import { useState } from 'react';
import { Product } from '../../../../../types';
import PriceDisplay from './PriceDisplay';
import StatusBadge from './StatusBadge';
import ActionButtons from './ActionButtons';

interface MobileProductCardProps {
  product: Product;
  onImageUpload: (productId: string, file: File) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateVariant?: (productId: string, variantId: string, updates: any) => void;
  isUploading: boolean;
}

export default function MobileProductCard({ 
  product, 
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
    setEditingVariantId(null);
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Header Section with Gradient Accent */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600" />
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {/* Image Container */}
              <div className="relative flex-shrink-0">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                  {hasVariantsWithImages ? (
                    <img 
                      src={safeVariants[0].images![0]} 
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  
                  {/* Upload Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 flex items-center justify-center transition-all duration-200">
                    <label className="cursor-pointer text-white opacity-0 hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
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
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{product.name}</h3>
                  <StatusBadge status={product.isActive} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">{product.sku}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Details Section */}
      <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Price</p>
              <PriceDisplay price={product.price} salePrice={product.salePrice} />
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Stock</p>
              <p className="text-sm font-medium text-gray-900">{product.stock} units</p>
            </div>
          </div>
          
          {/* Variants Toggle */}
          <button
            onClick={toggleExpand}
            className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
          >
            <span className="text-sm font-medium text-gray-700">
              {safeVariants.length} {safeVariants.length === 1 ? 'Variant' : 'Variants'}
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transform transition-transform duration-200 ${
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
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="border-t border-gray-100 bg-gray-50/30">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Variant Details</h4>
              <button
                onClick={() => {/* Add new variant logic */}}
                className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Variant</span>
              </button>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {safeVariants.length > 0 ? (
                safeVariants.map((variant, index) => (
                  <div key={variant.id || index} className="bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition-colors">
                    {editingVariantId === variant.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Variant Name"
                          value={editData.name}
                          onChange={(e) => handleEditChange('name', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="SKU"
                          value={editData.sku}
                          onChange={(e) => handleEditChange('sku', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Color"
                            value={editData.color}
                            onChange={(e) => handleEditChange('color', e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            placeholder="Size"
                            value={editData.size}
                            onChange={(e) => handleEditChange('size', e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Price"
                            value={editData.price}
                            onChange={(e) => handleEditChange('price', parseFloat(e.target.value))}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="number"
                            placeholder="Sale Price"
                            value={editData.salePrice}
                            onChange={(e) => handleEditChange('salePrice', parseFloat(e.target.value))}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <input
                          type="number"
                          placeholder="Stock"
                          value={editData.stock}
                          onChange={(e) => handleEditChange('stock', parseInt(e.target.value))}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex space-x-2 pt-2">
                          <button
                            onClick={() => saveEdit(variant.id!)}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
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
                            <p className="text-sm font-semibold text-gray-900">
                              {variant.name || `Variant ${index + 1}`}
                            </p>
                            {variant.sku && (
                              <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {variant.sku}</p>
                            )}
                          </div>
                          <button
                            onClick={() => startEditing(variant.id!, variant)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Edit
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs mb-3">
                          {variant.color && (
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-500">Color:</span>
                              <span className="text-gray-700 font-medium">{variant.color}</span>
                            </div>
                          )}
                          {variant.size && (
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-500">Size:</span>
                              <span className="text-gray-700 font-medium">{variant.size}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-500">Price:</span>
                            <span className="text-gray-900 font-semibold">
                              ${variant.salePrice || variant.price}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-500">Stock:</span>
                            <span className={`font-medium ${variant.stock < 10 ? 'text-orange-600' : 'text-gray-700'}`}>
                              {variant.stock}
                            </span>
                          </div>
                        </div>
                        
                        {/* Variant Images */}
                        {variant.images && variant.images.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-2">Images</p>
                            <div className="flex space-x-2">
                              {variant.images.slice(0, 3).map((image, imgIndex) => (
                                <div key={imgIndex} className="relative group">
                                  <img
                                    src={image}
                                    alt={`Variant ${index + 1} image ${imgIndex + 1}`}
                                    className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                                  />
                                  <button
                                    onClick={() => {/* Remove image logic */}}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              {variant.images.length > 3 && (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-600 font-medium">
                                  +{variant.images.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Upload Image Button */}
                        <div className="mt-2">
                          <label className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>Upload Image</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && onUpdateVariant) {
                                  // Handle variant image upload
                                }
                              }}
                            />
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-sm text-gray-500 mb-3">No variants yet</p>
                  <button
                    onClick={() => {/* Add new variant logic */}}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create First Variant
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30">
        <ActionButtons productId={product.id} onDelete={onDeleteProduct} />
      </div>
    </div>
  );
}
