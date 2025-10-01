// components/ProfileTabs.tsx
import { TabConfig } from '../../../types';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabsConfig: TabConfig[];
}

const ProfileTabs = ({ activeTab, onTabChange, tabsConfig }: ProfileTabsProps) => {
  const getTabIcon = (iconName: string) => {
    const iconClass = "w-4 h-4 md:w-5 md:h-5 mr-2";
    
    switch (iconName) {
      case 'user':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a6 6 0 0012 0c0-1.003-.21-1.96-.59-2.808A5 5 0 0010 11z" clipRule="evenodd" />
          </svg>
        );
      case 'photos':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        );
      case 'friends':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        );
      case 'address':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-6 border-t border-gray-300 flex overflow-x-auto scrollbar-hide">
      <div className="flex space-x-4 md:space-x-8 min-w-max">
        {tabsConfig.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-3 md:px-4 md:py-3 border-b-2 font-medium flex items-center text-sm md:text-base transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:bg-gray-100 rounded-md'
            }`}
          >
            {getTabIcon(tab.icon)}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileTabs;
