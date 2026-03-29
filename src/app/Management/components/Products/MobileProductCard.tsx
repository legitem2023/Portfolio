import { useState } from 'react';
import { Product, Variant } from '../../../../../types';
import PriceDisplay from './PriceDisplay';
import StatusBadge from './StatusBadge';
import ActionButtons from './ActionButtons';
import VariantCard from './VariantCard';
import AddVariantForm from './AddVariantForm';

interface MobileProductCardProps {
  product: Product;
  onViewVariants: (product: Product) => void;
  onImageUpload: (productId: string, file: File) => void;
  onDeleteProduct: (productId: string) => void;
  onVariantImageUpload?: (variantId: string, file: File) => void;
  uploadingVariantId?: string | null;
  refetch?: any;
  isUploading: boolean;
}

export default function MobileProductCard({
  product,
  onViewVariants,
  onImageUpload,
  onDeleteProduct,
  onVariantImageUpload,
  uploadingVariantId,
  refetch,
  isUploading
}: MobileProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);

  const safeVariants = (product.variants || []).map((variant) => ({
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

  const hasVariantsWithImages =
    safeVariants.length > 0 &&
    safeVariants[0].images &&
    safeVariants[0].images.length > 0;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleVariantImageDelete = (variantId: string, imageIndex: number) => {
    console.log(`Delete image ${imageIndex} from ${variantId}`);
  };

  const handleEditVariant = (variant: Variant) => {
    setEditingVariant(variant);
    setShowAddForm(true);
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingVariant(null);
    refetch?.();
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setEditingVariant(null);
  };

  const toggleAddForm = () => {
    if (showAddForm) setEditingVariant(null);
    setShowAddForm(!showAddForm);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageUpload(product.id, file);
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Header Section with Gradient Accent */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        {/* Header Content */}
        <div className="p-3 sm:p-4 md:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              {/* Product Image */}
              <div className="relative flex-shrink-0">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden shadow-sm">
                  {hasVariantsWithImages ? (
                    <img
                      src={safeVariants[0].images![0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Upload Overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                    <label className="cursor-pointer text-white p-1">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                    {product.name}
                  </h3>
                  <StatusBadge status={product.isActive} />
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 font-mono truncate">{product.sku}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 bg-gray-50/50 border-y border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center justify-between sm:justify-start space-x-4 sm:space-x-6">
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-0.5">Price</p>
              <PriceDisplay price={product.price} salePrice={product.salePrice} />
            </div>
            <div className="w-px h-6 bg-gray-200 hidden sm:block" />
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-0.5">Stock</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900">{product.stock} units</p>
            </div>
          </div>

          {/* Variants Toggle Button */}
          <button
            onClick={toggleExpand}
            className="flex items-center justify-between sm:justify-start space-x-2 px-3 py-1.5 sm:px-3 sm:py-1.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 active:bg-gray-50"
          >
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              {safeVariants.length} {safeVariants.length === 1 ? 'Variant' : 'Variants'}
            </span>
            <svg
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 transform transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible Variants Section */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="border-t border-gray-100">
          <div className="p-3 sm:p-4 md:p-5">
            {/* Header with Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
              <p className="text-[11px] sm:text-xs text-gray-500">
                {safeVariants.length} variant{safeVariants.length !== 1 ? 's' : ''}
                {editingVariant && ' • Editing'}
              </p>

              <button
                onClick={toggleAddForm}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-1.5 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors active:bg-blue-800 shadow-sm"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {showAddForm
                  ? 'Cancel'
                  : editingVariant
                  ? 'Cancel Editing'
                  : 'Add Variant'}
              </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="mb-4 sm:mb-5 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <AddVariantForm
                  productId={product.id}
                  refetch={refetch}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                  editingVariant={editingVariant}
                  setEditingVariant={setEditingVariant}
                />
              </div>
            )}

            {/* Variants Grid */}
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              {safeVariants.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {safeVariants.map((variant) => (
                    <VariantCard
                      key={variant.id}
                      variant={variant}
                      onImageDelete={handleVariantImageDelete}
                      onImageUpload={(variantId, file) =>
                        onVariantImageUpload?.(variantId, file)
                      }
                      isUploading={uploadingVariantId === variant.id}
                      onEdit={handleEditVariant}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">No variants available</p>
                  <button
                    onClick={toggleAddForm}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create First Variant
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-4 border-t border-gray-100 bg-gray-50/30">
        <ActionButtons
          productId={product.id}
          onDelete={onDeleteProduct}
        />
      </div>
    </div>
  );
}

// Add custom scrollbar styles (add to your global CSS)
const styles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  @media (max-width: 640px) {
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
  }
`;
