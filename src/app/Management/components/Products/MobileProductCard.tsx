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

  // Calculate total stock across variants
  const totalStock = safeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
  const hasSale = product.salePrice && product.salePrice < product.price;

  return (
    <div className="bg-white shadow-lg rounded-2xl overflow-hidden border-0 transition-all duration-300 hover:shadow-xl">
      
      {/* Minimalist Header - Clean and Modern */}
      <div className="relative">
        {/* Subtle Brand Accent */}
        <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full" />
        
        <div className="pt-5 px-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            {/* Product Image with Modern Frame */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden shadow-md ring-1 ring-gray-100">
                {hasVariantsWithImages ? (
                  <img
                    src={safeVariants[0].images![0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] text-gray-400 mt-1">No img</span>
                  </div>
                )}

                {/* Upload Overlay - Minimal */}
                <div className="absolute inset-0 bg-indigo-900/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200 backdrop-blur-sm">
                  <label className="cursor-pointer text-white">
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
                  <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/90 backdrop-blur-sm">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Product Title & SKU */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-800 leading-tight mb-0.5 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono tracking-tight">{product.sku}</p>
                </div>
                <StatusBadge status={product.isActive} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Bar - Clean Card Style */}
      <div className="mx-5 mb-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
        <div className="flex items-center justify-between">
          {/* Price Section */}
          <div className="flex-1">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Price</p>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-base font-bold text-gray-800 ${hasSale ? 'line-through text-gray-400 text-sm' : ''}`}>
                ₱{product.price.toLocaleString()}
              </span>
              {hasSale && (
                <span className="text-base font-bold text-indigo-600">
                  ₱{product.salePrice?.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* Stock Section */}
          <div className="flex-1 text-right">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Total Stock</p>
            <p className={`text-base font-bold ${totalStock === 0 ? 'text-red-500' : 'text-gray-800'}`}>
              {totalStock} units
            </p>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* Variants Section */}
          <div className="flex-1 text-right">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Variants</p>
            <button
              onClick={toggleExpand}
              className="flex items-center justify-end gap-1 w-full group"
            >
              <span className="text-base font-bold text-indigo-600">
                {safeVariants.length}
              </span>
              <svg
                className={`w-4 h-4 text-indigo-500 transition-transform duration-200 group-hover:translate-y-0.5 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Variants Section */}
      <div
        className={`transition-all duration-400 ease-out ${
          isExpanded ? 'max-h-[2500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="border-t border-gray-100 bg-gray-50/40">
          <div className="p-5">
            
            {/* Section Header with Action */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product Variations
                </h4>
                {editingVariant && (
                  <p className="text-[11px] text-indigo-600 mt-0.5">Editing: {editingVariant.name}</p>
                )}
              </div>
              
              <button
                onClick={toggleAddForm}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  showAddForm
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                {showAddForm ? 'Cancel' : editingVariant ? 'Cancel' : 'Add Variant'}
              </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="mb-5 rounded-xl border border-indigo-200 bg-white overflow-hidden shadow-sm">
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
            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {safeVariants.length > 0 ? (
                safeVariants.map((variant) => (
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
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">No variants created yet</p>
                  <button
                    onClick={toggleAddForm}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your First Variant
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Minimal Footer */}
      <div className="px-5 py-3.5 bg-white border-t border-gray-100">
        <ActionButtons
          productId={product.id}
          onDelete={onDeleteProduct}
        />
      </div>
    </div>
  );
              }
