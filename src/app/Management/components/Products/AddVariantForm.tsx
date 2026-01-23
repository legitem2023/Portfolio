"use client";
import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_VARIANT_MUTATION, UPDATE_VARIANT_MUTATION, DELETE_VARIANT } from '../../../components/graphql/mutation';
// ✅ CORRECTED LUCIDE-REACT IMPORTS
import { Pipette, Copy, Check, Edit, Trash2 } from 'lucide-react';

interface AddVariantFormProps {
  productId: string;
  refetch: any;
  onSuccess: () => void;
  onCancel: () => void;
  editingVariant?: any;
  setEditingVariant?: (variant: any) => void;
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

export default function AddVariantForm({ 
  productId, 
  refetch, 
  onSuccess, 
  onCancel, 
  editingVariant,
  setEditingVariant 
}: AddVariantFormProps) {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const [createVariant, { loading: creating }] = useMutation(CREATE_VARIANT_MUTATION, {
    refetchQueries: ['GetProducts']
  });

  const [updateVariant, { loading: updating }] = useMutation(UPDATE_VARIANT_MUTATION, {
    refetchQueries: ['GetProducts']
  });

  const [deleteVariant] = useMutation(DELETE_VARIANT, {
    refetchQueries: ['GetProducts']
  });

  const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const colorOptions = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', 
    '#A52A2A', '#808080', '#FFC0CB', '#008000', '#000080',
    '#FF4500', '#32CD32', '#8A2BE2', '#FF69B4', '#DAA520'
  ];

  useEffect(() => {
    if (editingVariant) {
      setFormData({
        name: editingVariant.name || '',
        sku: editingVariant.sku || '',
        color: editingVariant.color || '',
        size: editingVariant.size || '',
        price: editingVariant.price?.toString() || '',
        salePrice: editingVariant.salePrice?.toString() || '',
        stock: editingVariant.stock?.toString() || ''
      });
      
      // Auto-detect size category
      const detectedParent = sizeData.find(category => 
        category.values.includes(editingVariant.size)
      )?.parent || '';
      
      setSelectedSizeParent(detectedParent);
      setShowCustomInput(!detectedParent && editingVariant.size !== '');
    }
  }, [editingVariant]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

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
      if (editingVariant) {
        // Update existing variant
        const { data } = await updateVariant({ 
          variables: { 
            id: editingVariant.id,
            input 
          } 
        });
        
        if (data?.updateVariant?.id) {
          setSuccessMessage('Variant updated successfully!');
          resetForm();
          if (setEditingVariant) setEditingVariant(null);
          refetch();
          onSuccess();
        }
      } else {
        // Create new variant
        const { data } = await createVariant({ variables: { input } });
        
        if (data?.createVariant?.id) {
          setSuccessMessage('Variant created successfully!');
          resetForm();
          refetch();
          onSuccess();
        }
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving variant:', err);
      
      if (err.message.includes('duplicate') || err.message.includes('already exists')) {
        setErrorMessage('This variant already exists. Please check the SKU or variant name.');
      } else if (err.message.includes('unique constraint')) {
        setErrorMessage('A variant with this SKU already exists.');
      } else if (err.networkError) {
        setErrorMessage('Network error. Please check your connection.');
      } else {
        setErrorMessage(`Error: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingVariant || !window.confirm('Are you sure you want to delete this variant?')) return;

    try {
      await deleteVariant({ variables: { id: editingVariant.id } });
      setSuccessMessage('Variant deleted successfully!');
      resetForm();
      if (setEditingVariant) setEditingVariant(null);
      refetch();
      onSuccess();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(`Error deleting variant: ${err.message}`);
    }
  };

  const resetForm = () => {
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
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage('');
  };

  const loading = creating || updating || isSubmitting;

  return (
    <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {editingVariant ? 'Edit Variant' : 'Add New Variant'}
        </h3>
        {editingVariant && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete
            </button>
          </div>
        )}
      </div>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Variant name"
              />
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1.5">
                SKU
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="SKU-001"
              />
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1.5">
                Stock *
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                required
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1.5">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-1.5">
                Sale Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="salePrice"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Color Section */}
        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Color
          </label>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="color"
                className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer shadow-sm"
                value={formData.color || '#000000'}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
              />
              <input
                type="text"
                id="color"
                name="color"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="#000000 or color name"
                value={formData.color || ''}
                onChange={handleChange}
              />
            </div>
            
            {/* Color Tools */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={activateEyedropper}
                disabled={isPickingColor}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPickingColor ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Picking...</span>
                  </>
                ) : (
                  <>
                    <Pipette className="w-4 h-4 mr-2" />
                    <span>Pick Color</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={copyColorToClipboard}
                disabled={!formData.color}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {copySuccess === 'Copied!' ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              
              {typeof window !== 'undefined' && !window.EyeDropper && (
                <span className="text-xs text-amber-600 px-2 py-1 bg-amber-50 rounded">
                  Eye Dropper: Chrome 95+, Edge 96+, Opera 81+
                </span>
              )}
            </div>
            
            {/* Quick Colors */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Quick colors:</p>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    className="w-10 h-10 rounded-md border border-gray-300 hover:scale-105 hover:shadow-md transition-all duration-200"
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({...formData, color: color})}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Size Section */}
        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Size
          </label>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Size Category</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
            </div>

            {selectedSizeParent && selectedSizeParent !== 'Custom' && (
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Select {selectedSizeParent}
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  value={formData.size || ''}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
                >
                  <option value="">Select a size</option>
                  {sizeData
                    .find(cat => cat.parent === selectedSizeParent)
                    ?.values.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                </select>
              </div>
            )}

            {(showCustomInput || (!selectedSizeParent && formData.size === 'Custom')) && (
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Custom Size
                </label>
                <input
                  type="text"
                  id="size"
                  name="size"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter custom size"
                  value={formData.size || ''}
                  onChange={handleChange}
                />
              </div>
            )}

            {!selectedSizeParent && !showCustomInput && formData.size !== 'Custom' && (
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Common Sizes
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  value={formData.size || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({...formData, size: value});
                    if (value === 'Custom') {
                      setShowCustomInput(true);
                    }
                  }}
                >
                  <option value="">Select size</option>
                  {commonSizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                  <option value="Custom">Custom Size</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-base flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {editingVariant ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              editingVariant ? 'Update Variant' : 'Create Variant'
            )}
          </button>
          
          <button
            type="button"
            onClick={() => {
              resetForm();
              if (setEditingVariant) setEditingVariant(null);
              onCancel();
            }}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium text-base"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
          }
