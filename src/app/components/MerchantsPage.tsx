// app/merchants/page.tsx
'use client';

import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveIndex } from '../../../Redux/activeIndexSlice';
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import CategoryPage from './CategoryPage';
// Define the GraphQL query for merchants
const GET_MERCHANTS = gql`
  query GetUsers {
    users {
      id
      email
      password
      firstName
      lastName
      addresses {
        type
        street
        city
        state
        zipCode
        country
        isDefault
        createdAt
      }
      avatar
      phone
      emailVerified
      createdAt
      updatedAt
      role
    }
  }
`;

// Define TypeScript interfaces based on GraphQL schema
interface Address {
  type: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

interface Merchant {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  addresses: Address[];
  avatar: string;
  phone: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  role: string;
}

export default function MerchantsPage() {
  const { loading, error, data } = useQuery(GET_MERCHANTS);
  const dispatch = useDispatch();
  // Static fallback data that matches GraphQL schema
  const router = useRouter();
  const fallbackMerchants: Merchant[] = [
    {
      id: "1",
      email: "contact@lavenderdreams.com",
      password: "",
      firstName: "Lavender",
      lastName: "Dreams",
      addresses: [{
        type: "business",
        street: "123 Fashion Ave",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA",
        isDefault: true,
        createdAt: "2023-01-15T00:00:00Z"
      }],
      avatar: "/api/placeholder/80/80",
      phone: "+1-555-0101",
      emailVerified: true,
      createdAt: "2023-01-15T00:00:00Z",
      updatedAt: "2024-01-10T00:00:00Z",
      role: "merchant"
    },
    {
      id: "2",
      email: "hello@purplepetalcafe.com",
      password: "",
      firstName: "Purple",
      lastName: "Petal",
      addresses: [{
        type: "business",
        street: "456 Brew Street",
        city: "Seattle",
        state: "WA",
        zipCode: "98101",
        country: "USA",
        isDefault: true,
        createdAt: "2023-03-20T00:00:00Z"
      }],
      avatar: "/api/placeholder/80/80",
      phone: "+1-555-0102",
      emailVerified: true,
      createdAt: "2023-03-20T00:00:00Z",
      updatedAt: "2024-01-12T00:00:00Z",
      role: "merchant"
    }
  ];

  // Use GraphQL data if available, otherwise use fallback
  const merchants = data?.users || fallbackMerchants;

  // Calculate display values from available data
  const getDisplayName = (merchant: Merchant) => {
    return `${merchant.firstName} ${merchant.lastName}`;
  };


  const redirect = (id: string) => {
  dispatch(setActiveIndex(11));
  router.push(`?id=${id}`);
};

  
  const getDisplayCategory = (merchant: Merchant) => {
    // Map email domains or other fields to categories
    const domain = merchant.email.split('@')[1];
    if (domain.includes('fashion') || domain.includes('boutique')) return 'Fashion';
    if (domain.includes('cafe') || domain.includes('coffee')) return 'Food & Drink';
    if (domain.includes('florist') || domain.includes('flower')) return 'Flowers';
    if (domain.includes('book') || domain.includes('read')) return 'Books';
    if (domain.includes('art') || domain.includes('studio')) return 'Arts & Crafts';
    if (domain.includes('market') || domain.includes('organic')) return 'Groceries';
    return 'General';
  };

  const getDisplayRating = (merchant: Merchant) => {
    // Generate rating based on creation date and other factors
    const created = new Date(merchant.createdAt);
    const now = new Date();
    const monthsActive = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return Math.min(5, 3.5 + (monthsActive * 0.1));
  };

  const getDisplayReviews = (merchant: Merchant) => {
    // Generate review count based on activity
    const created = new Date(merchant.createdAt);
    const now = new Date();
    const monthsActive = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return Math.floor(monthsActive * 10);
  };

  const getDisplayDescription = (merchant: Merchant) => {
    const category = getDisplayCategory(merchant);
    return `${merchant.firstName} ${merchant.lastName} - ${category} business serving the community since ${new Date(merchant.createdAt).getFullYear()}`;
  };

  const getIsFeatured = (merchant: Merchant) => {
    // Feature merchants based on verification status and activity
    return merchant.emailVerified && merchant.addresses.length > 0;
  };

  const categories = ["All", "Fashion", "Food & Drink", "Flowers", "Books", "Arts & Crafts", "Groceries", "General"];

  // Calculate average rating from display ratings
  const averageRating = merchants.length > 0 
    ? (merchants.reduce((sum: number, merchant: Merchant) => sum + getDisplayRating(merchant), 0) / merchants.length).toFixed(1)
    : "0.0";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-2 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-purple-900 font-semibold">Loading merchants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-2 md:p-6 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error loading merchants</p>
          <p className="mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-2 md:p-6">
      <div className="max-w-7xl mx-auto">


        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-3 md:p-6 mb-6 md:mb-8 border border-purple-200">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
            <CategoryPage/>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search merchants..."
                className="w-full px-3 py-1.5 md:px-4 md:py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-md border border-purple-200">
            <div className="text-purple-900 font-semibold text-sm md:text-base">Total Merchants</div>
            <div className="text-xl md:text-2xl font-bold text-purple-700">{merchants.length}</div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-md border border-purple-200">
            <div className="text-purple-900 font-semibold text-sm md:text-base">Featured</div>
            <div className="text-xl md:text-2xl font-bold text-purple-700">
              {merchants.filter((m: Merchant) => getIsFeatured(m)).length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-md border border-purple-200">
            <div className="text-purple-900 font-semibold text-sm md:text-base">Avg. Rating</div>
            <div className="text-xl md:text-2xl font-bold text-purple-700">{averageRating}</div>
          </div>
        </div>

        {/* Merchants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {merchants.map((merchant: Merchant) => {
            const displayName = getDisplayName(merchant);
            const displayCategory = getDisplayCategory(merchant);
            const displayRating = getDisplayRating(merchant);
            const displayReviews = getDisplayReviews(merchant);
            const displayDescription = getDisplayDescription(merchant);
            const isFeatured = getIsFeatured(merchant);

            return (
              <div
                key={merchant.id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  isFeatured 
                    ? 'border-purple-500 shadow-purple-200' 
                    : 'border-purple-200'
                }`}
              >
                {isFeatured && (
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs md:text-sm font-semibold py-1 px-3 md:px-4 text-center">
                    ⭐ Featured
                  </div>
                )}
                
                <div className="p-4 md:p-6">
                  <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-base md:text-lg">
                      {displayName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-base md:text-lg font-bold text-purple-900">{displayName}</h3>
                        {isFeatured && (
                          <span className="text-purple-500">★</span>
                        )}
                      </div>
                      <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-0.5 md:py-1 rounded-full">
                        {displayCategory}
                      </span>
                    </div>
                  </div>

                  <p className="text-purple-700 text-xs md:text-sm mb-3 md:mb-4 leading-relaxed">
                    {displayDescription}
                  </p>

                  {/* Additional merchant info from GraphQL */}
                  <div className="mb-3 md:mb-4 space-y-0.5 md:space-y-1">
                    {merchant.addresses && merchant.addresses.length > 0 && (
                      <p className="text-xs text-purple-600">
                        📍 {merchant.addresses[0].city}, {merchant.addresses[0].state}
                      </p>
                    )}
                    {merchant.phone && (
                      <p className="text-xs text-purple-600">📞 {merchant.phone}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 md:gap-2">
                      <div className="flex items-center gap-0.5 md:gap-1">
                        <div className="flex text-amber-400 text-sm md:text-base">
                          {"★".repeat(Math.floor(displayRating))}
                          {"☆".repeat(5 - Math.floor(displayRating))}
                        </div>
                        <span className="text-purple-900 font-semibold text-xs md:text-sm">
                          {displayRating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-purple-500 text-xs md:text-sm">
                        ({displayReviews} reviews)
                      </span>
                    </div>
                    
                    <button onClick={()=> redirect(merchant.id)} className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 transform hover:scale-105">
                      Visit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {merchants.length === 0 && (
          <div className="text-center py-8 md:py-12">
            <div className="text-purple-400 text-4xl md:text-6xl mb-3 md:mb-4">🏪</div>
            <h3 className="text-lg md:text-xl font-semibold text-purple-900 mb-1 md:mb-2">No merchants found</h3>
            <p className="text-purple-700 text-sm md:text-base">Check back later for new local businesses.</p>
          </div>
        )}
      </div>
    </div>
  );
}
