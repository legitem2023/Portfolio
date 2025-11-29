import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_VARIANT_MUTATION } from '../../../components/graphql/mutation';

interface AddVariantFormProps {
  productId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  sku: string;
  color: string;
  size: string;
  price: string;
  salePrice: string;
  stock: string;
}

export default function AddVariantForm({ productId, onSuccess, onCancel }: AddVariantFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    sku: '',
    color: '',
    size: '',
    price: '',
    salePrice: '',
    stock: ''
  });

  const [createVariant, { loading, error }] = useMutation(CREATE_VARIANT_MUTATION, {
    onCompleted: () => {
      onSuccess();
      setFormData({
        name: '',
        sku: '',
        color: '',
        size: '',
        price: '',
        salePrice: '',
        stock: ''
      });
    },
    refetchQueries: ['GetProducts']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const input = {
      name: formData.name,
      productId,
      sku: formData.sku || undefined,
      color: formData.color || undefined,
      size: formData.size || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
      stock: parseInt(formData.stock) || 0
    };

    createVariant({ variables: { input } });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Add New Variant</h3>
      
      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 text-sm rounded">
          Error: {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Variant name"
            />
          </div>

          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
              SKU
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="SKU code"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700">
              Color
            </label>
            <input
              type="text"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Color"
            />
          </div>

          <div>
            <label htmlFor="size" className="block text-sm font-medium text-gray-700">
              Size
            </label>
            <input
              type="text"
              id="size"
              name="size"
              value={formData.size}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Size"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700">
              Sale Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              id="salePrice"
              name="salePrice"
              value={formData.salePrice}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
            Stock *
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            required
            value={formData.stock}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="0"
          />
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors font-medium"
          >
            {loading ? 'Creating...' : 'Create Variant'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
