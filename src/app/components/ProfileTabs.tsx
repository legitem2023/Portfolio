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
      case 'location':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        );
      case 'user':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        );
      case 'product':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        );
      case 'wishlist':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-6 border-t border-gray-200">
      <div className="flex overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2 min-w-max">
          {tabsConfig
            .slice()
            .sort((a:any, b:any) => b.id - a.id)
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-3 font-medium flex items-center text-sm border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {getTabIcon(tab.icon)}
                {tab.label}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileTabs;
