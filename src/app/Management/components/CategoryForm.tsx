import { NewCategory, Category } from './types/types';

interface CategoryFormProps {
  newCategory: NewCategory;
  setNewCategory: (category: NewCategory) => void;
  categories: Category[];
  handleSubmit: (e: React.FormEvent) => void;
}

export default function CategoryForm({
  newCategory,
  setNewCategory,
  categories,
  handleSubmit
}: CategoryFormProps) {
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={newCategory.name}
          onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={3}
          value={newCategory.description}
          onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
        ></textarea>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category (Optional)</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={newCategory.parentId}
          onChange={(e) => setNewCategory({...newCategory, parentId: e.target.value})}
        >
          <option value="">None (Top-level category)</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center mb-6">
        <input
          type="checkbox"
          id="catActive"
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
          checked={newCategory.isActive}
          onChange={(e) => setNewCategory({...newCategory, isActive: e.target.checked})}
        />
        <label htmlFor="catActive" className="ml-2 block text-sm text-gray-700">Active Category</label>
      </div>
      
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
      >
        Add Category
      </button>
    </form>
  );
}
