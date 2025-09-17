// components/MobileMenu.tsx
import React from 'react';
import { X } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg">
        <div className="p-4 flex justify-between items-center border-b">
          <span className="font-bold">Menu</span>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 flex flex-col space-y-4">
          <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">New Arrivals</a>
          <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Collections</a>
          <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Categories</a>
          <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Brands</a>
          <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Sale</a>
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
