import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Product, Variant } from '../types/types';
import { CREATE_VARIANT_MUTATION } from '../../components/graphql/mutation';

interface ProductTableProps {
  products: Product[];
}

export default function ProductTable({ products }: ProductTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openVariantsModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variants
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <TableRow key={product.id} product={product} onViewVariants={openVariantsModal} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {products.map((product) => (
          <MobileProductCard key={product.id} product={product} onViewVariants={openVariantsModal} />
        ))}
      </div>

      {/* Variants Modal */}
      <VariantsModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        product={selectedProduct} 
      />
    </>
  );
}

// Table Row Component
function TableRow({ product, onViewVariants }: { product: Product; onViewVariants: (product: Product) => void }) {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gray-300 rounded-md flex items-center justify-center">
            <span className="text-gray-600 text-sm">Img</span>
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
        {product.stock} units
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <VariantButton variants={product.variants} onClick={() => onViewVariants(product)} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={product.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <ActionButtons />
      </td>
    </tr>
  );
}

// Mobile Product Card Component
function MobileProductCard({ product, onViewVariants }: { product: Product; onViewVariants: (product: Product) => void }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 h-12 w-12 bg-gray-300 rounded-md flex items-center justify-center">
            <span className="text-gray-600 text-xs">Img</span>
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
          <VariantButton variants={product.variants} onClick={() => onViewVariants(product)} />
        </div>
      </div>
      
      <div className="pt-3 border-t border-gray-200">
        <ActionButtons />
      </div>
    </div>
  );
}

// Variant Button Component
function VariantButton({ variants, onClick }: { variants?: Variant[]; onClick: () => void }) {
  const variantCount = variants?.length || 0;
  
/*  if (variantCount === 0) {
    return <span className="text-sm text-gray-400">No variants</span>;
  }*/

  return (
    <button
      onClick={onClick}
      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium underline"
    >
      Open New {variantCount} variant{variantCount !== 1 ? 's' : ''}
    </button>
  );
}

// Variants Modal Component
function VariantsModal({ isOpen, onClose, product }: { isOpen: boolean; onClose: () => void; product: Product | null }) {
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen || !product) return null;
console.log(product);
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{product.name} - Variants</h2>
            <p className="text-sm text-gray-500">{product.variants?.length || 0} variants</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Add Variant Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Variant</span>
          </button>
        </div>

        {/* Add Variant Form */}
        {showAddForm && (
          <AddVariantForm 
            productId={product.id} 
            onSuccess={() => setShowAddForm(false)}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Variants List */}
        <div className="h-full overflow-y-auto">
          {product.variants && product.variants.length > 0 ? (
            <div className="p-4 space-y-4">
              {product.variants.map((variant) => (
                <VariantCard key={variant.id} variant={variant} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2">No variants available</p>
              <p className="text-sm mt-1">Click Add New Variant to create one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Add Variant Form Component
function AddVariantForm({ productId, onSuccess, onCancel }: { 
  productId: string; 
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
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
      // Reset form
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
    refetchQueries: ['GetProducts'] // Assuming you have a query to refetch products
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
//console.log(input);
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
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Add New Variant</h3>
      
      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 text-sm rounded">
          Error: {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
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
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
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
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="SKU code"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
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
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Size"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
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
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
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
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="0"
          />
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Variant'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Variant Card Component (same as before)
function VariantCard({ variant }: { variant: Variant }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900">{variant.name}</h4>
        <span className="text-xs text-gray-500">SKU: {variant.sku}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-600">Color:</span>
          <span className="ml-1 text-gray-900">{variant.color || 'N/A'}</span>
        </div>
        <div>
          <span className="text-gray-600">Size:</span>
          <span className="ml-1 text-gray-900">{variant.size || 'N/A'}</span>
        </div>
        <div>
          <span className="text-gray-600">Price:</span>
          <span className="ml-1 text-gray-900">
            ${variant.price}
            {variant.salePrice && (
              <span className="ml-1 text-red-500 line-through">${variant.salePrice}</span>
            )}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Stock:</span>
          <span className="ml-1 text-gray-900">{variant.stock} units</span>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Created: {new Date(variant.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

// Reusable Components (same as before)
function PriceDisplay({ price, salePrice }: { price: number; salePrice?: number }) {
  return (
    <div className="text-sm text-gray-500">
      {salePrice ? (
        <div className="flex items-center space-x-2">
          <span className="text-red-600 font-semibold">${salePrice}</span>
          <span className="text-gray-400 line-through">${price}</span>
        </div>
      ) : (
        <span>${price}</span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
      status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {status}
    </span>
  );
}

function ActionButtons() {
  return (
    <div className="flex space-x-3">
      <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
        Edit
      </button>
      <button className="text-red-600 hover:text-red-900 text-sm font-medium">
        Delete
      </button>
    </div>
  );
        }
