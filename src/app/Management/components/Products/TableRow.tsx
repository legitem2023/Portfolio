import { Product } from '../../types/types';
import PriceDisplay from './PriceDisplay';
import StatusBadge from './StatusBadge';
import ActionButtons from './ActionButtons';
import VariantButton from './VariantButton';

interface TableRowProps {
  product: Product;
  onViewVariants: (product: Product) => void;
  onImageUpload: (productId: string, file: File) => void;
  onDeleteProduct: (productId: string) => void;
  isUploading: boolean;
}

export default function TableRow({ 
  product, 
  onViewVariants, 
  onImageUpload,
  onDeleteProduct,
  isUploading 
}: TableRowProps) {
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
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gray-300 rounded-md flex items-center justify-center relative overflow-hidden">
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
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{product.name}</div>
            <div className="text-sm text-gray-500">{product.sku}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <PriceDisplay price={product.price} salePrice={product.salePrice} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <VariantButton variants={safeVariants} onClick={() => onViewVariants(product)} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={product.isActive} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <ActionButtons productId={product.id} onDelete={onDeleteProduct} />
      </td>
    </tr>
  );
}
