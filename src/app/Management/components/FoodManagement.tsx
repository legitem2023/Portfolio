"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

// ==================== TYPES ====================

interface FoodCategories {
  id: string;
  name: string;
  accountId: string;
  items?: Item[];
}

interface Item {
  id: string;
  name: string;
  categoryId: string;
  accountId: string;
}

interface FoodManagementProps {
  accountId?: string;
}

// ==================== GRAPHQL QUERIES ====================

const GET_FOOD_CATEGORIES = gql`
  query GetFoodCategories($accountId: ID!) {
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

// ==================== GRAPHQL MUTATIONS ====================

const CREATE_FOOD_CATEGORY = gql`
  mutation CreateFoodCategory($name: String!, $accountId: ID!) {
    createFoodCategory(name: $name, accountId: $accountId) {
      id
      name
      accountId
    }
  }
`;

const UPDATE_FOOD_CATEGORY = gql`
  mutation UpdateFoodCategory($id: ID!, $name: String, $accountId: ID) {
    updateFoodCategory(id: $id, name: $name, accountId: $accountId) {
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
  mutation CreateItem($name: String!, $categoryId: ID!, $accountId: ID!) {
    createItem(name: $name, categoryId: $categoryId, accountId: $accountId) {
      id
      name
      categoryId
      accountId
    }
  }
`;

const UPDATE_ITEM = gql`
  mutation UpdateItem($id: ID!, $name: String, $categoryId: ID, $accountId: ID) {
    updateItem(id: $id, name: $name, categoryId: $categoryId, accountId: $accountId) {
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

// ==================== COMPONENT ====================

const FoodManagement: React.FC<FoodManagementProps> = ({ accountId }) => {
  const { loading, error, data, refetch } = useQuery(GET_FOOD_CATEGORIES, {
    variables: { accountId: accountId || '' },
    skip: !accountId
  });
  
  const [createFoodCategory] = useMutation(CREATE_FOOD_CATEGORY);
  const [updateFoodCategory] = useMutation(UPDATE_FOOD_CATEGORY);
  const [deleteFoodCategory] = useMutation(DELETE_FOOD_CATEGORY);
  const [createItem] = useMutation(CREATE_ITEM);
  const [updateItem] = useMutation(UPDATE_ITEM);
  const [deleteItem] = useMutation(DELETE_ITEM);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FoodCategories | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState('');

  if (!accountId) {
    return <div className="p-5 text-red-600">Account ID is required</div>;
  }

  const handleCategoryClick = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleCategoryFilter = (categoryId: string) => {
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(categoryId);
    }
  };

  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (category: FoodCategories) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setShowCategoryModal(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFoodCategory({
        variables: {
          name: categoryName,
          accountId: accountId
        }
      });
      setShowCategoryModal(false);
      refetch();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await updateFoodCategory({
        variables: {
          id: editingCategory.id,
          name: categoryName,
          accountId: accountId
        }
      });
      setShowCategoryModal(false);
      setEditingCategory(null);
      refetch();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm('Delete this category?')) {
      try {
        await deleteFoodCategory({ variables: { id: categoryId } });
        refetch();
      } catch (err) {
        console.error('Error:', err);
      }
    }
  };

  const openCreateItemModal = (categoryId: string) => {
    setEditingItem(null);
    setItemName('');
    setItemCategoryId(categoryId);
    setShowItemModal(true);
  };

  const openEditItemModal = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCategoryId(item.categoryId);
    setShowItemModal(true);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createItem({
        variables: {
          name: itemName,
          categoryId: itemCategoryId,
          accountId: accountId
        }
      });
      setShowItemModal(false);
      refetch();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await updateItem({
        variables: {
          id: editingItem.id,
          name: itemName,
          categoryId: itemCategoryId,
          accountId: accountId
        }
      });
      setShowItemModal(false);
      setEditingItem(null);
      refetch();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Delete this item?')) {
      try {
        await deleteItem({ variables: { id: itemId } });
        refetch();
      } catch (err) {
        console.error('Error:', err);
      }
    }
  };

  if (loading) return <div className="p-5">Loading...</div>;
  
  if (error) {
    return <div className="p-5 text-red-600">Error: {error.message}</div>;
  }

  const foodCategories = data?.foodCategories || [];
  const filteredCategories = selectedCategoryId 
    ? foodCategories.filter((c: FoodCategories) => c.id === selectedCategoryId)
    : foodCategories;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Food Management</h1>
        <button
          onClick={openCreateCategoryModal}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Category
        </button>
      </div>
      
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`px-4 py-2 rounded ${
            !selectedCategoryId ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          All ({foodCategories.length})
        </button>
        {foodCategories.map((c: FoodCategories) => (
          <button
            key={c.id}
            onClick={() => handleCategoryFilter(c.id)}
            className={`px-4 py-2 rounded ${
              selectedCategoryId === c.id ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {c.name} ({c.items?.length || 0})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredCategories.map((category: FoodCategories) => (
          <div key={category.id} className="border rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 flex justify-between items-center">
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => handleCategoryClick(category.id)}
              >
                <h2 className="text-xl font-semibold">
                  {expandedCategories[category.id] ? '▼' : '▶'} {category.name}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openCreateItemModal(category.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Add Item
                </button>
                <button
                  onClick={() => openEditCategoryModal(category)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
            
            {expandedCategories[category.id] && (
              <div className="p-4">
                {category.items && category.items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.items.map((item: Item) => (
                      <div key={item.id} className="border p-4 rounded-lg hover:shadow-md">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditItemModal(item)}
                              className="text-yellow-600 hover:text-yellow-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>ID: {item.id}</p>
                          <p>Category ID: {item.categoryId}</p>
                          <p>Account ID: {item.accountId}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No items in this category</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Category Name"
                className="w-full p-2 border rounded mb-4"
                required
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 bg-gray-300 rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem}>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Item Name"
                className="w-full p-2 border rounded mb-4"
                required
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowItemModal(false)} className="px-4 py-2 bg-gray-300 rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodManagement;
