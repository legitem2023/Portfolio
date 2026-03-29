// Products/TableRow.tsx
import { Product } from '../../../../types';
import ImageUploader from '../UI/ImageUploader';

interface TableRowProps {
  product: Product;
  onViewVariants: (product: Product) => void;
  onImageUpload: (productId: string, file: File) => Promise<void>;
  onDeleteProduct: (productId: string) => void;
  isUploading: boolean;
  isVariantsOpen?: boolean; // Add this optional prop
}

export default function TableRow({ 
  product, 
  onViewVariants, 
  onImageUpload, 
  onDeleteProduct, 
  isUploading,
  isVariantsOpen = false // Default to false
}: TableRowProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {product.image ? (
              <img className="h-10 w-10 rounded-full object-cover" src={product.image} alt="" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{product.name}</div>
            {product.sku && (
              <div className="text-sm text-gray-500">SKU: {product.sku}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">${product.price?.toFixed(2) || '0.00'}</div>
      </td>
      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{product.stock || 0}</div>
      </td>
      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onViewVariants(product)}
          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
      </td>
      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          product.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {product.status || 'active'}
        </span>
      </td>
      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center gap-2">
          <ImageUploader
            onImageUpload={(file) => onImageUpload(product.id, file)}
            isUploading={isUploading}
            currentImage={product.image}
            buttonText="Upload"
          />
          <button
            onClick={() => onDeleteProduct(product.id)}
            className="text-red-600 hover:text-red-900"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
