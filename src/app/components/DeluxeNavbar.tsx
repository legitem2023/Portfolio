// components/DeluxeNavbar.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface NavItem {
  name: string;
  href: string;
  subItems?: NavItem[];
  highlight?: boolean;
}

const DeluxeNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartItems, setCartItems] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const navigationItems: NavItem[] = [
    { name: 'Home', href: '/' },
    { name: 'New Arrivals', href: '/new' },
    { name: 'Categories', href: '/categories', subItems: [
      { name: 'Men', href: '/men' },
      { name: 'Women', href: '/women' },
      { name: 'Accessories', href: '/accessories' },
      { name: 'Electronics', href: '/electronics' },
    ]},
    { name: 'Sale', href: '/sale', highlight: true },
    { name: 'Blog', href: '/blog' },
  ];

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-indigo-600 text-white text-center py-2 px-4 text-sm">
        Free shipping on all orders over $50! 🚚
      </div>

      {/* Main Navigation */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/">
                  <span className="text-2xl font-bold text-indigo-600 cursor-pointer">LUXE</span>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:block ml-8">
                <div className="flex items-center space-x-4">
                  {navigationItems.map((item) => (
                    <div key={item.name} className="relative group">
                      <Link href={item.href}>
                        <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${router.pathname === item.href ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:text-indigo-600'} ${item.highlight ? 'text-red-500 font-semibold' : ''}`}>
                          {item.name}
                        </span>
                      </Link>
                      
                      {/* Dropdown for items with subItems */}
                      {item.subItems && (
                        <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <div className="py-1">
                            {item.subItems.map((subItem) => (
                              <Link key={subItem.name} href={subItem.href}>
                                <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer">
                                  {subItem.name}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:block flex-1 max-w-xl mx-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="absolute right-3 top-2.5 text-gray-400 hover:text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Right Icons */}
            <div className="flex items-center">
              {/* Wishlist */}
              <Link href="/wishlist">
                <div className="ml-4 relative cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </Link>
              
              {/* Cart */}
              <Link href="/cart">
                <div className="ml-4 relative cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItems}
                    </span>
                  )}
                </div>
              </Link>
              
              {/* User Account */}
              <div className="ml-4 relative">
                <button className="flex items-center text-sm rounded-full focus:outline-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              </div>
              
              {/* Mobile menu button */}
              <div className="md:hidden ml-4">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-indigo-600 focus:outline-none"
                >
                  <svg
                    className={`h-6 w-6 ${isOpen ? 'hidden' : 'block'}`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  <svg
                    className={`h-6 w-6 ${isOpen ? 'block' : 'hidden'}`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="px-3 mb-4">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            
            {navigationItems.map((item) => (
              <div key={item.name}>
                <Link href={item.href}>
                  <span className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${router.pathname === item.href ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:text-indigo-600'} ${item.highlight ? 'text-red-500 font-semibold' : ''}`}>
                    {item.name}
                  </span>
                </Link>
                
                {/* Mobile sub-items */}
                {item.subItems && (
                  <div className="pl-6">
                    {item.subItems.map((subItem) => (
                      <Link key={subItem.name} href={subItem.href}>
                        <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-indigo-600 cursor-pointer">
                          {subItem.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            <div className="pt-4 pb-2 border-t border-gray-200">
              <Link href="/wishlist">
                <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 cursor-pointer">
                  Wishlist
                </span>
              </Link>
              <Link href="/cart">
                <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 cursor-pointer">
                  Shopping Cart ({cartItems})
                </span>
              </Link>
              <Link href="/account">
                <span className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 cursor-pointer">
                  My Account
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default DeluxeNavbar;
