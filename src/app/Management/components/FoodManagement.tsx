"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

// QUERIES
const GET_FOOD_CATEGORIES = gql`
  query GetFoodCategories {
    foodCategories {
      id
      name
      accountId
      account {
        id
        name
      }
      items {
        id
        name
        categoryId
        accountId
        category {
          id
          name
        }
        account {
          id
          name
        }
      }
    }
  }
`;

const GET_FOOD_CATEGORY_BY_ID = gql`
  query GetFoodCategoryById($id: ID!) {
    foodCategory(id: $id) {
      id
      name
      accountId
      account {
        id
        name
      }
      items {
        id
        name
        categoryId
        accountId
        category {
          id
          name
        }
        account {
          id
          name
        }
      }
    }
  }
`;

const GET_ITEM_BY_ID = gql`
  query GetItemById($id: ID!) {
    item(id: $id) {
      id
      name
      categoryId
      accountId
      category {
        id
        name
      }
      account {
        id
        name
      }
    }
  }
`;

const GET_ITEMS_BY_CATEGORY = gql`
  query GetItemsByCategory($categoryId: ID!) {
    itemsByCategory(categoryId: $categoryId) {
      id
      name
      categoryId
      accountId
      category {
        id
        name
      }
      account {
        id
        name
      }
    }
  }
`;

// MUTATIONS
const CREATE_FOOD_CATEGORY = gql`
  mutation CreateFoodCategory($input: FoodCategoryInput!) {
    createFoodCategory(input: $input) {
      id
      name
      accountId
      account {
        id
        name
      }
    }
  }
`;

const UPDATE_FOOD_CATEGORY = gql`
  mutation UpdateFoodCategory($id: ID!, $input: FoodCategoryInput!) {
    updateFoodCategory(id: $id, input: $input) {
      id
      name
      accountId
      account {
        id
        name
      }
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
  mutation CreateItem($input: ItemInput!) {
    createItem(input: $input) {
      id
      name
      categoryId
      accountId
      category {
        id
        name
      }
      account {
        id
        name
      }
    }
  }
`;

const UPDATE_ITEM = gql`
  mutation UpdateItem($id: ID!, $input: ItemInput!) {
    updateItem(id: $id, input: $input) {
      id
      name
      categoryId
      accountId
      category {
        id
        name
      }
      account {
        id
        name
      }
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

const FoodManagement = ({ accountId }) => {
  // Queries
  const { loading, error, data, refetch } = useQuery(GET_FOOD_CATEGORIES);
  
  // Mutations
  const [createFoodCategory] = useMutation(CREATE_FOOD_CATEGORY);
  const [updateFoodCategory] = useMutation(UPDATE_FOOD_CATEGORY);
  const [deleteFoodCategory] = useMutation(DELETE_FOOD_CATEGORY);
  const [createItem] = useMutation(CREATE_ITEM);
  const [updateItem] = useMutation(UPDATE_ITEM);
  const [deleteItem] = useMutation(DELETE_ITEM);
  
  // State
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategoryForItem, setSelectedCategoryForItem] = useState(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    accountId: accountId || ''
  });
  
  const [itemForm, setItemForm] = useState({
    name: '',
    categoryId: '',
    accountId: accountId || ''
  });

  // Handlers for Categories
  const handleCategoryClick = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleCategoryFilter = (categoryId) => {
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(categoryId);
    }
  };

  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      accountId: accountId || ''
    });
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      accountId: category.accountId
    });
    setShowCategoryModal(true);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await createFoodCategory({
        variables: {
          input: {
            name: categoryForm.name,
            accountId: categoryForm.accountId
          }
        }
      });
      setShowCategoryModal(false);
      refetch();
    } catch (err) {
      console.error('Error creating category:', err);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      await updateFoodCategory({
        variables: {
          id: editingCategory.id,
          input: {
            name: categoryForm.name,
            accountId: categoryForm.accountId
          }
        }
      });
      setShowCategoryModal(false);
      setEditingCategory(null);
      refetch();
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteFoodCategory({
          variables: { id: categoryId }
        });
        refetch();
      } catch (err) {
        console.error('Error deleting category:', err);
      }
    }
  };

  // Handlers for Items
  const openCreateItemModal = (categoryId) => {
    setEditingItem(null);
    setSelectedCategoryForItem(categoryId);
    setItemForm({
      name: '',
      categoryId: categoryId,
      accountId: accountId || ''
    });
    setShowItemModal(true);
  };

  const openEditItemModal = (item) => {
    setEditingItem(item);
    setSelectedCategoryForItem(item.categoryId);
    setItemForm({
      name: item.name,
      categoryId: item.categoryId,
      accountId: item.accountId
    });
    setShowItemModal(true);
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      await createItem({
        variables: {
          input: {
            name: itemForm.name,
            categoryId: itemForm.categoryId,
            accountId: itemForm.accountId
          }
        }
      });
      setShowItemModal(false);
      refetch();
    } catch (err) {
      console.error('Error creating item:', err);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      await updateItem({
        variables: {
          id: editingItem.id,
          input: {
            name: itemForm.name,
            categoryId: itemForm.categoryId,
            accountId: itemForm.accountId
          }
        }
      });
      setShowItemModal(false);
      setEditingItem(null);
      refetch();
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem({
          variables: { id: itemId }
        });
        refetch();
      } catch (err) {
        console.error('Error deleting item:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">Loading food categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 bg-red-50 text-red-600 rounded-lg m-5">
        <h3 className="font-bold">Error Loading Data</h3>
        <p>{error.message}</p>
        <button 
          onClick={() => refetch()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const foodCategories = data?.foodCategories || [];
  const filteredCategories = selectedCategoryId 
    ? foodCategories.filter(category => category.id === selectedCategoryId)
    : foodCategories;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Food Management</h1>
        <button
          onClick={openCreateCategoryModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Category
        </button>
      </div>
      
      {/* Category Filter Buttons */}
      <div className="flex gap-2 flex-wrap mb-6 pb-4 border-b border-gray-200">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`px-4 py-2 rounded-full transition-colors ${
            selectedCategoryId === null 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Categories ({foodCategories.length})
        </button>
        {foodCategories.map(category => (
          <button
            key={category.id}
            onClick={() => handleCategoryFilter(category.id)}
            className={`px-4 py-2 rounded-full transition-colors ${
              selectedCategoryId === category.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name} ({category.items?.length || 0})
          </button>
        ))}
      </div>

      {/* Categories and Items Display */}
      <div className="space-y-4">
        {filteredCategories.map(category => (
          <div key={category.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Category Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">
                      {expandedCategories[category.id] ? '▼' : '▶'}
                    </span>
                    <h2 className="text-xl font-semibold text-gray-800">{category.name}</h2>
                    <span className="text-sm text-gray-500">
                      ({category.items?.length || 0} items)
                    </span>
                  </div>
                  {category.account && (
                    <p className="text-sm text-gray-500 mt-1 ml-6">
                      Account: {category.account.name || category.account.id}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openCreateItemModal(category.id)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    + Add Item
                  </button>
                  <button
                    onClick={() => openEditCategoryModal(category)}
                    className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Items Grid */}
            {expandedCategories[category.id] && (
              <div className="p-4">
                {category.items && category.items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.items.map(item => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-800 text-lg">{item.name}</h3>
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
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">ID:</span> {item.id}</p>
                          <p><span className="font-medium">Category ID:</span> {item.categoryId}</p>
                          <p><span className="font-medium">Account ID:</span> {item.accountId}</p>
                          {item.category && (
                            <p><span className="font-medium">Category Name:</span> {item.category.name}</p>
                          )}
                          {item.account && (
                            <p><span className="font-medium">Account Name:</span> {item.account.name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No items in this category. Click "Add Item" to add one.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No food categories found. Click "Add Category" to create one.
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Account ID</label>
                <input
                  type="text"
                  value={categoryForm.accountId}
                  onChange={(e) => setCategoryForm({...categoryForm, accountId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
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
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Category ID</label>
                <input
                  type="text"
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm({...itemForm, categoryId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Account ID</label>
                <input
                  type="text"
                  value={itemForm.accountId}
                  onChange={(e) => setItemForm({...itemForm, accountId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
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
