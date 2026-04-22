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
  Message,
  BanknoteArrowUp
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth'; // Import the useAuth hook
import { useDispatch, useSelector } from 'react-redux';
import { setActiveIndex } from '../../../../Redux/activeIndexSlice';

interface SidebarProps {
  activeTab: number;
  setActiveTab: (tabId: number) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen = false, onClose }: SidebarProps) {
  // Get user and loading state from useAuth hook
  const { user, loading: authLoading } = useAuth();
  const dispatch = useDispatch();
  // Define which roles can access each nav item
  const navItems = [
    { id: 0, label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMINISTRATOR', 'MANAGER'] },
    { id: 1, label: 'Users', icon: Users, roles: ['ADMINISTRATOR'] },
    { id: 2, label: 'Products', icon: Package, roles: ['ADMINISTRATOR', 'MANAGER'] },
    { id: 3, label: 'Categories', icon: FolderOpen, roles: ['ADMINISTRATOR'] }, // Admin only
    { id: 4, label: 'Orders', icon: ShoppingCart, roles: ['ADMINISTRATOR', 'MANAGER'] },
    { id: 5, label: 'Remittance', icon: BanknoteArrowUp, roles: ['ADMINISTRATOR', 'MANAGER'] },
    { id: 6, label: 'Sales', icon: DollarSign, roles: ['ADMINISTRATOR', 'MANAGER'] },
    { id: 7, label: 'Bills', icon: FileText, roles: ['ADMINISTRATOR'] }, // Admin only
    { id: 8, label: 'Support Tickets', icon: HeadphonesIcon, roles: ['ADMINISTRATOR', 'MANAGER'] },
    { id: 9, label: 'Vehicle', icon: Truck, roles: ['ADMINISTRATOR'] }, // Admin only
    { id: 12, label: 'Messages', icon: Message, roles: ['ADMINISTRATOR','MANAGER'] } // Admin only

  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role || 'MANAGER') // Default to MANAGER if no role
  );

  const handleTabClick = (tabId:number) => {   
    setActiveTab(tabId);
    if (onClose) {
      onClose();
    }
  };

  // Show loading state or nothing while auth is loading
  if (authLoading) {
    return null; // Or return a loading skeleton
  }

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
              {filteredNavItems.map((item) => {
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
