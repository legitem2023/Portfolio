"use client";
import React, { useState, useEffect } from 'react';
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
  mutation CreateFoodCategory($input: CreateFoodCategoryInput!) {
    createFoodCategory(input: $input) {
      id
      name
      accountId
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
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!accountId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-md">
          <p className="text-red-700 font-medium">Account ID is required</p>
        </div>
      </div>
    );
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
    if (isMobile) {
      setMobileMenuOpen(false);
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
      const result = await createFoodCategory({
        variables: {
          input: {
            name: categoryName,
            accountId: accountId
          }
        }
      });
      console.log('Create result:', result);
      setShowCategoryModal(false);
      refetch();
    } catch (err) {
      console.error('Error creating category:', err);
      alert('Error creating category. Please try again.');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await updateFoodCategory({
        variables: {
          input: {
            id: editingCategory.id,
            name: categoryName,
            accountId: accountId
          }
        }
      });
      setShowCategoryModal(false);
      setEditingCategory(null);
      refetch();
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Error updating category. Please try again.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? All items in it will also be deleted.')) {
      try {
        await deleteFoodCategory({ variables: { id: categoryId } });
        refetch();
      } catch (err) {
        console.error('Error deleting category:', err);
        alert('Error deleting category. Please try again.');
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
          input: {
            name: itemName,
            categoryId: itemCategoryId,
            accountId: accountId
          }
        }
      });
      setShowItemModal(false);
      refetch();
    } catch (err) {
      console.error('Error creating item:', err);
      alert('Error creating item. Please try again.');
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await updateItem({
        variables: {
          input: {
            id: editingItem.id,
            name: itemName,
            categoryId: itemCategoryId,
            accountId: accountId
          }
        }
      });
      setShowItemModal(false);
      setEditingItem(null);
      refetch();
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Error updating item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem({ variables: { id: itemId } });
        refetch();
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Error deleting item. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    console.error('GraphQL Error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-md max-w-md">
          <p className="text-red-700 font-medium mb-2">Error loading data</p>
          <p className="text-red-600 text-sm">{error.message}</p>
          <button 
            onClick={() => refetch()} 
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const foodCategories = data?.foodCategories || [];
  const filteredCategories = selectedCategoryId 
    ? foodCategories.filter((c: FoodCategories) => c.id === selectedCategoryId)
    : foodCategories;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-gray-900">Food and Drinks Management</h1>
          <div className="flex gap-2">
            <button
              onClick={openCreateCategoryModal}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              + Add
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
        
        {/* Mobile Filter Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 max-h-64 overflow-y-auto">
            <div className="p-3 space-y-1">
              <button
                onClick={() => handleCategoryFilter(null as any)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  !selectedCategoryId 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'hover:bg-gray-50'
                }`}
              >
                All Categories ({foodCategories.length})
              </button>
              {foodCategories.map((c: FoodCategories) => (
                <button
                  key={c.id}
                  onClick={() => handleCategoryFilter(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategoryId === c.id 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{c.name}</span>
                    <span className="text-xs text-gray-500">({c.items?.length || 0})</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Food Management</h1>
          <button
            onClick={openCreateCategoryModal}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            + Add New Category
          </button>
        </div>
        
        {/* Desktop Filter Buttons */}
        <div className="hidden md:flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${
              !selectedCategoryId 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            All ({foodCategories.length})
          </button>
          {foodCategories.map((c: FoodCategories) => (
            <button
              key={c.id}
              onClick={() => handleCategoryFilter(c.id)}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                selectedCategoryId === c.id 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {c.name} ({c.items?.length || 0})
            </button>
          ))}
        </div>

        {/* Categories List */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 text-lg">No categories found</p>
            <button
              onClick={openCreateCategoryModal}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create your first category
            </button>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredCategories.map((category: FoodCategories) => (
              <div key={category.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Category Header */}
                <div className="p-3 md:p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div 
                      className="flex-1 cursor-pointer flex items-center gap-2"
                      onClick={() => handleCategoryClick(category.id)}
                    >
                      <span className="text-lg md:text-xl">
                        {expandedCategories[category.id] ? '▼' : '▶'}
                      </span>
                      <h2 className="text-lg md:text-xl font-semibold text-gray-900 break-words">
                        {category.name}
                      </h2>
                      <span className="text-sm text-gray-500">
                        ({category.items?.length || 0} items)
                      </span>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => openCreateItemModal(category.id)}
                        className="px-3 py-1.5 md:px-4 md:py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-colors"
                      >
                        + Add Item
                      </button>
                      <button
                        onClick={() => openEditCategoryModal(category)}
                        className="px-3 py-1.5 md:px-4 md:py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 active:bg-yellow-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="px-3 py-1.5 md:px-4 md:py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 active:bg-red-800 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Category Items */}
                {expandedCategories[category.id] && (
                  <div className="p-3 md:p-5">
                    {category.items && category.items.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                        {category.items.map((item: Item) => (
                          <div key={item.id} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow bg-white">
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 text-base md:text-lg break-words flex-1">
                                {item.name}
                              </h3>
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  onClick={() => openEditItemModal(item)}
                                  className="text-yellow-600 hover:text-yellow-800 text-xs md:text-sm px-2 py-1 rounded hover:bg-yellow-50 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-red-600 hover:text-red-800 text-xs md:text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 space-y-0.5">
                              <p className="break-all">ID: {item.id.slice(0, 8)}...</p>
                              <p className="truncate">Category: {category.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 md:py-12">
                        <p className="text-gray-400 mb-3">No items in this category</p>
                        <button
                          onClick={() => openCreateItemModal(category.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          Add First Item
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
            </div>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="p-4 md:p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter category name"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowCategoryModal(false)} 
                  className="flex-1 md:flex-none px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
            </div>
            <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem} className="p-4 md:p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter item name"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowItemModal(false)} 
                  className="flex-1 md:flex-none px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
