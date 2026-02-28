// components/ProfileTabs.tsx
import { TabConfig } from '../../../types';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabsConfig: TabConfig[];
}

const ProfileTabs = ({ activeTab, onTabChange, tabsConfig }: ProfileTabsProps) => {
  const getTabIcon = (iconName: string) => {
    const iconClass = "w-4 h-4 md:w-5 md:h-5 mr-2 transition-transform duration-200 group-hover:scale-110";

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
    <div className="mt-6 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50/50 shadow-sm">
      <div className="flex overflow-x-auto scrollbar-hide px-2">
        <div className="flex space-x-2 md:space-x-4 min-w-max mx-auto">
          {tabsConfig
            .slice()
            .sort((a:any, b:any) => b.id - a.id)
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group relative px-4 py-3 md:px-6 md:py-4 font-medium flex items-center text-sm md:text-base transition-all duration-300 ease-out ${
                  activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {/* Background effect */}
                <span className={`absolute inset-0 rounded-t-xl transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-50/50 shadow-inner'
                    : 'hover:bg-gray-100/80'
                }`} />
                
                {/* Bottom border with animation */}
                <span className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 transform ${
                  activeTab === tab.id
                    ? 'bg-blue-600 scale-x-100'
                    : 'bg-transparent scale-x-0 group-hover:bg-blue-300 group-hover:scale-x-100'
                }`} />
                
                {/* Content */}
                <span className="relative flex items-center">
                  {getTabIcon(tab.icon)}
                  <span className={`transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'font-semibold'
                      : 'font-medium'
                  }`}>
                    {tab.label}
                  </span>
                </span>

                {/* Active indicator dot */}
                {activeTab === tab.id && (
                  <span className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileTabs;
