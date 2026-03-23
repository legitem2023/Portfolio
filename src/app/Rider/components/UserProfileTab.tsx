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
  Menu,
  X,
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
    <div className="h-48 sm:h-64 md:h-80 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 md:-mt-20">
      {/* Profile Header Skeleton */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="flex justify-center sm:justify-start">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gray-200 animate-pulse ring-4 ring-white" />
          </div>
          <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left">
            <div className="h-6 sm:h-8 w-32 sm:w-48 bg-gray-200 animate-pulse rounded mx-auto sm:mx-0" />
            <div className="h-3 sm:h-4 w-24 sm:w-32 bg-gray-200 animate-pulse rounded mx-auto sm:mx-0" />
            <div className="flex gap-3 sm:gap-4 justify-center sm:justify-start">
              <div className="h-8 sm:h-10 w-20 sm:w-24 bg-gray-200 animate-pulse rounded-full" />
              <div className="h-8 sm:h-10 w-20 sm:w-24 bg-gray-200 animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 h-40 sm:h-48 animate-pulse" />
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 h-48 sm:h-64 animate-pulse" />
        </div>
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 h-64 sm:h-96 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

// Error Component
const ErrorState = ({ message }: { message: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="text-center">
      <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">😕</div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
      <p className="text-sm sm:text-base text-gray-600">{message}</p>
    </div>
  </div>
);

// Post Component
const PostCard = ({ post }: { post: Post }) => {
  const [isLiked, setIsLiked] = React.useState(post.isLikedByMe);
  const [likeCount, setLikeCount] = React.useState(post.likeCount);
  const [showComments, setShowComments] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleComment = () => {
    if (commentText.trim()) {
      // Handle comment submission
      setCommentText('');
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="p-3 sm:p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <img
              src={post.user.avatar || 'https://via.placeholder.com/40'}
              alt={`${post.user.firstName} ${post.user.lastName}`}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {post.user.firstName} {post.user.lastName}
              </h4>
              <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0">
            <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-3 sm:p-4">
        <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>
        
        {/* Tagged Users */}
        {post.taggedUsers.length > 0 && (
          <div className="mt-2 sm:mt-3 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-lime-600 flex-wrap">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>with {post.taggedUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ')}</span>
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="px-3 sm:px-4 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 fill-current text-red-500" />
            <span>{likeCount}</span>
          </div>
          <button
            onClick={() => setShowComments(!showComments)}
            className="hover:text-lime-600 transition"
          >
            {post.commentCount} Comments
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex-1 py-2 sm:py-3 flex items-center justify-center gap-1 sm:gap-2 transition text-xs sm:text-sm ${
            isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="font-medium">Like</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 py-2 sm:py-3 flex items-center justify-center gap-1 sm:gap-2 text-gray-500 hover:text-lime-600 transition text-xs sm:text-sm"
        >
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium">Comment</span>
        </button>
        <button className="flex-1 py-2 sm:py-3 flex items-center justify-center gap-1 sm:gap-2 text-gray-500 hover:text-lime-600 transition text-xs sm:text-sm">
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 p-3 sm:p-4 space-y-3">
          {post.comments.map(comment => (
            <div key={comment.id} className="flex gap-2 sm:gap-3">
              <img
                src={comment.user.avatar || 'https://via.placeholder.com/32'}
                alt=""
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-xs sm:text-sm">
                    {comment.user.firstName} {comment.user.lastName}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 break-words">{comment.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 sm:gap-3 mt-3">
            <img
              src="https://via.placeholder.com/32"
              alt=""
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-gray-50 rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              />
              <button
                onClick={handleComment}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-lime-500 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-lime-600 transition"
              >
                Post
              </button>
            </div>
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
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/300'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.salePrice && (
          <span className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
            SALE
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-xs sm:text-sm">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-2 sm:p-3">
        <h4 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1 line-clamp-2">{product.name}</h4>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <span className="text-lime-600 font-bold text-sm sm:text-base">${displayPrice}</span>
          {originalPrice && (
            <span className="text-gray-400 text-xs sm:text-sm line-through">${originalPrice}</span>
          )}
        </div>
        {product.stock > 0 && product.stock < 10 && (
          <span className="text-xs text-orange-600">Only {product.stock} left</span>
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
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error.message} />;
  if (!data?.user) return <ErrorState message="User not found" />;

  const user: UserData = data.user;
  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName?.[0]}${user.lastName?.[0]}`;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Cover Photo */}
      <div className="relative h-40 sm:h-56 md:h-64 lg:h-80 bg-gradient-to-r from-lime-400 to-emerald-500">
        <div className="absolute inset-0 bg-black/20" />
        <button className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white/90 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full text-xs sm:text-sm font-medium text-gray-700 hover:bg-white transition flex items-center gap-1 sm:gap-2">
          <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Edit Cover Photo</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 -mt-12 sm:-mt-16 md:-mt-20">
        {/* Profile Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 md:gap-6">
            {/* Avatar */}
            <div className="relative flex justify-center sm:justify-start">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full ring-4 ring-white overflow-hidden bg-gray-200">
                  {user.avatar ? (
                    <img src={user.avatar} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{initials}</span>
                    </div>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-lime-500 p-1.5 sm:p-2 rounded-full shadow-lg hover:bg-lime-600 transition">
                  <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </button>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{fullName}</h1>
                  {user.phone && (
                    <p className="text-gray-500 flex items-center gap-1 mt-1 justify-center sm:justify-start text-sm">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                      {user.phone}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 sm:gap-3 justify-center sm:justify-end">
                  <button className="bg-lime-500 hover:bg-lime-600 text-white font-semibold px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-full transition text-sm">
                    {user.isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-full transition text-sm">
                    Message
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 p-1.5 sm:p-2 rounded-full transition">
                    <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 sm:gap-6 mt-3 sm:mt-4 justify-center sm:justify-start">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-lime-500" />
                  <span className="font-semibold text-sm sm:text-base">{user.followerCount.toLocaleString()}</span>
                  <span className="text-gray-500 text-xs sm:text-sm">followers</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-lime-500" />
                  <span className="font-semibold text-sm sm:text-base">{user.followingCount.toLocaleString()}</span>
                  <span className="text-gray-500 text-xs sm:text-sm">following</span>
                </div>
              </div>

              {/* Bio Placeholder */}
              <p className="mt-3 sm:mt-4 text-gray-700 text-sm sm:text-base">
                🌟 Digital creator | 🛍️ Shop my products below | 📍 Living life in green
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-5 md:space-y-6">
            {/* Address Card */}
            {user.addresses.length > 0 && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5 md:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-lime-500" />
                    Address
                  </h3>
                  <button className="text-lime-600 text-xs sm:text-sm hover:text-lime-700">Add New</button>
                </div>
                {user.addresses.map(address => (
                  <div key={address.id} className="mb-3 last:mb-0">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-lime-100 flex items-center justify-center flex-shrink-0 text-sm">
                        {address.type === 'home' ? '🏠' : address.type === 'work' ? '💼' : '📍'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{address.receiver}</p>
                        <p className="text-xs sm:text-sm text-gray-500 break-words">
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
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <Link2 className="w-4 h-4 sm:w-5 sm:h-5 text-lime-500" />
                Social Links
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <button className="w-full flex items-center gap-2 sm:gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                  <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                  <span className="text-gray-700 text-sm sm:text-base">Instagram</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-auto text-gray-400" />
                </button>
                <button className="w-full flex items-center gap-2 sm:gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                  <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  <span className="text-gray-700 text-sm sm:text-base">Twitter</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-auto text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
                {(['posts', 'products', 'wishlist'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 sm:py-4 font-semibold capitalize transition relative text-sm sm:text-base whitespace-nowrap ${
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
              <div className="p-3 sm:p-4 md:p-5">
                {activeTab === 'posts' && (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Create Post */}
                    <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                      <img
                        src={user.avatar || 'https://via.placeholder.com/40'}
                        alt=""
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <input
                        type="text"
                        placeholder="What's on your mind?"
                        className="flex-1 bg-white rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
                      />
                      <button className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition flex-shrink-0">
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      </button>
                    </div>

                    {/* Posts */}
                    {user.posts.map(post => (
                      <PostCard key={post.id} post={post} />
                    ))}
                    {user.posts.length === 0 && (
                      <div className="text-center py-8 sm:py-12 text-gray-500">
                        <p className="text-sm sm:text-base">No posts yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'products' && (
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {user.products.map(product => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                    {user.products.length === 0 && (
                      <div className="text-center py-8 sm:py-12 text-gray-500">
                        <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                        <p className="text-sm sm:text-base">No products listed</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'wishlist' && (
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {user.wishlist.map((item, index) => (
                        <ProductCard key={index} product={item.product} />
                      ))}
                    </div>
                    {user.wishlist.length === 0 && (
                      <div className="text-center py-8 sm:py-12 text-gray-500">
                        <Heart className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                        <p className="text-sm sm:text-base">Your wishlist is empty</p>
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
