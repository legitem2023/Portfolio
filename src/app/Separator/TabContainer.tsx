import React, { useState } from 'react';
import VectorizeBlurredImage from './VectorizeBlurredImage';

// Placeholder for your other component (you can replace this)
const OtherComponent: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Other Component</h2>
      <p className="text-gray-600">This is where your other component will go.</p>
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">⚠️ Replace this with your actual component</p>
      </div>
    </div>
  );
};

interface TabProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabNavigation: React.FC<TabProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'vectorizer', label: 'Image Vectorizer', icon: '🎨' },
    { id: 'other', label: 'Other Tool', icon: '🔧' }
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
              transition-colors duration-200
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

const TabContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('vectorizer');

  return (
    <div className="max-w-6xl mx-auto">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="mt-6">
        {activeTab === 'vectorizer' && <VectorizeBlurredImage />}
        {activeTab === 'other' && <OtherComponent />}
      </div>
    </div>
  );
};

export default TabContainer;
