"use client";
import { useMutation } from "@apollo/client";
import { INSERTPRODUCT } from "../../components/graphql/mutation";
import { NewProduct, category } from '../../../../types';
import { useState, useEffect } from 'react';

interface ProductFormProps {
  supplierId: String;
  newProduct: NewProduct;
  setNewProduct: (product: NewProduct) => void;
  categories: category[];
  onProductAdded: () => void;
}

// Size data structure
const sizeOptions = [
  {
    parent: "Alpha",
    values: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"],
    description: "Standard letter sizes"
  },
  {
    parent: "Numeric",
    values: ["0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20"],
    description: "US women's clothing sizes"
  },
  {
    parent: "Shoes (US)",
    values: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12", "13"],
    description: "US shoe sizes"
  },
  {
    parent: "Shoes (EU)",
    values: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
    description: "European shoe sizes"
  },
  {
    parent: "Men's Pants",
    values: ["28", "30", "32", "34", "36", "38", "40", "42", "44"],
    description: "Waist size in inches"
  },
  {
    parent: "Bra (Band)",
    values: ["30", "32", "34", "36", "38", "40", "42", "44"],
    description: "Bra band size"
  },
  {
    parent: "Bra (Cup)",
    values: ["A", "B", "C", "D", "DD", "DDD", "E", "F", "G"],
    description: "Bra cup size"
  },
  {
    parent: "Kid's",
    values: ["2T", "3T", "4T", "5", "6", "7", "8", "10", "12", "14"],
    description: "Children's clothing sizes"
  },
  {
    parent: "Baby",
    values: ["Newborn", "0-3M", "3-6M", "6-9M", "9-12M", "12-18M", "18-24M"],
    description: "Infant clothing sizes"
  },
  {
    parent: "Headwear",
    values: ["S", "M", "L", "XL"],
    description: "Hat sizes"
  },
  {
    parent: "Gloves",
    values: ["XS", "S", "M", "L", "XL"],
    description: "Glove sizes"
  },
  {
    parent: "Jewelry",
    values: ["4", "5", "6", "7", "8", "9", "10", "11", "12"],
    description: "US ring sizes"
  },
  {
    parent: "Dimensions",
    values: ["10x10cm", "15x15cm", "20x20cm", "30x30cm", "50x50cm", "100x100cm"],
    description: "Common dimension sizes"
  },
  {
    parent: "Generic",
    values: ["Small", "Medium", "Large", "Extra Large"],
    description: "Generic size options"
  },
  {
    parent: "One Size",
    values: ["One Size Fits All"],
    description: "Single size option"
  },
  {
    parent: "Custom",
    values: [],
    description: "Custom size input",
    customInput: true
  }
];

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
  const [selectedSizeCategory, setSelectedSizeCategory] = useState('');
  const [selectedSizeValue, setSelectedSizeValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState('');

  // Get the selected size category object
  const selectedCategory = sizeOptions.find(cat => cat.parent === selectedSizeCategory);
  
  // Initialize size from newProduct if it exists
  useEffect(() => {
    if (newProduct.size) {
      // Check if the size matches any predefined value
      const foundCategory = sizeOptions.find(cat => 
        cat.values.includes(newProduct.size) || 
        (cat.customInput && newProduct.size !== '')
      );
      
      if (foundCategory) {
        if (foundCategory.customInput) {
          setSelectedSizeCategory('Custom');
          setCustomSizeInput(newProduct.size);
          setShowCustomInput(true);
        } else {
          setSelectedSizeCategory(foundCategory.parent);
          setSelectedSizeValue(newProduct.size);
        }
      } else {
        // If not found, treat as custom
        setSelectedSizeCategory('Custom');
        setCustomSizeInput(newProduct.size);
        setShowCustomInput(true);
      }
    }
  }, [newProduct.size]);

  // Handle size category change
  const handleSizeCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setSelectedSizeCategory(category);
    setSelectedSizeValue('');
    setCustomSizeInput('');
    
    const selectedCat = sizeOptions.find(cat => cat.parent === category);
    
    if (selectedCat?.customInput) {
      setShowCustomInput(true);
      // Update product size when custom category is selected
      setNewProduct({...newProduct, size: customSizeInput});
    } else {
      setShowCustomInput(false);
      // Clear product size when switching categories
      setNewProduct({...newProduct, size: ''});
    }
  };

  // Handle size value change
  const handleSizeValueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSizeValue(value);
    // Update product size
    setNewProduct({...newProduct, size: value});
  };

  // Handle custom size input change
  const handleCustomSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomSizeInput(value);
    // Update product size
    setNewProduct({...newProduct, size: value});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Validate size selection if needed
    if (selectedSizeCategory && !selectedSizeValue && !showCustomInput && selectedCategory?.values.length > 0) {
      setErrorMessage('Please select a specific size from the selected category.');
      return;
    }
    
    if (selectedSizeCategory === 'Custom' && !customSizeInput.trim()) {
      setErrorMessage('Please enter a custom size.');
      return;
    }
    
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
        
        // Reset form including size selection
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
        
        setSelectedSizeCategory('');
        setSelectedSizeValue('');
        setShowCustomInput(false);
        setCustomSizeInput('');
        
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

  return (
    <form onSubmit={handleSubmit}>
      {/* Error and success messages */}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
          
          {/* Size Category Selector */}
          <div className="mb-2">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
              value={selectedSizeCategory}
              onChange={handleSizeCategoryChange}
            >
              <option value="">Select size category</option>
              {sizeOptions.map(category => (
                <option key={category.parent} value={category.parent}>
                  {category.parent} - {category.description}
                </option>
              ))}
            </select>
          </div>

          {/* Size Value Selector (for non-custom categories) */}
          {selectedCategory && !selectedCategory.customInput && selectedCategory.values.length > 0 && (
            <div className="mb-2">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedSizeValue}
                onChange={handleSizeValueChange}
              >
                <option value="">Select a size</option>
                {selectedCategory.values.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Size Input */}
          {showCustomInput && (
            <div className="mb-2">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter custom size (e.g., 15x15cm, 10.5, Custom Fit)"
                value={customSizeInput}
                onChange={handleCustomSizeChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter any custom size measurement
              </p>
            </div>
          )}

          {/* Current Size Display */}
          {newProduct.size && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Selected Size:</span> {newProduct.size}
                {selectedSizeCategory && ` (${selectedSizeCategory})`}
              </p>
            </div>
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
