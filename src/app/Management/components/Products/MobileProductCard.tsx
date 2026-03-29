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
  onUpdateVariant?: (productId: string, variantId: string, updates: any) => void;
  onVariantImageUpload: (variantId: string, file: File) => void;
  uploadingVariantId: string | null;
  refetch?: any;
  isUploading: boolean;
}

export default function MobileProductCard({
  product,
  onViewVariants,
  onImageUpload,
  onDeleteProduct,
  onUpdateVariant,
  onVariantImageUpload,
  uploadingVariantId,
  refetch,
  isUploading
}: MobileProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 🔥 VariantsModal states (moved inline)
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

  // 🔥 Variant logic (same as modal)
  const handleVariantImageDelete = (variantId: string, imageIndex: number) => {
    console.log(`Deleting image ${imageIndex} from variant ${variantId}`);
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImageUpload(product.id, file);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
      
      {/* HEADER */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="relative h-12 w-12 bg-gray-300 rounded-md overflow-hidden">
            {hasVariantsWithImages ? (
              <img
                src={safeVariants[0].images![0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-xs">
                No Image
              </div>
            )}

            {/* Upload overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition">
              <label className="text-white text-xs cursor-pointer">
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
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500">{product.sku}</p>
          </div>
        </div>

        <StatusBadge status={product.isActive} />
      </div>

      {/* DETAILS */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Price</span>
          <PriceDisplay price={product.price} salePrice={product.salePrice} />
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Stock</span>
          <span className="text-sm">{product.stock}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Variants</span>
          <button
            onClick={toggleExpand}
            className="flex items-center text-blue-600 text-sm"
          >
            {safeVariants.length} variants
            <svg
              className={`w-4 h-4 ml-1 transform ${
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

      {/* 🔥 INLINE VARIANTS (REPLACES MODAL) */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t pt-3">

          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-gray-500">
                {safeVariants.length} variant
                {safeVariants.length !== 1 ? 's' : ''}
                {editingVariant && ' • Editing'}
              </p>
            </div>

            <button
              onClick={toggleAddForm}
              className="text-xs bg-red-600 text-white px-3 py-1 rounded"
            >
              {showAddForm
                ? 'Cancel'
                : editingVariant
                ? 'Cancel Editing'
                : '+ Add Variant'}
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-4 border rounded-lg overflow-hidden">
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

          {/* Variant List */}
          <div className="max-h-[500px] overflow-y-auto">
            {safeVariants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {safeVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className="bg-gray-50 p-3 rounded-lg"
                  >
                    <VariantCard
                      variant={variant}
                      onImageDelete={handleVariantImageDelete}
                      onImageUpload={onVariantImageUpload}
                      isUploading={uploadingVariantId === variant.id}
                      onEdit={handleEditVariant}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                No variants available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="pt-3 border-t mt-3">
        <ActionButtons
          productId={product.id}
          onDelete={onDeleteProduct}
        />
      </div>
    </div>
  );
                }
