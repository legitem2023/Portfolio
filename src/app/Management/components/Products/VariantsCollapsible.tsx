// Products/VariantsCollapsible.tsx
import { Product } from '../../../../types';
import VariantList from '../Variants/VariantList';

interface VariantsCollapsibleProps {
  product: Product;
  refetch: any;
  onVariantImageUpload: (variantId: string, file: File) => Promise<void>;
  uploadingVariantId: string | null;
  onClose: () => void;
}

export default function VariantsCollapsible({ 
  product, 
  refetch, 
  onVariantImageUpload, 
  uploadingVariantId,
  onClose 
}: VariantsCollapsibleProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Variants for {product.name}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <VariantList 
        productId={product.id}
        variants={product.variants || []}
        refetch={refetch}
        onImageUpload={onVariantImageUpload}
        uploadingVariantId={uploadingVariantId}
      />
    </div>
  );
}
