import { useState } from 'react';
import { Product } from '../../../../../types';
import PriceDisplay from './PriceDisplay';
import StatusBadge from './StatusBadge';
import ActionButtons from './ActionButtons';
import VariantCard from './VariantCard';

interface MobileProductCardProps {
  product: Product;
  onViewVariants: (product: Product) => void;
  onImageUpload: (productId: string, file: File) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateVariant?: (productId: string, variantId: string, updates: any) => void;
  onVariantImageUpload?: (variantId: string, file: File) => void;
  isUploading: boolean;
}

export default function MobileProductCard({
  product,
  onViewVariants,
  onImageUpload,
  onDeleteProduct,
  onUpdateVariant,
  onVariantImageUpload,
  isUploading
}: MobileProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

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
    setEditingVariantId(null);
  };

  const startEditing = (variantId: string, variant: any) => {
    setEditingVariantId(variantId);
    setEditData({ ...variant });
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
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImageUpload(product.id, file);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
      {/* Header */}
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
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-sm text-gray-500">{product.sku}</p>
          </div>
        </div>

        <StatusBadge status={product.isActive} />
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span>Price</span>
          <PriceDisplay
            price={product.price}
            salePrice={product.salePrice}
          />
        </div>

        <div className="flex justify-between">
          <span>Stock</span>
          <span>{product.stock}</span>
        </div>

        <div className="flex justify-between items-center">
          <span>Variants</span>
          <button
            onClick={toggleExpand}
            className="text-blue-600 text-sm flex items-center"
          >
            {safeVariants.length} variants
            <span className={`ml-1 ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        </div>
      </div>

      {/* Collapsible */}
      <div
        className={`transition-all duration-300 ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="border-t pt-3 space-y-3">
          {safeVariants.length > 0 ? (
            safeVariants.map((variant) => (
              <div
                key={variant.id}
                className="bg-gray-50 p-3 rounded-lg"
              >
                <VariantCard
                  variant={variant}
                  onImageDelete={() => {}}
                  onImageUpload={(variantId, file) =>
                    onVariantImageUpload?.(variantId, file)
                  }
                  isUploading={false}
                  onEdit={(v) => startEditing(v.id!, v)}
                />

                {/* EDIT MODE */}
                {editingVariantId === variant.id && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <input
                      value={editData.name}
                      onChange={(e) =>
                        handleEditChange('name', e.target.value)
                      }
                      className="w-full border px-2 py-1 text-sm"
                    />

                    <input
                      value={editData.sku}
                      onChange={(e) =>
                        handleEditChange('sku', e.target.value)
                      }
                      className="w-full border px-2 py-1 text-sm"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={editData.color}
                        onChange={(e) =>
                          handleEditChange('color', e.target.value)
                        }
                        className="border px-2 py-1 text-sm"
                      />
                      <input
                        value={editData.size}
                        onChange={(e) =>
                          handleEditChange('size', e.target.value)
                        }
                        className="border px-2 py-1 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={editData.price}
                        onChange={(e) =>
                          handleEditChange('price', +e.target.value)
                        }
                        className="border px-2 py-1 text-sm"
                      />
                      <input
                        type="number"
                        value={editData.salePrice}
                        onChange={(e) =>
                          handleEditChange('salePrice', +e.target.value)
                        }
                        className="border px-2 py-1 text-sm"
                      />
                    </div>

                    <input
                      type="number"
                      value={editData.stock}
                      onChange={(e) =>
                        handleEditChange('stock', +e.target.value)
                      }
                      className="w-full border px-2 py-1 text-sm"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(variant.id!)}
                        className="flex-1 bg-green-600 text-white py-1 rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex-1 bg-gray-500 text-white py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-gray-500">
              No variants
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t">
        <ActionButtons
          productId={product.id}
          onDelete={onDeleteProduct}
        />
      </div>
    </div>
  );
          }
