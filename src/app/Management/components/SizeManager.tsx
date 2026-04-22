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

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        // Try to load from localStorage first
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
        // This will trigger a download of the JSON file
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
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
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Size Manager</h1>
                <div className="flex gap-2">
                    <button
                        onClick={exportToJson}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        Export to JSON
                    </button>
                    <button
                        onClick={resetToDefault}
                        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                    >
                        Reset to Default
                    </button>
                </div>
            </div>

            {message && (
                <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
                    {message}
                </div>
            )}

            {/* Add New Category */}
            <div className="mb-8 p-4 bg-gray-100 rounded">
                <h2 className="text-xl font-semibold mb-3">Add New Category</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="flex-1 p-2 border rounded text-black"
                    />
                    <button
                        onClick={addCategory}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add Category
                    </button>
                </div>
            </div>

            {/* Categories List */}
            <div className="space-y-6">
                {sizeData.map((category) => (
                    <div key={category.parent} className="border rounded-lg p-4 bg-white shadow">
                        {/* Category Header */}
                        <div className="flex justify-between items-center mb-3">
                            {editingParent === category.parent ? (
                                <div className="flex gap-2 flex-1">
                                    <input
                                        type="text"
                                        value={editParentName}
                                        onChange={(e) => setEditParentName(e.target.value)}
                                        className="flex-1 p-1 border rounded text-black"
                                        autoFocus
                                    />
                                    <button
                                        onClick={saveEditCategory}
                                        className="bg-green-500 text-white px-3 py-1 rounded"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingParent(null)}
                                        className="bg-gray-500 text-white px-3 py-1 rounded"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-xl font-semibold text-black">{category.parent}</h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEditCategory(category.parent)}
                                            className="text-blue-500 hover:text-blue-700"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteCategory(category.parent)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Values List */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {category.values.map((value) => (
                                <div key={value} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded">
                                    {editingValue?.parent === category.parent && editingValue?.value === value ? (
                                        <div className="flex gap-1">
                                            <input
                                                type="text"
                                                value={editValueText}
                                                onChange={(e) => setEditValueText(e.target.value)}
                                                className="w-32 p-1 border rounded text-sm text-black"
                                                autoFocus
                                            />
                                            <button
                                                onClick={saveEditValue}
                                                className="bg-green-500 text-white px-2 py-0.5 rounded text-xs"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                onClick={() => setEditingValue(null)}
                                                className="bg-gray-500 text-white px-2 py-0.5 rounded text-xs"
                                            >
                                                ✗
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-black">{value}</span>
                                            <button
                                                onClick={() => startEditValue(category.parent, value)}
                                                className="text-blue-500 hover:text-blue-700 ml-2 text-sm"
                                            >
                                                ✎
                                            </button>
                                            <button
                                                onClick={() => deleteValue(category.parent, value)}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                ×
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add New Value */}
                        {selectedCategory === category.parent ? (
                            <div className="flex gap-2 mt-2">
                                <input
                                    type="text"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    placeholder="New value"
                                    className="flex-1 p-2 border rounded text-sm text-black"
                                    autoFocus
                                />
                                <button
                                    onClick={() => addValue(category.parent)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setSelectedCategory(category.parent)}
                                className="text-blue-500 hover:text-blue-700 text-sm mt-2"
                            >
                                + Add Value
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
                                    }
