"use client";
import { useMutation } from "@apollo/client";
import { INSERTPRODUCT } from "../../components/graphql/mutation";
import { NewProduct, category } from '../../../../types';
import { useState, useRef } from 'react';
// ✅ CORRECTED LUCIDE-REACT IMPORTS
import { Pipette, Copy, Check } from 'lucide-react';
import sizeData from "./Json/sizes.json"
interface ProductFormProps {
  supplierId: String;
  newProduct: NewProduct;
  setNewProduct: (product: NewProduct) => void;
  categories: category[];
  onProductAdded: () => void;
}

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
  const [skuOption, setSkuOption] = useState<'blank' | 'manual'>('blank'); // State for SKU option
  
  const colorInputRef = useRef<HTMLInputElement>(null);

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

  const activateEyedropper = async () => {
    if (!('EyeDropper' in window)) {
      alert('The Eyedropper API is not supported in your browser. Try using Chrome 95+, Edge 96+, or Opera 81+.');
      return;
    }

    try {
      setIsPickingColor(true);
      const dropper = new window.EyeDropper();
      const result = await dropper.open();
      setNewProduct({...newProduct, color: result.sRGBHex});
      setShowColorPicker(false);
    } catch (err) {
      console.log('Color selection cancelled:', err);
    } finally {
      setIsPickingColor(false);
    }
  };

  const handleColorChange = (color: string) => {
    setNewProduct({...newProduct, color});
    setShowColorPicker(false);
  };

  const colorOptions = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', 
    '#A52A2A', '#808080', '#FFC0CB', '#008000', '#000080',
    '#FF4500', '#32CD32', '#8A2BE2', '#FF69B4', '#DAA520'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Determine SKU value based on option
    const finalSku = skuOption === 'blank' ? '' : newProduct.sku;
    
    try {
      const { data } = await insertProduct({
        variables: {
          name: newProduct.name,
          description: newProduct.description,
          price: parseFloat(newProduct.price),
          salePrice: parseFloat(newProduct.salePrice || '0'),
          sku: finalSku,
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
        
        setSelectedSizeParent('');
        setShowCustomInput(false);
        setShowColorPicker(false);
        setCopySuccess('');
        setIsPickingColor(false);
        setSkuOption('blank');
        
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

  const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  return (
    <form onSubmit={handleSubmit}>
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
          
          {/* Radio Buttons for SKU Option */}
          <div className="flex gap-6 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="skuOption"
                value="blank"
                checked={skuOption === 'blank'}
                onChange={() => {
                  setSkuOption('blank');
                  setNewProduct({...newProduct, sku: ''});
                }}
                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Auto-generate SKU (Leave blank for backend)</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="skuOption"
                value="manual"
                checked={skuOption === 'manual'}
                onChange={() => setSkuOption('manual')}
                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enter SKU manually</span>
            </label>
          </div>
          
          {/* Manual SKU Input */}
          {skuOption === 'manual' && (
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={newProduct.sku}
              onChange={(e) => {
                setNewProduct({...newProduct, sku: e.target.value});
                setErrorMessage('');
              }}
              placeholder="Enter custom SKU"
            />
          )}
          
          {/* Blank SKU Info */}
          {skuOption === 'blank' && (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
              SKU will be automatically generated by the backend
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            {skuOption === 'blank' 
              ? 'Leave SKU empty - backend will auto-generate a unique SKU' 
              : 'Enter a custom SKU for this product'}
          </p>
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

      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              className="border border-gray-300 rounded-md cursor-pointer"
              value={newProduct.color || '#000000'}
              onChange={(e) => setNewProduct({...newProduct, color: e.target.value})}
            />
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Color name (optional)"
              value={newProduct.color || ''}
              onChange={(e) => setNewProduct({...newProduct, color: e.target.value})}
            />
          </div>
          
          {/* Color Tools Row - ICONS UPDATED HERE */}
          <div className="flex items-center space-x-2 mt-2">
            <button
              type="button"
              onClick={activateEyedropper}
              disabled={isPickingColor}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPickingColor ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Picking...</span>
                </>
              ) : (
                <>
                  {/* ✅ UPDATED: Using Pipette icon */}
                  <Pipette className="w-4 h-4" />
                  <span>Pick Color</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={copyColorToClipboard}
              disabled={!newProduct.color}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copySuccess === 'Copied!' ? (
                <>
                  {/* ✅ UPDATED: Using Check icon */}
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  {/* ✅ UPDATED: Using Copy icon */}
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
            
            {typeof window !== 'undefined' && !window.EyeDropper && (
              <span className="text-xs text-amber-600">
                Eye Dropper: Chrome 95+, Edge 96+, Opera 81+
              </span>
            )}
          </div>
          
          {/* Quick Color Grid */}
          {/*<div className="mt-3">
            <p className="text-xs text-gray-600 mb-2">Quick colors:</p>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  className="w-8 h-8 rounded-md border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => setNewProduct({...newProduct, color: color})}
                  title={color}
                />
              ))}
            </div>
          </div>*/}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
          <div className="flex flex-row gap-2">
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

          {selectedSizeParent && selectedSizeParent !== 'Custom' && (
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
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

          {showCustomInput && (
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
              placeholder="Enter custom size"
              value={newProduct.size || ''}
              onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
            />
          )}

          {!selectedSizeParent && (
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
              placeholder="Enter custom size"
              value={newProduct.size || ''}
              onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
            />
          )}
          </div>
        </div>
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
