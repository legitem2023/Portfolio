import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

// GraphQL Queries
const GET_FOOD_CATEGORIES = gql`
  query GetFoodCategories($accountId: String) {
    foodCategories(accountId: $accountId) {
      id
      name
      accountId
      items {
        id
        name
        categoryId
        accountId
      }
    }
  }
`;

const GET_ITEMS = gql`
  query GetItems($accountId: String) {
    items(accountId: $accountId) {
      id
      name
      categoryId
      accountId
      category {
        id
        name
      }
    }
  }
`;

// GraphQL Mutations
const CREATE_FOOD_CATEGORY = gql`
  mutation CreateFoodCategory($input: CreateFoodCategoryInput!) {
    createFoodCategory(input: $input) {
      id
      name
      accountId
      items {
        id
        name
      }
    }
  }
`;

const UPDATE_FOOD_CATEGORY = gql`
  mutation UpdateFoodCategory($input: UpdateFoodCategoryInput!) {
    updateFoodCategory(input: $input) {
      id
      name
      accountId
    }
  }
`;

const DELETE_FOOD_CATEGORY = gql`
  mutation DeleteFoodCategory($id: ID!) {
    deleteFoodCategory(id: $id) {
      id
      name
    }
  }
`;

const CREATE_ITEM = gql`
  mutation CreateItem($input: CreateItemInput!) {
    createItem(input: $input) {
      id
      name
      categoryId
      accountId
      category {
        id
        name
      }
    }
  }
`;

const UPDATE_ITEM = gql`
  mutation UpdateItem($input: UpdateItemInput!) {
    updateItem(input: $input) {
      id
      name
      categoryId
      accountId
    }
  }
`;

const DELETE_ITEM = gql`
  mutation DeleteItem($id: ID!) {
    deleteItem(id: $id) {
      id
      name
    }
  }
`;

// Types
interface Item {
  id: string;
  name: string;
  categoryId: string | null;
  accountId: string;
  category?: {
    id: string;
    name: string;
  } | null;
}

interface FoodCategory {
  id: string;
  name: string;
  accountId: string;
  items: Item[];
}

interface FoodCategoriesData {
  foodCategories: FoodCategory[];
}

interface ItemsData {
  items: Item[];
}

// Component
const FoodManagement: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FoodCategory | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [accountId] = useState("user_account_id_here"); // Replace with actual account ID

  // Queries
  const { loading: categoriesLoading, error: categoriesError, data: categoriesData, refetch: refetchCategories } = useQuery<FoodCategoriesData>(GET_FOOD_CATEGORIES, {
    variables: { accountId }
  });
  
  const { loading: itemsLoading, error: itemsError, data: itemsData, refetch: refetchItems } = useQuery<ItemsData>(GET_ITEMS, {
    variables: { accountId }
  });

  // Mutations
  const [createFoodCategory] = useMutation(CREATE_FOOD_CATEGORY);
  const [updateFoodCategory] = useMutation(UPDATE_FOOD_CATEGORY);
  const [deleteFoodCategory] = useMutation(DELETE_FOOD_CATEGORY);
  const [createItem] = useMutation(CREATE_ITEM);
  const [updateItem] = useMutation(UPDATE_ITEM);
  const [deleteItem] = useMutation(DELETE_ITEM);

  // Category Handlers
  const handleCreateCategory = async (name: string) => {
    try {
      await createFoodCategory({
        variables: {
          input: {
            name,
            accountId
          }
        }
      });
      await refetchCategories();
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    try {
      await updateFoodCategory({
        variables: {
          input: {
            id,
            name
          }
        }
      });
      await refetchCategories();
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? All items in this category will be orphaned.')) {
      try {
        await deleteFoodCategory({
          variables: { id }
        });
        await refetchCategories();
        if (selectedCategory?.id === id) {
          setSelectedCategory(null);
        }
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  // Item Handlers
  const handleCreateItem = async (name: string, categoryId: string | null) => {
    try {
      await createItem({
        variables: {
          input: {
            name,
            categoryId,
            accountId
          }
        }
      });
      await refetchCategories();
      await refetchItems();
      setIsItemModalOpen(false);
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleUpdateItem = async (id: string, name: string, categoryId: string | null) => {
    try {
      await updateItem({
        variables: {
          input: {
            id,
            name,
            categoryId
          }
        }
      });
      await refetchCategories();
      await refetchItems();
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem({
          variables: { id }
        });
        await refetchCategories();
        await refetchItems();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  if (categoriesLoading || itemsLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-600">Loading...</div>
    </div>
  );
  
  if (categoriesError || itemsError) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-red-600">Error loading data</div>
    </div>
  );

  const categories = categoriesData?.foodCategories || [];
  const items = itemsData?.items || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Food Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Categories</h2>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Category
              </button>
            </div>
            
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCategory?.id === category.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        <p className="text-sm text-gray-500">{category.items.length} items</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(category);
                        }}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {categories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No categories yet. Click &qoute;Add Category&qoute; to create one.
                </div>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {selectedCategory ? `Items in ${selectedCategory.name}` : 'All Items'}
              </h2>
              <button
                onClick={() => setIsItemModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Item
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {(selectedCategory ? selectedCategory.items : items).map((item) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.category && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {item.category.name}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {(selectedCategory ? selectedCategory.items : items).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No items yet. Click &qoute;Add Item.&qoute; to create one.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {(isCategoryModalOpen || editingCategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <CategoryForm
              category={editingCategory}
              onSave={(name) => {
                if (editingCategory) {
                  handleUpdateCategory(editingCategory.id, name);
                } else {
                  handleCreateCategory(name);
                }
              }}
              onClose={() => {
                setIsCategoryModalOpen(false);
                setEditingCategory(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Item Modal */}
      {(isItemModalOpen || editingItem) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              {editingItem ? 'Edit Item' : 'Add Item'}
            </h2>
            <ItemForm
              item={editingItem}
              categories={categories}
              onSave={(name, categoryId) => {
                if (editingItem) {
                  handleUpdateItem(editingItem.id, name, categoryId);
                } else {
                  handleCreateItem(name, categoryId);
                }
              }}
              onClose={() => {
                setIsItemModalOpen(false);
                setEditingItem(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Category Form Component
interface CategoryFormProps {
  category?: FoodCategory | null;
  onSave: (name: string) => void;
  onClose: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSave, onClose }) => {
  const [name, setName] = useState(category?.name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Category Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        autoFocus
      />
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
      </div>
    </form>
  );
};

// Item Form Component
interface ItemFormProps {
  item?: Item | null;
  categories: FoodCategory[];
  onSave: (name: string, categoryId: string | null) => void;
  onClose: () => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, categories, onSave, onClose }) => {
  const [name, setName] = useState(item?.name || '');
  const [categoryId, setCategoryId] = useState(item?.categoryId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), categoryId || null);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Item Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        autoFocus
      />
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
      >
        <option value="">No Category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default FoodManagement;
