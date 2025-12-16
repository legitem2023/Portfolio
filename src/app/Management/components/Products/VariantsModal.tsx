import { useState } from 'react';
import { Product, Variant } from '../../../../../types';
import VariantCard from './VariantCard';
import AddVariantForm from './AddVariantForm';

interface VariantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onVariantImageUpload: (variantId: string, file: File) => void;
  uploadingVariantId: string | null;
}

export default function VariantsModal({ 
  isOpen, 
  onClose, 
  product, 
  onVariantImageUpload,
  uploadingVariantId 
}: VariantsModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen || !product) return null;

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

  const handleVariantImageDelete = async (variantId: string, imageIndex: number) => {
    console.log(`Deleting image ${imageIndex} from variant ${variantId}`);
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="relative w-full max-w-4xl max-h-[90vh] sm:max-h-[80vh] bg-white shadow-xl rounded-t-2xl sm:rounded-2xl transform transition-all duration-300 ease-out">
          
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 truncate">{product.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {safeVariants.length} variant{safeVariants.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 ml-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{showAddForm ? 'Cancel Adding Variant' : 'Add New Variant'}</span>
            </button>
          </div>

          {showAddForm && (
            <div className="border-b border-gray-200">
              <AddVariantForm 
                productId={product.id} 
                onSuccess={() => setShowAddForm(false)}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          <div className="overflow-y-auto max-h-[calc(90vh-200px)] sm:max-h-[calc(80vh-200px)]">
            {safeVariants.length > 0 ? (
              <div className="p-4 sm:p-6">
                <div className="
                  grid grid-cols-1 gap-4 sm:gap-6
                  sm:grid-cols-2 lg:grid-cols-3
                ">
                  {safeVariants.map((variant) => (
                    <div key={variant.id} className="
                      w-full
                      sm:bg-gray-50 sm:p-4 sm:rounded-lg
                    ">
                      <VariantCard 
                        variant={variant} 
                        onImageDelete={handleVariantImageDelete}
                        onImageUpload={onVariantImageUpload}
                        isUploading={uploadingVariantId === variant.id}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyVariantsState />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyVariantsState() {
  return (
    <div className="p-8 text-center text-gray-500">
      <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="mt-4 text-lg font-medium text-gray-900">No variants available</p>
      <p className="mt-2 text-sm">Click Add New Variant to create your first variant</p>
    </div>
  );
}
