// app/merchants/page.tsx
'use client';

import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

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

// Define TypeScript interfaces
interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Merchant {
  id: number;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  description: string;
  image: string;
  isFeatured: boolean;
  email: string;
  phone: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export default function MerchantsPage() {
  const { loading, error, data } = useQuery(GET_MERCHANTS);

  // Static fallback data in case GraphQL is not ready
  const fallbackMerchants: Merchant[] = [
    {
      id: 1,
      name: "Lavender Dreams Boutique",
      category: "Fashion",
      rating: 4.8,
      reviews: 142,
      description: "Luxury clothing and accessories with a floral touch",
      image: "/api/placeholder/80/80",
      isFeatured: true,
      email: "contact@lavenderdreams.com",
      phone: "+1-555-0101",
      addresses: [{
        street: "123 Fashion Ave",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA"
      }],
      createdAt: "2023-01-15T00:00:00Z",
      updatedAt: "2024-01-10T00:00:00Z"
    },
    {
      id: 2,
      name: "Purple Petal Cafe",
      category: "Food & Drink",
      rating: 4.6,
      reviews: 89,
      description: "Artisan coffee and pastries in a serene atmosphere",
      image: "/api/placeholder/80/80",
      isFeatured: false,
      email: "hello@purplepetalcafe.com",
      phone: "+1-555-0102",
      addresses: [{
        street: "456 Brew Street",
        city: "Seattle",
        state: "WA",
        zipCode: "98101",
        country: "USA"
      }],
      createdAt: "2023-03-20T00:00:00Z",
      updatedAt: "2024-01-12T00:00:00Z"
    },
    {
      id: 3,
      name: "Violet Vine Florist",
      category: "Flowers",
      rating: 4.9,
      reviews: 203,
      description: "Fresh floral arrangements for every occasion",
      image: "/api/placeholder/80/80",
      isFeatured: true,
      email: "orders@violetvine.com",
      phone: "+1-555-0103",
      addresses: [{
        street: "789 Bloom Blvd",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90210",
        country: "USA"
      }],
      createdAt: "2022-11-05T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z"
    },
    {
      id: 4,
      name: "Lilac Lane Books",
      category: "Books",
      rating: 4.7,
      reviews: 67,
      description: "Curated collection of literature and stationery",
      image: "/api/placeholder/80/80",
      isFeatured: false,
      email: "info@lilaclane.com",
      phone: "+1-555-0104",
      addresses: [{
        street: "321 Read Street",
        city: "Portland",
        state: "OR",
        zipCode: "97205",
        country: "USA"
      }],
      createdAt: "2023-05-10T00:00:00Z",
      updatedAt: "2024-01-08T00:00:00Z"
    },
    {
      id: 5,
      name: "Amethyst Art Studio",
      category: "Arts & Crafts",
      rating: 4.5,
      reviews: 124,
      description: "Art supplies and creative workshops",
      image: "/api/placeholder/80/80",
      isFeatured: true,
      email: "studio@amethystart.com",
      phone: "+1-555-0105",
      addresses: [{
        street: "654 Canvas Road",
        city: "Austin",
        state: "TX",
        zipCode: "73301",
        country: "USA"
      }],
      createdAt: "2023-02-28T00:00:00Z",
      updatedAt: "2024-01-14T00:00:00Z"
    },
    {
      id: 6,
      name: "Orchid Organic Market",
      category: "Groceries",
      rating: 4.8,
      reviews: 156,
      description: "Organic produce and natural products",
      image: "/api/placeholder/80/80",
      isFeatured: false,
      email: "fresh@orchidorganic.com",
      phone: "+1-555-0106",
      addresses: [{
        street: "987 Green Way",
        city: "Denver",
        state: "CO",
        zipCode: "80202",
        country: "USA"
      }],
      createdAt: "2023-04-15T00:00:00Z",
      updatedAt: "2024-01-11T00:00:00Z"
    }
  ];

  // Use GraphQL data if available, otherwise use fallback
  const merchants = data?.users || fallbackMerchants;

  const categories = ["All", "Fashion", "Food & Drink", "Flowers", "Books", "Arts & Crafts", "Groceries"];

  // Calculate average rating
  const averageRating = merchants.length > 0 
    ? (merchants.reduce((sum: number, merchant: Merchant) => sum + merchant.rating, 0) / merchants.length).toFixed(1)
    : "0.0";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-purple-900 font-semibold">Loading merchants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error loading merchants</p>
          <p className="mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-purple-900 mb-3">
            Discover Local Merchants
          </h1>
          <p className="text-purple-700">
            Supporting {merchants.length} local businesses in your community
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-8 border border-purple-200">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category) => (
                <button
                  key={category}
                  className="px-4 py-2 rounded-full border border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400 transition-colors whitespace-nowrap"
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search merchants..."
                className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-md border border-purple-200">
            <div className="text-purple-900 font-semibold">Total Merchants</div>
            <div className="text-2xl font-bold text-purple-700">{merchants.length}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-purple-200">
            <div className="text-purple-900 font-semibold">Featured</div>
            <div className="text-2xl font-bold text-purple-700">
              {merchants.filter((m: Merchant) => m.isFeatured).length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-purple-200">
            <div className="text-purple-900 font-semibold">Avg. Rating</div>
            <div className="text-2xl font-bold text-purple-700">{averageRating}</div>
          </div>
        </div>

        {/* Merchants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {merchants.map((merchant: Merchant) => (
            <div
              key={merchant.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                merchant.isFeatured 
                  ? 'border-purple-500 shadow-purple-200' 
                  : 'border-purple-200'
              }`}
            >
              {merchant.isFeatured && (
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-semibold py-1 px-4 text-center">
                  ⭐ Featured
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {merchant.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-lg font-bold text-purple-900">{merchant.name}</h3>
                      {merchant.isFeatured && (
                        <span className="text-purple-500">★</span>
                      )}
                    </div>
                    <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                      {merchant.category}
                    </span>
                  </div>
                </div>

                <p className="text-purple-700 text-sm mb-4 leading-relaxed">
                  {merchant.description}
                </p>

                {/* Additional merchant info from GraphQL */}
                <div className="mb-4 space-y-1">
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
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="flex text-amber-400">
                        {"★".repeat(Math.floor(merchant.rating))}
                        {"☆".repeat(5 - Math.floor(merchant.rating))}
                      </div>
                      <span className="text-purple-900 font-semibold text-sm">
                        {merchant.rating}
                      </span>
                    </div>
                    <span className="text-purple-500 text-sm">
                      ({merchant.reviews} reviews)
                    </span>
                  </div>
                  
                  <button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105">
                    Visit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {merchants.length === 0 && (
          <div className="text-center py-12">
            <div className="text-purple-400 text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-semibold text-purple-900 mb-2">No merchants found</h3>
            <p className="text-purple-700">Check back later for new local businesses.</p>
          </div>
        )}
      </div>
    </div>
  );
}
