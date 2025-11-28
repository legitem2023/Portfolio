import { Category } from '../types/types';

interface CategoryTableProps {
  categories: Category[];
}

export default function CategoryTable({ categories }: CategoryTableProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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

// Mobile Category Card Component
function MobileCategoryCard({ category }: { category: Category }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {category.productCount} products
          </p>
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
