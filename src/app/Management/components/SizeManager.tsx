'use client';

import { useState, useEffect } from 'react';
import initialSizeData from './Json/sizes.json';

// Define types
interface SizeCategory {
    parent: string;
    values: string[];
}

interface EditingValue {
    parent: string;
    value: string;
}

export default function SizeManager() {
    const [sizeData, setSizeData] = useState<SizeCategory[]>([]);
    const [editingParent, setEditingParent] = useState<string | null>(null);
    const [editParentName, setEditParentName] = useState('');
    const [editingValue, setEditingValue] = useState<EditingValue | null>(null);
    const [editValueText, setEditValueText] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newValue, setNewValue] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile on mount and window resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const savedData = localStorage.getItem('sizeData');
        if (savedData) {
            setSizeData(JSON.parse(savedData));
        } else {
            setSizeData(initialSizeData as SizeCategory[]);
            saveToLocalStorage(initialSizeData as SizeCategory[]);
        }
    };

    const saveToLocalStorage = (data: SizeCategory[]) => {
        localStorage.setItem('sizeData', JSON.stringify(data));
    };

    const saveToJsonFile = (data: SizeCategory[]) => {
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', 'sizes.json');
        linkElement.click();
    };

    const updateData = (newData: SizeCategory[], saveToFile = false) => {
        setSizeData(newData);
        saveToLocalStorage(newData);

        if (saveToFile) {
            saveToJsonFile(newData);
            setMessage('Data saved to JSON file!');
        } else {
            setMessage('Data saved!');
        }

        setTimeout(() => setMessage(''), 3000);
    };

    const addCategory = () => {
        if (newCategoryName.trim() && !sizeData.find(item => item.parent === newCategoryName.trim())) {
            const newCategory: SizeCategory = { parent: newCategoryName.trim(), values: [] };
            const updatedData = [...sizeData, newCategory];
            updateData(updatedData);
            setNewCategoryName('');
        }
    };

    const deleteCategory = (parentName: string) => {
        if (confirm(`Are you sure you want to delete "${parentName}" category?`)) {
            const updatedData = sizeData.filter(item => item.parent !== parentName);
            updateData(updatedData);
        }
    };

    const startEditCategory = (parent: string) => {
        setEditingParent(parent);
        setEditParentName(parent);
    };

    const saveEditCategory = () => {
        if (editParentName.trim() && !sizeData.find(item => item.parent === editParentName.trim() && item.parent !== editingParent)) {
            const updatedData = sizeData.map(item =>
                item.parent === editingParent ? { ...item, parent: editParentName.trim() } : item
            );
            updateData(updatedData);
            setEditingParent(null);
            setEditParentName('');
        }
    };

    const addValue = (parentName: string) => {
        if (newValue.trim()) {
            const updatedData = sizeData.map(item =>
                item.parent === parentName
                    ? { ...item, values: [...item.values, newValue.trim()] }
                    : item
            );
            updateData(updatedData);
            setNewValue('');
            setSelectedCategory(null);
        }
    };

    const deleteValue = (parentName: string, valueToDelete: string) => {
        if (confirm(`Delete "${valueToDelete}"?`)) {
            const updatedData = sizeData.map(item =>
                item.parent === parentName
                    ? { ...item, values: item.values.filter(v => v !== valueToDelete) }
                    : item
            );
            updateData(updatedData);
        }
    };

    const startEditValue = (parentName: string, value: string) => {
        setEditingValue({ parent: parentName, value });
        setEditValueText(value);
    };

    const saveEditValue = () => {
        if (editValueText.trim() && editingValue) {
            const updatedData = sizeData.map(item =>
                item.parent === editingValue.parent
                    ? { ...item, values: item.values.map(v => v === editingValue.value ? editValueText.trim() : v) }
                    : item
            );
            updateData(updatedData);
            setEditingValue(null);
            setEditValueText('');
        }
    };

    const exportToJson = () => {
        saveToJsonFile(sizeData);
        setMessage('JSON file downloaded!');
        setTimeout(() => setMessage(''), 3000);
    };

    const resetToDefault = () => {
        if (confirm('Reset to default data? All changes will be lost.')) {
            setSizeData(initialSizeData as SizeCategory[]);
            saveToLocalStorage(initialSizeData as SizeCategory[]);
            setMessage('Reset to default data!');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile-optimized container */}
            <div className="px-4 py-4 md:px-8 md:py-6 max-w-7xl mx-auto">
                {/* Header - Stack on mobile, row on desktop */}
                <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Size Manager</h1>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={exportToJson}
                            className="bg-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-green-600 transition-colors text-sm md:text-base font-medium"
                        >
                            Export to JSON
                        </button>
                        <button
                            onClick={resetToDefault}
                            className="bg-yellow-500 text-white px-4 py-2.5 rounded-lg hover:bg-yellow-600 transition-colors text-sm md:text-base font-medium"
                        >
                            Reset to Default
                        </button>
                    </div>
                </div>

                {/* Message Toast - Mobile friendly */}
                {message && (
                    <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg shadow-md text-sm md:text-base animate-fade-in">
                        {message}
                    </div>
                )}

                {/* Add New Category Section - Full width on mobile */}
                <div className="mb-6 md:mb-8 p-4 md:p-5 bg-white rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg md:text-xl font-semibold mb-3 text-gray-900">Add New Category</h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Category name"
                            className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                            onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                        />
                        <button
                            onClick={addCategory}
                            className="bg-blue-500 text-white px-5 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm md:text-base"
                        >
                            Add Category
                        </button>
                    </div>
                </div>

                {/* Categories List - Mobile optimized cards */}
                <div className="space-y-4 md:space-y-6">
                    {sizeData.map((category) => (
                        <div key={category.parent} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Category Header - Touch friendly */}
                            <div className="p-4 md:p-5 bg-gray-50 border-b border-gray-200">
                                {editingParent === category.parent ? (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            value={editParentName}
                                            onChange={(e) => setEditParentName(e.target.value)}
                                            className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-900 text-base"
                                            autoFocus
                                            onKeyPress={(e) => e.key === 'Enter' && saveEditCategory()}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={saveEditCategory}
                                                className="flex-1 bg-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-green-600 text-sm font-medium"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingParent(null)}
                                                className="flex-1 bg-gray-500 text-white px-4 py-2.5 rounded-lg hover:bg-gray-600 text-sm font-medium"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                        <h2 className="text-lg md:text-xl font-semibold text-gray-900 break-words">
                                            {category.parent}
                                        </h2>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEditCategory(category.parent)}
                                                className="text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium touch-manipulation"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteCategory(category.parent)}
                                                className="text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium touch-manipulation"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Values List - Wrap on mobile, touch targets large enough */}
                            <div className="p-4 md:p-5">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {category.values.map((value) => (
                                        <div key={value} className="flex items-center gap-1 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                                            {editingValue?.parent === category.parent && editingValue?.value === value ? (
                                                <div className="flex flex-col sm:flex-row gap-2 p-2">
                                                    <input
                                                        type="text"
                                                        value={editValueText}
                                                        onChange={(e) => setEditValueText(e.target.value)}
                                                        className="w-full sm:w-40 p-2 border border-gray-300 rounded text-gray-900 text-sm"
                                                        autoFocus
                                                        onKeyPress={(e) => e.key === 'Enter' && saveEditValue()}
                                                    />
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={saveEditValue}
                                                            className="bg-green-500 text-white px-3 py-1.5 rounded text-sm"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingValue(null)}
                                                            className="bg-gray-500 text-white px-3 py-1.5 rounded text-sm"
                                                        >
                                                            ✗
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="px-3 py-2 text-gray-900 text-sm md:text-base">
                                                        {value}
                                                    </span>
                                                    <button
                                                        onClick={() => startEditValue(category.parent, value)}
                                                        className="text-blue-600 hover:text-blue-700 px-2 py-2 text-base touch-manipulation"
                                                        aria-label="Edit"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        onClick={() => deleteValue(category.parent, value)}
                                                        className="text-red-600 hover:text-red-700 px-2 py-2 text-xl touch-manipulation"
                                                        aria-label="Delete"
                                                    >
                                                        ×
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Add New Value - Mobile friendly */}
                                {selectedCategory === category.parent ? (
                                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                                        <input
                                            type="text"
                                            value={newValue}
                                            onChange={(e) => setNewValue(e.target.value)}
                                            placeholder="New value"
                                            className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-900 text-base"
                                            autoFocus
                                            onKeyPress={(e) => e.key === 'Enter' && addValue(category.parent)}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => addValue(category.parent)}
                                                className="flex-1 bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
                                            >
                                                Add
                                            </button>
                                            <button
                                                onClick={() => setSelectedCategory(null)}
                                                className="flex-1 bg-gray-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setSelectedCategory(category.parent)}
                                        className="w-full sm:w-auto text-blue-600 hover:text-blue-700 text-sm md:text-base font-medium py-3 px-4 bg-blue-50 rounded-lg touch-manipulation transition-colors"
                                    >
                                        + Add New Value
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty state */}
                {sizeData.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <p className="text-gray-500 text-base">No categories yet. Add your first category above!</p>
                    </div>
                )}
            </div>

            {/* Add custom CSS for animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
                .touch-manipulation {
                    touch-action: manipulation;
                }
            `}</style>
        </div>
    );
}
