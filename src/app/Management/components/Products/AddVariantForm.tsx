"use client";
import { useState, useRef } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_VARIANT_MUTATION } from '../../../components/graphql/mutation';
// ✅ CORRECTED LUCIDE-REACT IMPORTS
import { Pipette, Copy, Check } from 'lucide-react';

interface AddVariantFormProps {
  productId: string;
  refetch: any;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  sku: string;
  color: string;
  size: string;
  price: string;
  salePrice: string;
  stock: string;
}

declare global {
  interface Window {
    EyeDropper: any;
  }
}

export default function AddVariantForm({ productId, refetch, onSuccess, onCancel }: AddVariantFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    sku: '',
    color: '',
    size: '',
    price: '',
    salePrice: '',
    stock: ''
  });

  const [selectedSizeParent, setSelectedSizeParent] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const colorInputRef = useRef<HTMLInputElement>(null);

  const sizeData = [
    // Clothing & Apparel
    { parent: "Letter Sizes", values: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"] },
    { parent: "Numeric Sizes", values: ["0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20"] },
    { parent: "US Shoes", values: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12", "13"] },
    { parent: "EU Shoes", values: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"] },
    { parent: "Men's Waist", values: ["28", "30", "32", "34", "36", "38", "40", "42", "44"] },
    { parent: "Bra Sizes", values: ["30A", "32A", "34A", "36A", "38A", "30B", "32B", "34B", "36B", "38B", "30C", "32C", "34C", "36C", "38C"] },
    { parent: "Kids Sizes", values: ["2T", "3T", "4T", "5", "6", "7", "8", "10", "12", "14"] },
    { parent: "Baby Sizes", values: ["Newborn", "0-3M", "3-6M", "6-9M", "9-12M", "12-18M", "18-24M"] },
    
    // Electronics - Mobile Phones
    { parent: "Phone Screen", values: ["5.0\"", "5.5\"", "6.0\"", "6.1\"", "6.3\"", "6.5\"", "6.7\"", "6.8\"", "7.0\""] },
    { parent: "Phone Storage", values: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
    { parent: "Phone RAM", values: ["4GB", "6GB", "8GB", "12GB", "16GB"] },
    
    // Electronics - Laptops
    { parent: "Laptop Screen", values: ["11.6\"", "13.3\"", "14\"", "15.6\"", "16\"", "17.3\""] },
    { parent: "Laptop Storage", values: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD", "256GB HDD", "512GB HDD", "1TB HDD", "2TB HDD"] },
    { parent: "Laptop RAM", values: ["4GB", "8GB", "16GB", "32GB", "64GB"] },
    { parent: "Laptop Processor", values: ["i3", "i5", "i7", "i9", "Ryzen 3", "Ryzen 5", "Ryzen 7", "Ryzen 9", "M1", "M2", "M3"] },
    
    // Electronics - Tablets
    { parent: "Tablet Screen", values: ["7.9\"", "8.3\"", "9.7\"", "10.2\"", "10.5\"", "10.9\"", "11\"", "12.9\""] },
    { parent: "Tablet Storage", values: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] },
    
    // Electronics - Monitors
    { parent: "Monitor Size", values: ["19\"", "21.5\"", "24\"", "27\"", "32\"", "34\"", "38\"", "43\"", "49\""] },
    { parent: "Monitor Resolution", values: ["HD (1366x768)", "Full HD (1920x1080)", "2K (2560x1440)", "4K (3840x2160)", "UltraWide (3440x1440)", "5K (5120x2880)"] },
    { parent: "Refresh Rate", values: ["60Hz", "75Hz", "120Hz", "144Hz", "165Hz", "240Hz", "360Hz"] },
    
    // Electronics - TVs
    { parent: "TV Size", values: ["32\"", "40\"", "43\"", "50\"", "55\"", "65\"", "75\"", "85\"", "98\""] },
    { parent: "TV Resolution", values: ["HD", "Full HD", "4K UHD", "8K UHD"] },
    
    // Electronics - Smartwatches
    { parent: "Watch Size", values: ["38mm", "40mm", "41mm", "42mm", "44mm", "45mm", "46mm", "47mm"] },
    { parent: "Watch Band", values: ["S", "M", "L", "XS", "XL"] },
    
    // Universal
    { parent: "One Size", values: ["One Size Fits All"] },
    { parent: "Custom", values: [] }
  ];

  const [createVariant, { loading, error }] = useMutation(CREATE_VARIANT_MUTATION, {
    refetchQueries: ['GetProducts']
  });

  const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const colorOptions = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', 
    '#A52A2A', '#808080', '#FFC0CB', '#008000', '#000080',
    '#FF4500', '#32CD32', '#8A2BE2', '#FF69B4', '#DAA520'
  ];

  const copyColorToClipboard = async () => {
    if (formData.color) {
      try {
        await navigator.clipboard.writeText(formData.color);
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
      setFormData({...formData, color: result.sRGBHex});
      setShowColorPicker(false);
    } catch (err) {
      console.log('Color selection cancelled:', err);
    } finally {
      setIsPickingColor(false);
    }
  };

  const handleColorChange = (color: string) => {
    setFormData({...formData, color});
    setShowColorPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const input = {
      name: formData.name,
      productId,
      sku: formData.sku || undefined,
      color: formData.color || undefined,
      size: formData.size || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
      stock: parseInt(formData.stock) || 0
    };

    try {
      const { data } = await createVariant({ variables: { input } });
      
      if (data?.createVariant?.id) {
        setSuccessMessage('Variant created successfully!');
        
        setFormData({
          name: '',
          sku: '',
          color: '',
          size: '',
          price: '',
          salePrice: '',
          stock: ''
        });
        
        setSelectedSizeParent('');
        setShowCustomInput(false);
        setShowColorPicker(false);
        setCopySuccess('');
        setIsPickingColor(false);
        
        refetch();
        onSuccess();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to create variant');
      }
    } catch (err: any) {
      console.error('Error creating variant:', err);
      
      if (err.message.includes('duplicate') || err.message.includes('already exists')) {
        setErrorMessage('This variant already exists. Please check the SKU or variant name.');
      } else if (err.message.includes('unique constraint')) {
        setErrorMessage('A variant with this SKU already exists.');
      } else if (err.networkError) {
        setErrorMessage('Network error. Please check your connection.');
      } else {
        setErrorMessage(`Error: ${err.message}`);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage('');
  };

  return (
    <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Add New Variant</h3>
      
      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 text-sm rounded">
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

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Variant name"
            />
          </div>

          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
              SKU
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="SKU code"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700">
              Color
            </label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="border border-gray-300 rounded-md cursor-pointer h-10"
                value={formData.color || '#000000'}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
              />
              <input
                type="text"
                id="color"
                name="color"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Color name or hex"
                value={formData.color || ''}
                onChange={handleChange}
              />
            </div>
            
            {/* Color Tools Row */}
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
                    <Pipette className="w-4 h-4" />
                    <span>Pick Color</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={copyColorToClipboard}
                disabled={!formData.color}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copySuccess === 'Copied!' ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
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
            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-2">Quick colors:</p>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded-md border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({...formData, color: color})}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="size" className="block text-sm font-medium text-gray-700">
              Size
            </label>
            <div className="flex flex-col gap-2 mt-1">
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={selectedSizeParent}
                onChange={(e) => {
                  const parent = e.target.value;
                  setSelectedSizeParent(parent);
                  setShowCustomInput(parent === 'Custom');
                  if (parent !== 'Custom') {
                    setFormData({...formData, size: ''});
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.size || ''}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
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
                  id="size"
                  name="size"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter custom size"
                  value={formData.size || ''}
                  onChange={handleChange}
                />
              )}

              {!selectedSizeParent && (
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.size || ''}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
                >
                  <option value="">Select size</option>
                  {commonSizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                  <option value="Custom">Custom</option>
                </select>
              )}
              
              {!selectedSizeParent && formData.size === 'Custom' && (
                <input
                  type="text"
                  id="size"
                  name="size"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter custom size"
                  value={formData.size || ''}
                  onChange={handleChange}
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700">
              Sale Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              id="salePrice"
              name="salePrice"
              value={formData.salePrice}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
            Stock *
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            required
            value={formData.stock}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="0"
          />
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors font-medium"
          >
            {loading ? 'Creating...' : 'Create Variant'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
            }
