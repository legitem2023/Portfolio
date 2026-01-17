"use client";
import { useMutation } from "@apollo/client";
import { INSERTPRODUCT } from "../../components/graphql/mutation";
import { NewProduct, category } from '../../../../types';
import { useState, useRef } from 'react';
import { EyeDropperIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ProductFormProps {
  supplierId: String;
  newProduct: NewProduct;
  setNewProduct: (product: NewProduct) => void;
  categories: category[];
  onProductAdded: () => void;
}

// Declare EyeDropper interface for TypeScript
declare global {
  interface Window {
    EyeDropper: any;
  }
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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [isPickingColor, setIsPickingColor] = useState(false);
  
  // Reference for color input
  const colorInputRef = useRef<HTMLInputElement>(null);

  // SIZE DATA
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

  // Function to copy color to clipboard
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

  // Function to activate the eyedropper
  const activateEyedropper = async () => {
    // Check if the EyeDropper API is supported
    if (!('EyeDropper' in window)) {
      alert('The Eyedropper API is not supported in your browser. Try using Chrome 95+, Edge 96+, or Opera 81+.');
      return;
    }

    try {
      setIsPickingColor(true);
      // @ts-ignore - EyeDropper API may not be in TypeScript definitions
      const dropper = new window.EyeDropper();
      
      // Open the eyedropper - this allows user to pick color from anywhere on screen
      const result = await dropper.open();
      
      // Set the picked color
      setNewProduct({...newProduct, color: result.sRGBHex});
      setShowColorPicker(false);
      
    } catch (err) {
      // User canceled the eyedropper selection
      console.log('Color selection cancelled:', err);
    } finally {
      setIsPickingColor(false);
    }
  };

  // Function to handle color change from picker
  const handleColorChange = (color: string) => {
    setNewProduct({...newProduct, color});
    setShowColorPicker(false);
  };

  // Predefined color options for quick selection
  const colorOptions = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', 
    '#A52A2A', '#808080', '#FFC0CB', '#008000', '#000080',
    '#FF4500', '#32CD32', '#8A2BE2', '#FF69B4', '#DAA520'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
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
          brand: newProduct.brand,
          isActive: newProduct.isActive,
          featured: newProduct.featured
        }
      });

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
        
        // Reset selections
        setSelectedSizeParent('');
        setShowCustomInput(false);
        setShowColorPicker(false);
        setCopySuccess('');
        setIsPickingColor(false);
        
        onProductAdded();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const message = data?.createProduct?.statusText;
        setErrorMessage(message);
      }
    } catch (err: any) {
      console.error('Error adding product:', err);
      
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

  // Common sizes for products
  const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  return (
    <form onSubmit={handleSubmit}>
      {/* Error and Success Messages */}
      {error && (
        <div className="text-red-500 mb-4 p-2 bg-red-100 rounded-md">
          Error: {error.message}
        </div>
      )}
      
      {errorMessage && (
        <div className="text-red-500 mb-4 p-2 bg-red-100 rounded-md">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="text-green-500 mb-4 p-2 bg-green-100 rounded-md">
          {successMessage}
        </div>
      )}
      
      {/* Product Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={newProduct.name}
          onChange={(e) => {
            setNewProduct({...newProduct, name: e.target.value});
            setErrorMessage('');
          }}
          required
        />
      </div>
      
      {/* Description */}
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
      
      {/* Price and Sale Price */}
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
      
      {/* SKU and Stock */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={newProduct.sku}
            onChange={(e) => {
              setNewProduct({...newProduct, sku: e.target.value});
              setErrorMessage('');
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Enhanced Color Field with Eyedropper */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          
          {/* Main Color Input Area */}
          <div className="flex items-center space-x-2 mb-2">
            {/* Color Preview Box */}
            <div 
              className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors"
              style={{ backgroundColor: newProduct.color || '#000000' }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Click to open color picker"
            />
            
            {/* Color Value Display and Actions */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    ref={colorInputRef}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md pr-20"
                    placeholder="#000000 or color name"
                    value={newProduct.color || ''}
                    onChange={(e) => setNewProduct({...newProduct, color: e.target.value})}
                  />
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    {/* Eyedropper Button */}
                    <button
                      type="button"
                      onClick={activateEyedropper}
                      disabled={isPickingColor}
                      className={`p-1.5 rounded-md ${isPickingColor ? 'bg-indigo-300' : 'bg-indigo-100 hover:bg-indigo-200'}`}
                      title="Pick color from screen (Eye Dropper)"
                    >
                      {isPickingColor ? (
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <EyeDropperIcon className="w-5 h-5 text-indigo-600" />
                      )}
                    </button>
                    
                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={copyColorToClipboard}
                      disabled={!newProduct.color}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Copy color to clipboard"
                    >
                      {copySuccess === 'Copied!' ? (
                        <CheckIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <ClipboardDocumentIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Copy Success Message */}
              {copySuccess && (
                <div className={`text-xs mt-1 ${copySuccess === 'Copied!' ? 'text-green-600' : 'text-red-600'}`}>
                  {copySuccess}
                </div>
              )}
              
              {/* Browser Compatibility Note */}
              {!window.EyeDropper && (
                <div className="text-xs text-amber-600 mt-1">
                  Note: Eye Dropper works in Chrome 95+, Edge 96+, Opera 81+
                </div>
              )}
            </div>
          </div>

          {/* Color Picker Popup */}
          {showColorPicker && (
            <div className="absolute z-50 mt-1 p-4 bg-white border border-gray-300 rounded-lg shadow-xl min-w-[280px]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700">Color Picker</h3>
                <button
                  type="button"
                  onClick={() => setShowColorPicker(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              {/* Custom Color Input */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">Custom Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                    value={newProduct.color || '#000000'}
                    onChange={(e) => handleColorChange(e.target.value)}
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      placeholder="#RRGGBB"
                      value={newProduct.color || ''}
                      onChange={(e) => setNewProduct({...newProduct, color: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Eyedropper Button in Picker */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={activateEyedropper}
                  disabled={isPickingColor}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md ${isPickingColor ? 'bg-indigo-300' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}
                >
                  {isPickingColor ? (
                    <>
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Picking color...</span>
                    </>
                  ) : (
                    <>
                      <EyeDropperIcon className="w-4 h-4" />
                      <span>Pick Color from Screen</span>
                    </>
                  )}
                </button>
              </div>

              {/* Predefined Color Grid */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">Quick Colors</label>
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

              {/* Color Name Buttons */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Color Names</label>
                <div className="flex flex-wrap gap-2">
                  {['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Gray', 'Navy'].map(colorName => (
                    <button
                      key={colorName}
                      type="button"
                      className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                      onClick={() => setNewProduct({...newProduct, color: colorName})}
                    >
                      {colorName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Size Field (unchanged from previous implementation) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
          
          {/* Size Category Selector */}
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
            value={selectedSizeParent}
            onChange={(e) => {
              const parent = e.target.value;
              setSelectedSizeParent(parent);
              setShowCustomInput(parent === 'Custom');
              if (parent !== 'Custom') {
                setNewProduct({...newProduct, size: ''});
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

          {/* Size Value Selector */}
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

          {/* Custom Size Input */}
          {showCustomInput && (
            <input
              type="text"
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter custom size"
              value={newProduct.size || ''}
              onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
            />
          )}

          {/* Fallback Size Selector */}
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
      
      {/* Category */}
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
      
      {/* Brand */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={newProduct.brand}
          onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
        />
      </div>
      
      {/* Active Product Checkbox */}
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
      
      {/* Featured Product Checkbox */}
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
      
      {/* Submit Button */}
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
