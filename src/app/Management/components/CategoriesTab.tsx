import { Category, NewCategory } from '../types/types';
import CategoryTable from './CategoryTable';
import CategoryForm from './CategoryForm';

interface CategoriesTabProps {
  categories: Category[];
  newCategory: NewCategory;
  setNewCategory: (category: NewCategory) => void;
  handleCategorySubmit: (e: React.FormEvent) => void;
}

export default function CategoriesTab({
  categories,
  newCategory,
  setNewCategory,
  handleCategorySubmit
}: CategoriesTabProps) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Category Management</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
          + Add New Category
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CategoryTable categories={categories} />
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Category</h3>
          <CategoryForm
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            categories={categories}
            handleSubmit={handleCategorySubmit}
          />
        </div>
      </div>
    </div>
  );
}
