import { useState } from 'react';
import { category } from '../../../../types';
import { useMutation } from '@apollo/client';
import { CATEGORY_IMAGE_UPLOAD_MUTATION } from '../../components/graphql/mutation'; // Assuming you have this in a separate file

interface CategoryTableProps {
  categories: category[];
  refetchCategories?: () => void; // Optional refetch function to update list after upload
}

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
      setUploadError('Please select an image file');
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

      // Upload image
      const result = await uploadImage({
        variables: {
          base64Image,
          categoryId: category.id.toString()
        }
      });

      if (result.data?.categoryImageUpload?.success) {
        setUploadSuccess(true);
        
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
        
        // Refetch categories if callback provided
        if (refetchCategories) {
          refetchCategories();
        }
      } else {
        setUploadError(result.data?.categoryImageUpload?.message || 'Upload failed');
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:image/...;base64, prefix if you only want the base64 string
        const base64String = reader.result as string;
        // If you need just the base64 part without the prefix:
        // const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
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
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
          <span className="text-xs text-gray-400">No image</span>
        </div>
      )}

      {/* Upload Button */}
      <label className="cursor-pointer">
        <div className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
          {loading ? 'Uploading...' : category.image ? 'Change' : 'Upload'}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />
      </label>

      {/* Error Message */}
      {uploadError && (
        <p className="text-xs text-red-500 mt-1">{uploadError}</p>
      )}

      {/* Success Message */}
      {uploadSuccess && (
        <p className="text-xs text-green-500 mt-1">✓ Uploaded!</p>
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
    // Add edit logic here
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      console.log('Delete category:', categoryId);
      // Add delete logic here
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
