import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Product, Variant } from '../types/types';
import { CREATE_VARIANT_MUTATION } from '../../components/graphql/mutation';
import { SINGLE_UPLOAD_MUTATION } from '../../components/graphql/mutation';

interface ProductTableProps {
  products: Product[];
}

export default function ProductTable({ products }: ProductTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [singleUpload] = useMutation(SINGLE_UPLOAD_MUTATION, {
    onCompleted: (e: any) => {
      console.log(e);
    }
  });

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
              <TableRow 
                key={product.id} 
                product={product} 
                onViewVariants={openVariantsModal} 
              />
            ))}
          </tbody>
        </table>
      </div>
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
    </div>
  );
}

// Variant Button Component
function VariantButton({ variants, onClick }: { variants?: Variant[]; onClick: () => void }) {
  const variantCount = variants?.length || 0;

  /*  
  if (variantCount === 0) {
    return <span className="text-sm text-gray-400">No variants</span>;
  }
  */

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
    //console.log(input);
    createVariant({ variables: { input } });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Add New Variant</h3>
    </div>
  );
}

// Variant Card Component
function VariantCard({ variant }: { variant: Variant }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900">{variant.name}</h4>
        <span className="text-xs text-gray-500">SKU: {variant.sku}</span>
      </div>
    </div>
  );
}

// Reusable Components
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
