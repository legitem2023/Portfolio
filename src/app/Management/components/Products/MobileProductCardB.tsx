// Products/MobileProductCard.tsx
import { Product } from '../../../../../types';
import ImageUploader from '../UI/ImageUploader';

interface MobileProductCardProps {
  product: Product;
  onViewVariants: (product: Product) => void;
  onImageUpload: (productId: string, file: File) => Promise<void>;
  onDeleteProduct: (productId: string) => void;
  isUploading: boolean;
  isVariantsOpen?: boolean;
}

export default function MobileProductCard({ 
  product, 
  onViewVariants, 
  onImageUpload, 
  onDeleteProduct, 
  isUploading,
  isVariantsOpen = false
}: MobileProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-12 w-12">
          {product.image ? (
            <img className="h-12 w-12 rounded object-cover" src={product.image} alt="" />
          ) : (
            <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
          {product.sku && (
            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm font-semibold text-gray-900">
              ${product.price?.toFixed(2) || '0.00'}
            </span>
            <span className="text-xs text-gray-500">Stock: {product.stock || 0}</span>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              product.status?.toLowerCase() === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {product.status || 'Active'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onViewVariants(product)}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          {isVariantsOpen ? 'Hide Variants' : 'View Variants'}
          <svg 
            className={`ml-1 h-4 w-4 transition-transform duration-200 ${isVariantsOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <ImageUploader
          onImageUpload={(file) => onImageUpload(product.id, file)}
          isUploading={isUploading}
          currentImage={product.image}
          buttonText="Upload"
          className="flex-1"
        />
        
        <button
          onClick={() => onDeleteProduct(product.id)}
          className="text-red-600 hover:text-red-800 p-2"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
