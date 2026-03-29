"use client";
import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_VARIANT_MUTATION, UPDATE_VARIANT_MUTATION, DELETE_VARIANT } from '../../../components/graphql/mutation';
import { Pipette, Copy, Check, Edit, Trash2, X } from 'lucide-react';

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
    { parent: "Letter Sizes", values: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"] },
    { parent: "Numeric Sizes", values: ["0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20"] },
    { parent: "US Shoes", values: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12", "13"] },
    { parent: "EU Shoes", values: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"] },
    { parent: "Men's Waist", values: ["28", "30", "32", "34", "36", "38", "40", "42", "44"] },
    { parent: "Bra Sizes", values: ["30A", "32A", "34A", "36A", "38A", "30B", "32B", "34B", "36B", "38B", "30C", "32C", "34C", "36C", "38C"] },
    { parent: "Kids Sizes", values: ["2T", "3T", "4T", "5", "6", "7", "8", "10", "12", "14"] },
    { parent: "Baby Sizes", values: ["Newborn", "0-3M", "3-6M", "6-9M", "9-12M", "12-18M", "18-24M"] },
    { parent: "Phone Screen", values: ["5.0\"", "5.5\"", "6.0\"", "6.1\"", "6.3\"", "6.5\"", "6.7\"", "6.8\"", "7.0\""] },
    { parent: "Phone Storage", values: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
    { parent: "Phone RAM", values: ["4GB", "6GB", "8GB", "12GB", "16GB"] },
    { parent: "Laptop Screen", values: ["11.6\"", "13.3\"", "14\"", "15.6\"", "16\"", "17.3\""] },
    { parent: "Laptop Storage", values: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD", "256GB HDD", "512GB HDD", "1TB HDD", "2TB HDD"] },
    { parent: "Laptop RAM", values: ["4GB", "8GB", "16GB", "32GB", "64GB"] },
    { parent: "Laptop Processor", values: ["i3", "i5", "i7", "i9", "Ryzen 3", "Ryzen 5", "Ryzen 7", "Ryzen 9", "M1", "M2", "M3"] },
    { parent: "Tablet Screen", values: ["7.9\"", "8.3\"", "9.7\"", "10.2\"", "10.5\"", "10.9\"", "11\"", "12.9\""] },
    { parent: "Tablet Storage", values: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] },
    { parent: "Monitor Size", values: ["19\"", "21.5\"", "24\"", "27\"", "32\"", "34\"", "38\"", "43\"", "49\""] },
    { parent: "Monitor Resolution", values: ["HD (1366x768)", "Full HD (1920x1080)", "2K (2560x1440)", "4K (3840x2160)", "UltraWide (3440x1440)", "5K (5120x2880)"] },
    { parent: "Refresh Rate", values: ["60Hz", "75Hz", "120Hz", "144Hz", "165Hz", "240Hz", "360Hz"] },
    { parent: "TV Size", values: ["32\"", "40\"", "43\"", "50\"", "55\"", "65\"", "75\"", "85\"", "98\""] },
    { parent: "TV Resolution", values: ["HD", "Full HD", "4K UHD", "8K UHD"] },
    { parent: "Watch Size", values: ["38mm", "40mm", "41mm", "42mm", "44mm", "45mm", "46mm", "47mm"] },
    { parent: "Watch Band", values: ["S", "M", "L", "XS", "XL"] },
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            {editingVariant ? 'Edit Variant' : 'Add New Variant'}
          </h3>
          {editingVariant && (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Variant
            </button>
          )}
        </div>
      </div>
      
      {/* Messages */}
      {errorMessage && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 sm:p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Basic Information */}
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Variant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400"
                  placeholder="e.g., Blue Cotton T-Shirt"
                />
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-semibold text-gray-700 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400"
                  placeholder="e.g., TSHIRT-BLUE-M"
                />
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  required
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* Right Column - Pricing */}
            <div className="space-y-4">
              <div>
                <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
                  Regular Price (₱)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-base">₱</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400"
                    placeholder="0.00"
                  />
                </div>
                {formData.price && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    Formatted: ₱{parseFloat(formData.price).toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="salePrice" className="block text-sm font-semibold text-gray-700 mb-2">
                  Sale Price (₱)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-base">₱</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="salePrice"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400"
                    placeholder="0.00"
                  />
                </div>
                {formData.salePrice && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    Formatted: ₱{parseFloat(formData.salePrice).toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Color Section */}
        <div className="pt-2 border-t border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Color Selection
          </label>
          <div className="space-y-4">
            {/* Color Input Group */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="color"
                className="w-14 h-14 border-2 border-gray-200 rounded-xl cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
                value={formData.color || '#000000'}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
              />
              <input
                type="text"
                id="color"
                name="color"
                className="flex-1 px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400"
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
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isPickingColor ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Picking...</span>
                  </>
                ) : (
                  <>
                    <Pipette className="w-4 h-4 mr-2" />
                    <span>Pick Color from Screen</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={copyColorToClipboard}
                disabled={!formData.color}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {copySuccess === 'Copied!' ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    <span>Copy Color Code</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Quick Colors */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Quick Colors:</p>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    className="w-10 h-10 rounded-lg border-2 border-gray-200 hover:scale-110 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        <div className="pt-2 border-t border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Size Configuration
          </label>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Size Category</label>
              <select
                className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400"
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
                  className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400"
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
                  className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400"
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
                  className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400"
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
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              resetForm();
              if (setEditingVariant) setEditingVariant(null);
              onCancel();
            }}
            className="flex-1 bg-white text-gray-700 py-3 px-6 rounded-lg border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-base"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base shadow-sm hover:shadow-md"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{editingVariant ? 'Updating...' : 'Creating...'}</span>
              </div>
            ) : (
              <span>{editingVariant ? 'Update Variant' : 'Create Variant'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
      }
