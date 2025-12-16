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
        <StatusBadge status={product.status} />
      </div>
      
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
          <VariantButton variants={safeVariants} onClick={() => onViewVariants(product)} />
        </div>
      </div>
      
      <div className="pt-3 border-t border-gray-200">
        <ActionButtons productId={product.id} onDelete={onDeleteProduct} />
      </div>
    </div>
  );
}
