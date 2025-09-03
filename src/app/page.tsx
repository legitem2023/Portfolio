// pages/index.tsx (or wherever you want to use the component)
import React from 'react';
import DeluxeNavTabs from './components/DeluxeNavTabs';

const EcommercePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">LUXE SHOP</h1>
        <p className="text-gray-600">Premium E-commerce Experience</p>
      </div>
      <DeluxeNavTabs />
      
      {/* Additional content can go here */}
      <footer className="text-center mt-16 text-gray-500 text-sm">
        <p>© 2023 Luxe Shop. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default EcommercePage;
