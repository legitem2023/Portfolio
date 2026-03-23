import React from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  User,
  MapPin,
  Briefcase,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  ChevronRight,
  Phone,
  Users,
  ShoppingBag,
  Star,
  Package,
  Check,
  Camera,
  Plus,
  Grid,
  Bookmark,
  Settings,
  Link2,
  Instagram,
  Twitter,
} from 'lucide-react';

// GraphQL Query
export const GET_USER_PROFILE = gql`
  query GetUser($id: ID) {
    user(id: $id) {
      id
      firstName
      lastName
      avatar
      phone
      followerCount
      followingCount
      isFollowing
      wishlist {
        product {
          variants {
            name
            createdAt
            sku
            color
            size
            price
            salePrice
            stock
            images
            model
          }
        }
      }
      products {
        id
        name
        description
        price
        salePrice
        supplierId
        sku
        stock
        images
        model
        category {
          id
        }
        variants {
          name
          createdAt
          sku
          color
          size
          price
          salePrice
          stock
          images
          model
        }
        brand
        weight
        dimensions
        isActive
        featured
        tags
        createdAt
        updatedAt
      }
      addresses {
        id
        type
        receiver
        street
        city
        state
        zipCode
        country
        lat
        lng
        isDefault
        createdAt
      }
      posts {
        id
        content
        createdAt
        privacy
        isLikedByMe
        likeCount
        commentCount
        user {
          id
          firstName
          lastName
          avatar
        }
        taggedUsers {
          id
          firstName
          lastName
        }
        comments {
          id
          content
          createdAt
          user {
            id
            firstName
            lastName
            avatar
          }
        }
      }
    }
  }
`;

// Types
interface UserProfileProps {
  userId: string;
}

interface Variant {
  name: string;
  createdAt: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  salePrice: number;
  stock: number;
  images: string[];
  model: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice: number;
  supplierId: string;
  sku: string;
  stock: number;
  images: string[];
  model: string;
  category: { id: string };
  variants: Variant[];
  brand: string;
  weight: string;
  dimensions: string;
  isActive: boolean;
  featured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Address {
  id: string;
  type: string;
  receiver: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  privacy: string;
  isLikedByMe: boolean;
  likeCount: number;
  commentCount: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  taggedUsers: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  comments: Comment[];
}

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  phone: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  wishlist: Array<{ product: Product }>;
  products: Product[];
  addresses: Address[];
  posts: Post[];
}

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Cover Photo Skeleton */}
    <div className="h-64 md:h-80 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
      {/* Profile Header Skeleton */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex justify-center md:justify-start">
            <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse ring-4 ring-white" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
            <div className="flex gap-4">
              <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-full" />
              <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 h-48 animate-pulse" />
          <div className="bg-white rounded-2xl shadow-sm p-6 h-64 animate-pulse" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 h-96 animate-pulse" />
          <div className="bg-white rounded-2xl shadow-sm p-6 h-96 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

// Error Component
const ErrorState = ({ message }: { message: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="text-6xl mb-4">😕</div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Post Component
const PostCard = ({ post }: { post: Post }) => {
  const [isLiked, setIsLiked] = React.useState(post.isLikedByMe);
  const [likeCount, setLikeCount] = React.useState(post.likeCount);
  const [showComments, setShowComments] = React.useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={post.user.avatar || 'https://via.placeholder.com/40'}
              alt={`${post.user.firstName} ${post.user.lastName}`}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h4 className="font-semibold text-gray-900">
                {post.user.firstName} {post.user.lastName}
              </h4>
              <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        
        {/* Tagged Users */}
        {post.taggedUsers.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-lime-600">
            <Users className="w-4 h-4" />
            <span>with {post.taggedUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ')}</span>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4 fill-current text-red-500" />
            <span>{likeCount}</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:text-lime-600 transition"
            >
              {post.commentCount} Comments
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex-1 py-3 flex items-center justify-center gap-2 transition ${
            isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="font-medium">Like</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 py-3 flex items-center justify-center gap-2 text-gray-500 hover:text-lime-600 transition"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Comment</span>
        </button>
        <button className="flex-1 py-3 flex items-center justify-center gap-2 text-gray-500 hover:text-lime-600 transition">
          <Share2 className="w-5 h-5" />
          <span className="font-medium">Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {post.comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <img
                src={comment.user.avatar || 'https://via.placeholder.com/32'}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {comment.user.firstName} {comment.user.lastName}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-3 mt-3">
            <img
              src="https://via.placeholder.com/32"
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
            <input
              type="text"
              placeholder="Write a comment..."
              className="flex-1 bg-gray-50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product }: { product: Product }) => {
  const displayPrice = product.salePrice || product.price;
  const originalPrice = product.salePrice ? product.price : null;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/300'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.salePrice && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            SALE
          </span>
        )}
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{product.name}</h4>
        <div className="flex items-center gap-2">
          <span className="text-lime-600 font-bold">${displayPrice}</span>
          {originalPrice && (
            <span className="text-gray-400 text-sm line-through">${originalPrice}</span>
          )}
        </div>
        {product.stock > 0 ? (
          <span className="text-xs text-green-600">In Stock ({product.stock})</span>
        ) : (
          <span className="text-xs text-red-600">Out of Stock</span>
        )}
      </div>
    </div>
  );
};

// Main Component
const UserProfileTab: React.FC<UserProfileProps> = ({ userId }) => {
  const { loading, error, data } = useQuery(GET_USER_PROFILE, {
    variables: { id: userId },
    skip: !userId,
  });

  const [activeTab, setActiveTab] = React.useState<'posts' | 'products' | 'wishlist'>('posts');

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error.message} />;
  if (!data?.user) return <ErrorState message="User not found" />;

  const user: UserData = data.user;
  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName?.[0]}${user.lastName?.[0]}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-lime-400 to-emerald-500">
        <div className="absolute inset-0 bg-black/20" />
        <button className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-white transition flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Edit Cover Photo
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="relative flex justify-center md:justify-start">
              <div className="relative">
                <div className="w-32 h-32 rounded-full ring-4 ring-white overflow-hidden bg-gray-200">
                  {user.avatar ? (
                    <img src={user.avatar} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">{initials}</span>
                    </div>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-lime-500 p-2 rounded-full shadow-lg hover:bg-lime-600 transition">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
                  {user.phone && (
                    <p className="text-gray-500 flex items-center gap-1 mt-1">
                      <Phone className="w-4 h-4" />
                      {user.phone}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button className="bg-lime-500 hover:bg-lime-600 text-white font-semibold px-6 py-2 rounded-full transition">
                    {user.isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-2 rounded-full transition">
                    Message
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-lime-500" />
                  <span className="font-semibold">{user.followerCount.toLocaleString()}</span>
                  <span className="text-gray-500">followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-lime-500" />
                  <span className="font-semibold">{user.followingCount.toLocaleString()}</span>
                  <span className="text-gray-500">following</span>
                </div>
              </div>

              {/* Bio Placeholder */}
              <p className="mt-4 text-gray-700">
                🌟 Digital creator | 🛍️ Shop my products below | 📍 Living life in green
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Address Card */}
            {user.addresses.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-lime-500" />
                    Address
                  </h3>
                  <button className="text-lime-600 text-sm hover:text-lime-700">Add New</button>
                </div>
                {user.addresses.map(address => (
                  <div key={address.id} className="mb-3 last:mb-0">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-lime-100 flex items-center justify-center">
                        {address.type === 'home' ? '🏠' : address.type === 'work' ? '💼' : '📍'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{address.receiver}</p>
                        <p className="text-sm text-gray-500">
                          {address.street}, {address.city}, {address.state} {address.zipCode}
                        </p>
                        {address.isDefault && (
                          <span className="inline-block mt-1 text-xs bg-lime-100 text-lime-700 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Social Links Placeholder */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-lime-500" />
                Social Links
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                  <Instagram className="w-5 h-5 text-pink-600" />
                  <span className="text-gray-700">Instagram</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                </button>
                <button className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                  <Twitter className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-700">Twitter</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm">
              <div className="flex border-b border-gray-200">
                {(['posts', 'products', 'wishlist'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 font-semibold capitalize transition relative ${
                      activeTab === tab
                        ? 'text-lime-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'posts' && (
                  <div className="space-y-4">
                    {/* Create Post */}
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                      <img
                        src={user.avatar || 'https://via.placeholder.com/40'}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <input
                        type="text"
                        placeholder="What's on your mind?"
                        className="flex-1 bg-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
                      />
                      <button className="p-2 hover:bg-gray-200 rounded-full transition">
                        <Plus className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    {/* Posts */}
                    {user.posts.map(post => (
                      <PostCard key={post.id} post={post} />
                    ))}
                    {user.posts.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p>No posts yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'products' && (
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {user.products.map(product => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                    {user.products.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No products listed</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'wishlist' && (
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {user.wishlist.map((item, index) => (
                        <ProductCard key={index} product={item.product} />
                      ))}
                    </div>
                    {user.wishlist.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Your wishlist is empty</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileTab;
