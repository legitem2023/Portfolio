/*import { NewProduct, Category } from '../types/types';

interface ProductFormProps {
  newProduct: NewProduct;
  setNewProduct: (product: NewProduct) => void;
  categories: Category[];
  handleSubmit: (e: React.FormEvent) => void;
}

export default function ProductForm({
  newProduct,
  setNewProduct,
  categories,
  handleSubmit
}: ProductFormProps) {
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={newProduct.name}
          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={3}
          value={newProduct.description}
          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
          required
        ></textarea>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
          <input
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={newProduct.price}
            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price ($)</label>
          <input
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={newProduct.salePrice}
            onChange={(e) => setNewProduct({...newProduct, salePrice: e.target.value})}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={newProduct.sku}
            onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={newProduct.stock}
            onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={newProduct.categoryId}
          onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value})}
          required
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={newProduct.brand}
          onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
        />
      </div>
      
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="isActive"
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
          checked={newProduct.isActive}
          onChange={(e) => setNewProduct({...newProduct, isActive: e.target.checked})}
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">Active Product</label>
      </div>
      
      <div className="flex items-center mb-6">
        <input
          type="checkbox"
          id="featured"
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
          checked={newProduct.featured}
          onChange={(e) => setNewProduct({...newProduct, featured: e.target.checked})}
        />
        <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">Featured Product</label>
      </div>
      
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
      >
        Add Product
      </button>
    </form>
  );
}*/
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { INSERTPRODUCT } from '../../components/graphql/mutation';

const ProductForm = ({ categories, onProductAdded }:any) => {
  const [createProduct, { loading, error }] = useMutation(INSERTPRODUCT);
  const [showSkuHelp, setShowSkuHelp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    salePrice: '',
    sku: '',
    stock: '',
    categoryId: '',
    brand: '',
    isActive: true,
    featured: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await createProduct({
        variables: {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
          sku: formData.sku
        }
      });
      
      if (data.createProduct.statusText === 'success') {
        onProductAdded();
        // Reset form
        setFormData({
          name: '',
          description: '',
          price: '',
          salePrice: '',
          sku: '',
          stock: '',
          categoryId: '',
          brand: '',
          isActive: true,
          featured: false
        });
      }
    } catch (err) {
      console.error('Error creating product:', err);
    }
  };

  const generateSku = () => {
    // Simple SKU generator for demonstration
    const brandAbbr = formData.brand ? formData.brand.substring(0, 3).toUpperCase() : 'PRO';
    const nameAbbr = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'UCT';
    const randomNum = Math.floor(Math.random() * 1000);
    const newSku = `${brandAbbr}-${nameAbbr}-${randomNum}`;
    
    setFormData(prev => ({
      ...prev,
      sku: newSku
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Product</h2>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-blue-800">
            SKU Information
          </h3>
          <button 
            type="button"
            onClick={() => setShowSkuHelp(!showSkuHelp)}
            className="text-blue-500 hover:text-blue-700"
          >
            {showSkuHelp ? 'Hide Info' : 'Why is SKU important?'}
          </button>
        </div>
        
        {showSkuHelp && (
          <div className="mt-2 text-blue-700">
            <p className="text-sm">
              A <strong>SKU (Stock Keeping Unit)</strong> is a unique identifier for each product variant. 
              While not always technically required, SKUs are essential for:
            </p>
            <ul className="text-sm list-disc pl-5 mt-2">
              <li>Inventory management and tracking</li>
              <li>Order processing and fulfillment</li>
              <li>Multi-channel sales synchronization</li>
              <li>Sales analysis by product variant</li>
            </ul>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Product Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price ($) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-1">
              Sale Price ($)
            </label>
            <input
              type="number"
              id="salePrice"
              name="salePrice"
              step="0.01"
              value={formData.salePrice}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <button
                type="button"
                onClick={generateSku}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Generate SKU
              </button>
            </div>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
              Stock *
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
            Brand
          </label>
          <input
            type="text"
            id="brand"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active Product
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
              Featured Product
            </label>
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md">
            Error: {error.message}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
};

export default ProductForm;
