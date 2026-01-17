"use client";
import { useMutation } from "@apollo/client";
import { INSERTPRODUCT } from "../../components/graphql/mutation";
import { NewProduct, category } from '../../../../types';
import { useState } from 'react';

interface ProductFormProps {
  supplierId: String;
  newProduct: NewProduct;
  setNewProduct: (product: NewProduct) => void;
  categories: category[];
  onProductAdded: () => void;
}

export default function ProductForm({
  supplierId,
  newProduct,
  setNewProduct,
  categories,
  onProductAdded
}: ProductFormProps) {
  const [insertProduct, { loading, error }] = useMutation(INSERTPRODUCT);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedSizeParent, setSelectedSizeParent] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  // NEW: Add state for color picker
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  // SIZE DATA - ADDED ONLY THIS SECTION
  const sizeData = [
    { parent: "Alpha", values: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"] },
    { parent: "Numeric", values: ["0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20"] },
    { parent: "Shoes (US)", values: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12", "13"] },
    { parent: "Shoes (EU)", values: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"] },
    { parent: "Men's Pants", values: ["28", "30", "32", "34", "36", "38", "40", "42", "44"] },
    { parent: "Bra", values: ["30A", "32A", "34A", "36A", "38A", "30B", "32B", "34B", "36B", "38B", "30C", "32C", "34C", "36C", "38C"] },
    { parent: "Kid's", values: ["2T", "3T", "4T", "5", "6", "7", "8", "10", "12", "14"] },
    { parent: "Baby", values: ["Newborn", "0-3M", "3-6M", "6-9M", "9-12M", "12-18M", "18-24M"] },
    { parent: "One Size", values: ["One Size Fits All"] },
    { parent: "Custom", values: [] }
  ];

  // NEW: Function to copy color to clipboard
  const copyColorToClipboard = async () => {
    if (newProduct.color) {
      try {
        await navigator.clipboard.writeText(newProduct.color);
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      } catch (err) {
        setCopySuccess('Failed to copy');
        setTimeout(() => setCopySuccess(''), 2000);
      }
    }
  };

  // NEW: Function to handle color change from picker
  const handleColorChange = (color: string) => {
    setNewProduct({...newProduct, color});
    setShowColorPicker(false);
  };

  // NEW: Predefined color options for quick selection
  const colorOptions = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#A52A2A', // Brown
    '#808080', // Gray
    '#FFC0CB', // Pink
    '#008000', // Dark Green
    '#000080', // Navy
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); // Clear previous error
    
    try {
      const { data } = await insertProduct({
        variables: {
          name: newProduct.name,
          description: newProduct.description,
          price: parseFloat(newProduct.price),
          salePrice: parseFloat(newProduct.salePrice || '0'),
          sku: newProduct.sku,
          id: newProduct.categoryId,
          supplierId: supplierId,
          color: newProduct.color,
          size: newProduct.size,
          stock: parseInt(newProduct.stock),
          // Include these if your mutation expects them
          brand: newProduct.brand,
          isActive: newProduct.isActive,
          featured: newProduct.featured
        }
      });

      // Check the response structure - adjust based on your actual GraphQL response
      if (data?.createProduct?.statusText === 'Product created successfully!') {
        
        setSuccessMessage(data?.createProduct?.statusText);
        
        // Reset form
        setNewProduct({
          name: '',
          description: '',
          price: '',
          salePrice: '',
          sku: '',
          categoryId: '',
          stock: '',
          brand: '',
          isActive: false,
          featured: false,
          variants: [],
          color: '',
          size: ''
        });
        
        // Reset size selection - ADDED THIS
        setSelectedSizeParent('');
        setShowCustomInput(false);
        // Reset color picker state
        setShowColorPicker(false);
        setCopySuccess('');
        
        onProductAdded();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        // Handle cases where product might already exist or other issues
        const message = data?.createProduct?.statusText;
        setErrorMessage(message);
      }
    } catch (err: any) {
      console.error('Error adding product:', err);
      
      // Check for specific error messages like duplicate product
      if (err.message.includes('duplicate') || err.message.includes('already exists')) {
        setErrorMessage('This product already exists. Please check the SKU or product name.');
      } else if (err.message.includes('unique constraint')) {
        setErrorMessage('A product with this SKU or name already exists.');
      } else if (err.networkError) {
        setErrorMessage('Network error. Please check your connection.');
      } else {
        setErrorMessage(`Error: ${err.message}`);
      }
    }
  };

  // Common sizes for products - KEEPING ORIGINAL AS FALLBACK
  const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  return (
    <form onSubmit={handleSubmit}>
      {/* Show GraphQL errors */}
      {error && (
        <div className="text-red-500 mb-4 p-2 bg-red-100 rounded-md">
          Error: {error.message}
        </div>
      )}
      
      {/* Show custom error messages */}
      {errorMessage && (
        <div className="text-red-500 mb-4 p-2 bg-red-100 rounded-md">
          {errorMessage}
        </div>
      )}
      
      {/* Show success message */}
      {successMessage && (
        <div className="text-green-500 mb-4 p-2 bg-green-100 rounded-md">
          {successMessage}
        </div>
      )}
      
      {/* Rest of your form remains the same */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={newProduct.name}
          onChange={(e) => {
            setNewProduct({...newProduct, name: e.target.value});
            setErrorMessage(''); // Clear error when user edits
          }}
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
      
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
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
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={newProduct.salePrice}
            onChange={(e) => setNewProduct({...newProduct, salePrice: e.target.value})}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={newProduct.sku}
            onChange={(e) => {
              setNewProduct({...newProduct, sku: e.target.value});
              setErrorMessage(''); // Clear error when user edits SKU
            }}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
          <input
            type="number"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={newProduct.stock}
            onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
            required
          />
        </div>
      </div>

      {/* Color and Size Fields */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          
          {/* Color Picker Container */}
          <div className="relative">
            <div className="flex items-center space-x-2 mb-2">
              {/* Color Preview with Copy Button */}
              <div className="flex items-center space-x-2">
                <div 
                  className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer"
                  style={{ backgroundColor: newProduct.color || '#000000' }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  title="Click to pick color"
                />
                
                {/* Color Value Display with Copy */}
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 min-w-[120px]">
                    <code className="text-sm">{newProduct.color || '#000000'}</code>
                  </div>
                  <button
                    type="button"
                    onClick={copyColorToClipboard}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={!newProduct.color}
                    title="Copy color code"
                  >
                    {copySuccess || 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Color Picker Popup */}
            {showColorPicker && (
              <div className="absolute z-10 mt-2 p-4 bg-white border border-gray-300 rounded-md shadow-lg">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Color
                  </label>
                  
                  {/* Custom Color Input */}
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="color"
                      className="border border-gray-300 rounded-md cursor-pointer"
                      value={newProduct.color || '#000000'}
                      onChange={(e) => handleColorChange(e.target.value)}
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="#000000 or color name"
                      value={newProduct.color || ''}
                      onChange={(e) => setNewProduct({...newProduct, color: e.target.value})}
                    />
                  </div>

                  {/* Predefined Color Options */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Quick pick:</p>
                    <div className="grid grid-cols-5 gap-2">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          type="button"
                          className="w-8 h-8 rounded-md border border-gray-300 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorChange(color)}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Common Color Names */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Common colors:</p>
                    <div className="flex flex-wrap gap-2">
                      {['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Gray', 'Brown', 'Pink', 'Purple', 'Orange'].map(colorName => (
                        <button
                          key={colorName}
                          type="button"
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                          onClick={() => setNewProduct({...newProduct, color: colorName})}
                        >
                          {colorName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(false)}
                    className="w-full mt-4 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close Picker
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Original Color Name Input (hidden when picker is open) */}
          {!showColorPicker && (
            <input
              type="text"
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Color name (optional)"
              value={newProduct.color || ''}
              onChange={(e) => setNewProduct({...newProduct, color: e.target.value})}
            />
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
          
          {/* ADDED SIZE CATEGORY SELECTOR */}
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
            value={selectedSizeParent}
            onChange={(e) => {
              const parent = e.target.value;
              setSelectedSizeParent(parent);
              setShowCustomInput(parent === 'Custom');
              if (parent !== 'Custom') {
                setNewProduct({...newProduct, size: ''}); // Clear size when switching categories
              }
            }}
          >
            <option value="">Select size category</option>
            {sizeData.map((category) => (
              <option key={category.parent} value={category.parent}>
                {category.parent}
              </option>
            ))}
          </select>

          {/* ADDED SIZE VALUE SELECTOR */}
          {selectedSizeParent && selectedSizeParent !== 'Custom' && (
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={newProduct.size || ''}
              onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
            >
              <option value="">Select {selectedSizeParent} size</option>
              {sizeData
                .find(cat => cat.parent === selectedSizeParent)
                ?.values.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
            </select>
          )}

          {/* CUSTOM SIZE INPUT */}
          {showCustomInput && (
            <input
              type="text"
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter custom size"
              value={newProduct.size || ''}
              onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
            />
          )}

          {/* ORIGINAL SIZE SELECTOR - KEPT AS FALLBACK */}
          {!selectedSizeParent && (
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={newProduct.size || ''}
              onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
            >
              <option value="">Select size</option>
              {commonSizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
              <option value="Custom">Custom</option>
            </select>
          )}
          
          {/* ORIGINAL CUSTOM SIZE INPUT LOGIC */}
          {!selectedSizeParent && newProduct.size === 'Custom' && (
            <input
              type="text"
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter custom size"
              value={newProduct.size || ''}
              onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
            />
          )}
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
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Adding Product...' : 'Add Product'}
      </button>
    </form>
  );
                            }
