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

  // Debug log for props
  console.log('🟠 MOBILE CARD - Component mounted for product:', product.name);
  console.log('🟠 MOBILE CARD - onVariantImageUpload prop:', onVariantImageUpload);
  console.log('🟠 MOBILE CARD - typeof onVariantImageUpload:', typeof onVariantImageUpload);

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

  // Wrapper function for variant image upload with logging
  const handleVariantImageUploadWithLogging = (variantId: string, file: File) => {
    console.log('🟠 MOBILE CARD - INTERCEPTOR CALLED with:', { variantId, file });
    console.log('🟠 MOBILE CARD - file name:', file.name);
    console.log('🟠 MOBILE CARD - onVariantImageUpload exists?', !!onVariantImageUpload);
    
    if (onVariantImageUpload) {
      console.log('🟠 MOBILE CARD - calling onVariantImageUpload now...');
      onVariantImageUpload(variantId, file);
      console.log('🟠 MOBILE CARD - onVariantImageUpload completed');
    } else {
      console.error('🟠 MOBILE CARD - onVariantImageUpload is UNDEFINED!');
    }
  };

  // Calculate total stock across variants
  const totalStock = safeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
  const hasSale = product.salePrice && product.salePrice < product.price;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Product Header - Simple & Clean */}
      <div className="p-4">
        <div className="flex gap-3">
          {/* Product Image */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden">
              {hasVariantsWithImages ? (
                <img
                  src={safeVariants[0].images![0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <label className="cursor-pointer p-1">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-base font-semibold text-gray-900 flex-1 line-clamp-2">
                {product.name}
              </h3>
              <StatusBadge status={product.isActive} />
            </div>
            <p className="text-xs text-gray-500 font-mono mb-2">{product.sku}</p>
            
            {/* Price & Stock Row */}
            <div className="flex items-center gap-3">
              <div>
                <span className="text-xs text-gray-500">Price</span>
                <div className="flex items-baseline gap-1">
                  {hasSale && (
                    <span className="text-xs text-gray-400 line-through">
                      ₱{product.price.toLocaleString()}
                    </span>
                  )}
                  <span className="text-sm font-bold text-gray-900">
                    ₱{(hasSale ? product.salePrice : product.price)?.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="w-px h-6 bg-gray-200" />
              <div>
                <span className="text-xs text-gray-500">Stock</span>
                <p className="text-sm font-semibold text-gray-900">{totalStock} units</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Variants Toggle - Full Width Button */}
      <button
        onClick={toggleExpand}
        className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100 active:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            Variants ({safeVariants.length})
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Variants Section */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="p-4">
            
            {/* Add Variant Button */}
            {!showAddForm && (
              <button
                onClick={toggleAddForm}
                className="w-full mb-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-indigo-600 active:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Variant
              </button>
            )}

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-white overflow-hidden">
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

            {/* Variants List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {safeVariants.length > 0 ? (
                safeVariants.map((variant) => {
                  console.log('🟠 MOBILE CARD - rendering variant:', variant.id, variant.name);
                  return (
                    <VariantCard
                      key={variant.id}
                      variant={variant}
                      onImageDelete={handleVariantImageDelete}
                      onImageUpload={handleVariantImageUploadWithLogging}
                      isUploading={uploadingVariantId === variant.id}
                      onEdit={handleEditVariant}
                    />
                  );
                })
              ) : (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-gray-500 text-sm">No variants yet</p>
                  <p className="text-gray-400 text-xs mt-1">Click &qoute;Add New Variant&qoute; to start</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        <ActionButtons
          productId={product.id}
          onDelete={onDeleteProduct}
        />
      </div>
    </div>
  );
}
