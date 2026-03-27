// components/Sidebar.tsx
'use client';

import {
  LayoutDashboard,
  Users,
  Package,
  FolderOpen,
  ShoppingCart,
  DollarSign,
  FileText,
  HeadphonesIcon,
  Truck,
  BanknoteArrowUp
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen = false, onClose }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderOpen },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'remit', label: 'Remittance',icon: BanknoteArrowUp },
    { id: 'sales', label: 'Sales', icon: DollarSign },
    { id: 'bills', label: 'Bills', icon: FileText },
    { id: 'support', label: 'Support Tickets', icon: HeadphonesIcon },
    { id: 'vehicle', label: 'Vehicle', icon: Truck }
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`   
        fixed inset-y-0 left-0 z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:fixed md:translate-x-0
        md:flex md:w-64 md:flex-col
      `}>
        <div className="flex flex-col flex-grow bg-gray-800 overflow-y-auto h-full">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
            <div className="text-lg font-semibold text-white">Menu</div>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-grow flex flex-col">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`${
                      activeTab === item.id 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors duration-200`}
                  >
                    <Icon 
                      className={`${
                        activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'
                      } mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200`} 
                    />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
