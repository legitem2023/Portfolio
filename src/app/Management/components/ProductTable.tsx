import { useState, useMemo } from 'react';
import { useMutation } from '@apollo/client';
import { Product } from '../types/types';
import { DELETE_PRODUCT } from '../../components/graphql/mutation';
import { SINGLE_UPLOAD_MUTATION } from '../../components/graphql/mutation';
import SearchSortBar from './UI/SearchSortBar';
import { SortOption } from './UI/SortDropdown';
import TableRow from './Products/TableRow';
import MobileProductCard from './Products/MobileProductCard';
import VariantsModal from './Products/VariantsModal';

interface ProductTableProps {
  products: Product[];
  onProductDeleted?: () => void;
}

const sortOptions: SortOption[] = [
  { value: 'name-asc', label: 'Name (A-Z)', direction: 'asc' },
  { value: 'name-desc', label: 'Name (Z-A)', direction: 'desc' },
  { value: 'price-asc', label: 'Price (Low to High)', direction: 'asc' },
  { value: 'price-desc', label: 'Price (High to Low)', direction: 'desc' },
  { value: 'stock-asc', label: 'Stock (Low to High)', direction: 'asc' },
  { value: 'stock-desc', label: 'Stock (High to Low)', direction: 'desc' },
  { value: 'createdAt-desc', label: 'Newest First', direction: 'desc' },
  { value: 'createdAt-asc', label: 'Oldest First', direction: 'asc' },
];

export default function ProductTable({ products, onProductDeleted }: ProductTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(sortOptions[0]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;
    
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered.sort((a: any, b: any) => {
      switch (sortOption.value) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        case 'stock-asc':
          return (a.stock || 0) - (b.stock || 0);
        case 'stock-desc':
          return (b.stock || 0) - (a.stock || 0);
        case 'createdAt-asc':
          return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
        case 'createdAt-desc':
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        default:
          return 0;
      }
    });
  }, [products, searchQuery, sortOption]);

  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    onCompleted: () => {
      if (onProductDeleted) onProductDeleted();
    },
    onError: (error) => {
      console.error('Error deleting product:', error);
      alert(`Error deleting product: ${error.message}`);
    },
    update: (cache, { data: { deleteProduct } }) => {
      if (deleteProduct && deleteProduct.id) {
        cache.evict({ id: cache.identify(deleteProduct) });
        cache.gc();
      }
    },
  });

  const [singleUpload] = useMutation(SINGLE_UPLOAD_MUTATION, {
    onCompleted: () => {
      setUploadingProductId(null);
      setUploadingVariantId(null);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      setUploadingProductId(null);
      setUploadingVariantId(null);
    }
  });

  const handleDelete = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteProduct({ variables: { id: productId } });
    }
  };

  const handleProductImageUpload = async (productId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    setUploadingProductId(productId);
    
    try {
      const base64 = await convertToBase64(file);
      if (!base64 || base64.trim() === '') {
        throw new Error('Generated base64 string is empty');
      }
      
      await singleUpload({
        variables: {
          base64Image: base64,
          productId: productId
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleVariantImageUpload = async (variantId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    setUploadingVariantId(variantId);
    
    try {
      const base64 = await convertToBase64(file);
      if (!base64 || base64.trim() === '') {
        throw new Error('Generated base64 string is empty');
      }
     
      await singleUpload({
        variables: {
          base64Image: base64,
          productId: variantId
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
      <div className="mb-6">
        <SearchSortBar
          searchPlaceholder="Search products by name, SKU, or description..."
          sortOptions={sortOptions}
          onSearch={setSearchQuery}
          onSortChange={setSortOption}
        />
        
        <div className="mt-2 text-sm text-gray-500">
          Showing {filteredAndSortedProducts.length} of {products.length} products
          {searchQuery && (
            <span> for <span className="font-medium">{searchQuery}</span></span>
          )}
        </div>
      </div>

      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium bg-gray-800 text-gray-300 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium bg-gray-800 text-gray-300 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium bg-gray-800 text-gray-300 uppercase tracking-wider">
                Stock
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium bg-gray-800 text-gray-300 uppercase tracking-wider">
                Variants
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium bg-gray-800 text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium bg-gray-800 text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedProducts.map((product) => (
              <TableRow 
                key={product.id} 
                product={product} 
                onViewVariants={openVariantsModal}
                onImageUpload={handleProductImageUpload}
                onDeleteProduct={handleDelete}
                isUploading={uploadingProductId === product.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {filteredAndSortedProducts.map((product) => (
          <MobileProductCard 
            key={product.id} 
            product={product} 
            onViewVariants={openVariantsModal}
            onImageUpload={handleProductImageUpload}
            onDeleteProduct={handleDelete}
            isUploading={uploadingProductId === product.id}
          />
        ))}
      </div>

      {filteredAndSortedProducts.length === 0 && (
        <EmptyState searchQuery={searchQuery} />
      )}

      <VariantsModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        product={selectedProduct}
        onVariantImageUpload={handleVariantImageUpload}
        uploadingVariantId={uploadingVariantId}
      />
    </>
  );
}

// Helper function
const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
};
