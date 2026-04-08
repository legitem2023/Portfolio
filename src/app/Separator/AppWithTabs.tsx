'use client'
import React, { useState } from 'react';
import VectorizeBlurredImage from './VectorizeBlurredImage';
import SimpleSilkscreenSeparator from './SimpleSilkscreenSeparator';
import SilkScreenColorSeparatorCMYK from './SilkScreenColorSeparatorCMYK';
interface Tab {
  id: string;
  label: string;
  icon?: string;
  component: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultActiveTab?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, defaultActiveTab }) => {
  const [activeTab, setActiveTab] = useState<string>(defaultActiveTab || tabs[0]?.id || '');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                transition-colors duration-200
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon && <span className="text-lg">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="mt-6">
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

// Usage example
const AppWithTabs: React.FC = () => {
  // Placeholder for your other component
  const OtherComponent = () => (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Your Other Component</h2>
      <p className="text-gray-600">This is where youll add your second component.</p>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-800">✨ Add your component logic here</p>
      </div>
    </div>
  );

  const tabs: Tab[] = [
    {
      id: 'vectorizer',
      label: 'Image Vectorizer',
      icon: '🎨',
      component: <VectorizeBlurredImage />
    },
    {
      id: 'other',
      label: 'Separate Colors',
      icon: '🔧',
      component: <SimpleSilkscreenSeparator />
    },
    {
      id: 'CMYK',
      label: 'CMYK',
      icon: '🔧',
      component: <SilkScreenColorSeparatorCMYK/>
  }
  ];

  return <Tabs tabs={tabs} defaultActiveTab="vectorizer" />;
};

export default AppWithTabs;
