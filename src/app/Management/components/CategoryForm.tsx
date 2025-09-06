import { useMutation } from "@apollo/client";
import { INSERTCATEGORY } from "../../components/graphql/mutation";
import { NewCategory, Category } from '../types/types';

interface CategoryFormProps {
  newCategory: NewCategory;
  setNewCategory: (category: NewCategory) => void;
  categories: Category[];
  onCategoryAdded?: () => void; // Optional callback for when category is added
}

export default function CategoryForm({
  newCategory,
  setNewCategory,
  categories,
  onCategoryAdded
}: CategoryFormProps) {
  const [insertCategory, { loading, error }] = useMutation(INSERTCATEGORY);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(newCategory.name);
    console.log(newCategory.description);
    console.log(newCategory.isActive);

    try {
      const result = await insertCategory({
        variables: {
          name: newCategory.name,
          description: newCategory.description || "",
          status: newCategory.isActive
          // Note: If your mutation supports parentId, add it here:
          // parentId: newCategory.parentId || null
        }
      });
      
      // Reset form after successful submission
      setNewCategory({ 
        name: '', 
        description: '', 
        isActive: true, 
        parentId: '' 
      });
      
      // Notify parent component if needed
      if (onCategoryAdded) {
        onCategoryAdded();
      }
      
      console.log("Category created successfully:", result);
      
    } catch (err) {
      console.error("Error creating category:", err);
    }
  };

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
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Adding Category...' : 'Add Category'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          Error: {error.message}
        </div>
      )}
    </form>
  );
}
