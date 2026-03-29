// Products/VariantList.tsx
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Variant } from '../../../../types';
import { DELETE_VARIANT } from '../../components/graphql/mutation';
import ImageUploader from '../UI/ImageUploader';

interface VariantListProps {
  productId: string;
  variants: Variant[];
  refetch: any;
  onImageUpload: (variantId: string, file: File) => Promise<void>;
  uploadingVariantId: string | null;
}

export default function VariantList({ 
  productId, 
  variants, 
  refetch, 
  onImageUpload, 
  uploadingVariantId 
}: VariantListProps) {
  const [deleteVariant] = useMutation(DELETE_VARIANT, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Error deleting variant:', error);
      alert(`Error deleting variant: ${error.message}`);
    },
  });

  const handleDeleteVariant = (variantId: string) => {
    if (window.confirm('Are you sure you want to delete this variant? This action cannot be undone.')) {
      deleteVariant({ variables: { id: variantId } });
    }
  };

  if (!variants || variants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No variants found for this product.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {variants.map((variant) => (
        <div key={variant.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-md font-medium text-gray-900">{variant.name}</h4>
                {variant.sku && (
                  <span className="text-xs text-gray-500">SKU: {variant.sku}</span>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Price:</span>
                  <span className="ml-2 font-medium text-gray-900">${variant.price?.toFixed(2) || '0.00'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Stock:</span>
                  <span className="ml-2 font-medium text-gray-900">{variant.stock || 0}</span>
                </div>
                {variant.weight && (
                  <div>
                    <span className="text-gray-500">Weight:</span>
                    <span className="ml-2 text-gray-900">{variant.weight}g</span>
                  </div>
                )}
              </div>
              
              {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(variant.attributes).map(([key, value]) => (
                    <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <ImageUploader
                onImageUpload={(file) => onImageUpload(variant.id, file)}
                isUploading={uploadingVariantId === variant.id}
                currentImage={variant.image}
                buttonText="Upload Image"
                className="flex-shrink-0"
              />
              <button
                onClick={() => handleDeleteVariant(variant.id)}
                className="text-red-600 hover:text-red-800 transition-colors p-1"
                title="Delete variant"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
