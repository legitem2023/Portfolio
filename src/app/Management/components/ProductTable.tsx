import { useState, useRef } from 'react';
import { useMutation } from '@apollo/client';
import { Product, Variant } from '../types/types';
import { CREATE_VARIANT_MUTATION } from '../../components/graphql/mutation';
import { SINGLE_UPLOAD_MUTATION } from '../../components/graphql/mutation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ProductTableProps {
  products: Product[];
}

// Corrected helper function to convert file to base64
const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      // Return the FULL data URL including the prefix
      // The backend expects: "data:image/png;base64,iVBORw0KGgo..."
      resolve(result);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    // Read as data URL to get base64
    reader.readAsDataURL(file);
  });
};;

export default function ProductTable({ products }: ProductTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null);
  
  const [singleUpload] = useMutation(SINGLE_UPLOAD_MUTATION, {
    onCompleted: (data) => {
      console.log('Upload completed:', data);
      setUploadingProductId(null);
      setUploadingVariantId(null);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      setUploadingProductId(null);
      setUploadingVariantId(null);
    }
  });

  const handleProductImageUpload = async (productId: string, file: File) => {
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }
    
    setUploadingProductId(productId);
    
    try {
      const base64 = await convertToBase64(file);
      
      // Additional validation
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
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }
    
    setUploadingVariantId(variantId);
    
    try {
      const base64 = await convertToBase64(file);
      
      // Additional validation
      if (!base64 || base64.trim() === '') {
        throw new Error('Generated base64 string is empty');
      }
     console.log(base64);
     console.log(variantId);
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
                onImageUpload={handleProductImageUpload}
                isUploading={uploadingProductId === product.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {products.map((product) => (
          <MobileProductCard 
            key={product.id} 
            product={product} 
            onViewVariants={openVariantsModal}
            onImageUpload={handleProductImageUpload}
            isUploading={uploadingProductId === product.id}
          />
        ))}
      </div>

      {/* Variants Modal */}
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

// Table Row Component
function TableRow({ 
  product, 
  onViewVariants, 
  onImageUpload,
  isUploading 
}: { 
  product: Product; 
  onViewVariants: (product: Product) => void;
  onImageUpload: (productId: string, file: File) => void;
  isUploading: boolean;
}) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(product.id, file);
    }
  };

  // Safe variants with defaults
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

  // Check if product has variants with images
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
            
            {/* Upload Overlay */}
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
        {product.stock} units
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <VariantButton variants={safeVariants} onClick={() => onViewVariants(product)} />
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
function MobileProductCard({ 
  product, 
  onViewVariants, 
  onImageUpload,
  isUploading 
}: { 
  product: Product; 
  onViewVariants: (product: Product) => void;
  onImageUpload: (productId: string, file: File) => void;
  isUploading: boolean;
}) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(product.id, file);
    }
  };

  // Safe variants with defaults
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

  // Check if product has variants with images
  const hasVariantsWithImages = safeVariants.length > 0 && 
                               safeVariants[0].images && 
                               safeVariants[0].images.length > 0;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 h-12 w-12 bg-gray-300 rounded-md flex items-center justify-center relative overflow-hidden">
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
            
            {/* Upload Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <label className="cursor-pointer text-white text-xs text-center p-1">
                <svg className="w-3 h-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            )}
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
          <VariantButton variants={safeVariants} onClick={() => onViewVariants(product)} />
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
  
  return (
    <button
      onClick={onClick}
      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium underline"
    >
      View {variantCount} variant{variantCount !== 1 ? 's' : ''}
    </button>
  );
}

// Variants Modal Component
function VariantsModal({ 
  isOpen, 
  onClose, 
  product, 
  onVariantImageUpload,
  uploadingVariantId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  product: Product | null;
  onVariantImageUpload: (variantId: string, file: File) => void;
  uploadingVariantId: string | null;
}) {
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen || !product) return null;

  // Safe variants with defaults
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
            <p className="text-sm text-gray-500">{safeVariants.length} variants</p>
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
          {safeVariants.length > 0 ? (
            <div className="p-4 space-y-4">
              {safeVariants.map((variant) => (
                <VariantCard 
                  key={variant.id} 
                  variant={variant} 
                  onImageUpload={onVariantImageUpload}
                  isUploading={uploadingVariantId === variant.id}
                />
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

// Variant Card Component with Image Slider
function VariantCard({ 
  variant, 
  onImageUpload,
  isUploading 
}: { 
  variant: Variant;
  onImageUpload: (variantId: string, file: File) => void;
  isUploading: boolean;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(variant.id, file);
    }
  };

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const nextImage = () => {
    if (variant.images && variant.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === variant.images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (variant.images && variant.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? variant.images!.length - 1 : prev - 1
      );
    }
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const hasImages = variant.images && variant.images.length > 0;
  const imageCount = variant.images?.length || 0;

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-gray-900">{variant.name}</h4>
        <span className="text-xs text-gray-500">SKU: {variant.sku}</span>
      </div>
      
      {/* Image Slider Section */}
      <div className="mb-3">
        <div className="relative h-32 bg-gray-200 rounded-md overflow-hidden">
          {hasImages ? (
            <>
              {/* Main Image Display */}
              <img 
                src={variant.images![currentImageIndex]} 
                alt={`${variant.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Navigation Arrows */}
              {imageCount > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {currentImageIndex + 1} / {imageCount}
              </div>

              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all group">
                <button
                  onClick={handleAddImageClick}
                  className="bg-white bg-opacity-90 text-gray-800 text-xs px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 hover:bg-opacity-100"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Add Image</span>
                </button>
              </div>
            </>
          ) : (
            /* No Images State */
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 relative">
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-500 text-sm">No images</span>
              
              <button
                onClick={handleAddImageClick}
                className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all"
              >
                <div className="bg-white bg-opacity-90 text-gray-800 text-xs px-3 py-2 rounded-md opacity-0 hover:opacity-100 transition-opacity flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Add Image</span>
                </div>
              </button>
            </div>
          )}

          {/* Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>

        {/* Image Thumbnails/Dots */}
        {hasImages && imageCount > 1 && (
          <div className="flex justify-center space-x-2 mt-2">
            {variant.images!.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex 
                    ? 'bg-indigo-600 w-4' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Variant Details */}
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
            {variant.salePrice && variant.price && variant.salePrice < variant.price && (
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
        Created: {new Date(variant.createdAt || '').toLocaleDateString()}
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
