import { useState } from 'react';
import { category } from '../../../../types';
import { useMutation, gql } from '@apollo/client';

interface CategoryTableProps {
  categories: category[];
  refetchCategories?: () => void;
}

// Define the mutation here
const CATEGORY_IMAGE_UPLOAD_MUTATION = gql`
  mutation CategoryImageUpload($base64Image: String!, $categoryId: ID!) {
    categoryImageUpload(base64Image: $base64Image, categoryId: $categoryId) {
      statusText
      token
    }
  }
`;

export default function CategoryTable({ categories, refetchCategories }: CategoryTableProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium bg-gray-800 text-gray-300 uppercase tracking-wider">
                Image
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium bg-gray-800 text-gray-300 uppercase tracking-wider">
                Category Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium bg-gray-800 text-gray-300 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium bg-gray-800 text-gray-300 uppercase tracking-wider">
                Products
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
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <CategoryImageUploader 
                    category={category} 
                    refetchCategories={refetchCategories}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {category.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {category.description || "No description"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.productCount} products
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={category.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <ActionButtons categoryId={category.id.toString()} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {categories.map((category) => (
          <MobileCategoryCard 
            key={category.id} 
            category={category} 
            refetchCategories={refetchCategories}
          />
        ))}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m16 0h-4m-4 0H8m4 0v4m0 0v4m0-4h0m0 0h0" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No categories found</h3>
          <p className="mt-2 text-gray-500">
            No categories available. Add your first category to get started.
          </p>
        </div>
      )}
    </>
  );
}

// Category Image Uploader Component
function CategoryImageUploader({ 
  category, 
  refetchCategories 
}: { 
  category: category;
  refetchCategories?: () => void;
}) {
  const [uploadImage, { loading, error }] = useMutation(CATEGORY_IMAGE_UPLOAD_MUTATION);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setUploadError(null);
    setUploadSuccess(false);

    // Validate file
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }

    try {
      // Convert file to base64
      const base64Image = await convertToBase64(file);
      
      // Extract only the base64 data (remove data:image/... prefix if needed)
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      
      console.log('Uploading to category:', category.id, 'Base64 length:', cleanBase64.length);

      // Upload image using the mutation
      const result = await uploadImage({
        variables: {
          base64Image: cleanBase64, // Send the base64 string
          categoryId: category.id.toString()
        }
      });

      console.log('Upload result:', result);

      // Check the response based on your backend schema
      if (result.data?.categoryImageUpload?.statusText === "Successfully Uploaded") {
        setUploadSuccess(true);
        
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
        
        // Refetch categories if callback provided
        if (refetchCategories) {
          setTimeout(() => refetchCategories(), 1000); // Give some time for the backend to process
        }
      } else {
        const errorMsg = result.data?.categoryImageUpload?.statusText || 
                        result.errors?.[0]?.message || 
                        'Upload failed';
        setUploadError(errorMsg);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  // Helper function to convert file to base64
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

  return (
    <div className="flex flex-col items-center">
      {/* Current Image Display */}
      {category.image ? (
        <div className="relative mb-2">
          <img 
            src={category.image} 
            alt={category.name}
            className="w-12 h-12 rounded-full object-cover border border-gray-200"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-image.png';
            }}
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2 border border-gray-300">
          <span className="text-xs text-gray-500 justify-center items-center">No image</span>
        </div>
      )}

      {/* Upload Button */}
      <label className={`cursor-pointer ${loading ? 'opacity-50' : ''}`}>
        <div className={`text-xs font-medium px-2 py-1 rounded ${
          loading 
            ? 'bg-gray-100 text-gray-500' 
            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800'
        }`}>
          {loading ? 'Uploading...' : category.image ? 'Change' : 'Upload'}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />
      </label>

      {/* Status Messages */}
      {uploadError && (
        <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded max-w-[120px] text-center">
          {uploadError}
        </p>
      )}

      {uploadSuccess && (
        <p className="text-xs text-green-600 mt-1 bg-green-50 px-2 py-1 rounded max-w-[120px] text-center">
          ✓ Uploaded!
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded max-w-[120px] text-center">
          Error: {error.message}
        </p>
      )}
    </div>
  );
}

// Mobile Category Card Component
function MobileCategoryCard({ 
  category,
  refetchCategories 
}: { 
  category: category;
  refetchCategories?: () => void;
}) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          <CategoryImageUploader 
            category={category}
            refetchCategories={refetchCategories}
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {category.productCount} products
            </p>
          </div>
        </div>
        <StatusBadge status={category.status} />
      </div>
      
      {/* Description */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {category.description || "No description available"}
        </p>
      </div>
      
      {/* Actions */}
      <div className="pt-3 border-t border-gray-200">
        <ActionButtons categoryId={category.id.toString()} />
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
      status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {status}
    </span>
  );
}

// Action Buttons Component
function ActionButtons({ categoryId }: { categoryId: string }) {
  const handleEdit = () => {
    console.log('Edit category:', categoryId);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      console.log('Delete category:', categoryId);
    }
  };

  return (
    <div className="flex space-x-3">
      <button 
        onClick={handleEdit}
        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium transition-colors"
      >
        Edit
      </button>
      <button 
        onClick={handleDelete}
        className="text-red-600 hover:text-red-900 text-sm font-medium transition-colors"
      >
        Delete
      </button>
    </div>
  );
}
