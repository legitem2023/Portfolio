import React from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Heart,
  Users,
  Briefcase,
  Globe,
  Camera,
  MoreHorizontal,
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
      email
      bio
      website
      followerCount
      followingCount
      isFollowing
      joinDate
      addresses {
        id
        type
        receiver
        street
        city
        state
        zipCode
        country
        isDefault
      }
    }
  }
`;

// Types
interface UserProfileProps {
  userId: string;
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
  isDefault: boolean;
}

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  phone: string;
  email: string;
  bio: string;
  website: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  joinDate: string;
  addresses: Address[];
}

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  });
};

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 overflow-y-auto">
    {/* Cover Photo Skeleton */}
    <div className="h-48 sm:h-64 md:h-80 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
    
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 md:-mt-20 pb-8">
      {/* Profile Header Skeleton */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="flex justify-center sm:justify-start">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gray-200 animate-pulse ring-4 ring-white" />
          </div>
          <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left">
            <div className="h-6 sm:h-8 w-32 sm:w-48 bg-gray-200 animate-pulse rounded mx-auto sm:mx-0" />
            <div className="h-3 sm:h-4 w-48 sm:w-64 bg-gray-200 animate-pulse rounded mx-auto sm:mx-0" />
            <div className="flex gap-3 sm:gap-4 justify-center sm:justify-start">
              <div className="h-8 sm:h-10 w-20 sm:w-24 bg-gray-200 animate-pulse rounded-full" />
              <div className="h-8 sm:h-10 w-20 sm:w-24 bg-gray-200 animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 h-64 animate-pulse" />
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 h-48 animate-pulse" />
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

// Detail Item Component
const DetailItem = ({ icon: Icon, label, value, link }: { 
  icon: any; 
  label: string; 
  value: string; 
  link?: boolean;
}) => (
  <div className="flex items-start gap-3 py-2">
    <div className="flex-shrink-0 mt-0.5">
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-lime-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      {link && value ? (
        <a 
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm sm:text-base text-lime-600 hover:text-lime-700 hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm sm:text-base text-gray-900 break-words">
          {value || <span className="text-gray-400 italic">Not provided</span>}
        </p>
      )}
    </div>
  </div>
);

// Main Component
const UserProfileTab: React.FC<UserProfileProps> = ({ userId }) => {
  const { loading, error, data } = useQuery(GET_USER_PROFILE, {
    variables: { id: userId },
    skip: !userId,
  });

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error.message} />;
  if (!data?.user) return <ErrorState message="User not found" />;

  const user: UserData = data.user;
  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName?.[0]}${user.lastName?.[0]}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div className="relative h-40 sm:h-56 md:h-64 bg-gradient-to-r from-lime-400 to-emerald-500 w-full">
        <div className="absolute inset-0 bg-black/20" />
        <button className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white/90 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium text-gray-700 hover:bg-white transition flex items-center gap-1 sm:gap-2 z-10">
          <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Edit Cover</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 -mt-12 sm:-mt-16 md:-mt-20 pb-8 sm:pb-12">
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
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">{fullName}</h1>
                  {user.joinDate && (
                    <div className="flex items-center gap-1 mt-1 justify-center sm:justify-start text-xs sm:text-sm text-gray-500">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Joined {formatDate(user.joinDate)}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 sm:gap-3 justify-center sm:justify-end">
                  <button className="bg-lime-500 hover:bg-lime-600 text-white font-semibold px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-full transition text-sm whitespace-nowrap">
                    {user.isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-full transition text-sm whitespace-nowrap">
                    Message
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 p-1.5 sm:p-2 rounded-full transition flex-shrink-0">
                    <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 sm:gap-6 mt-3 sm:mt-4 justify-center sm:justify-start">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-lime-500 flex-shrink-0" />
                  <span className="font-semibold text-sm sm:text-base">{user.followerCount.toLocaleString()}</span>
                  <span className="text-gray-500 text-xs sm:text-sm">followers</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-lime-500 flex-shrink-0" />
                  <span className="font-semibold text-sm sm:text-base">{user.followingCount.toLocaleString()}</span>
                  <span className="text-gray-500 text-xs sm:text-sm">following</span>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="mt-3 sm:mt-4 text-gray-700 text-sm sm:text-base break-words">
                  {user.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5 md:p-6">
            <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-lime-500 flex-shrink-0" />
              <span>Contact Information</span>
            </h3>
            <div className="space-y-2">
              <DetailItem icon={Mail} label="Email" value={user.email} link />
              <DetailItem icon={Phone} label="Phone" value={user.phone} />
              {user.website && <DetailItem icon={Globe} label="Website" value={user.website} link />}
            </div>
          </div>

          {/* Addresses */}
          {user.addresses.length > 0 && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-lime-500 flex-shrink-0" />
                <span>Addresses</span>
              </h3>
              <div className="space-y-3">
                {user.addresses.map(address => (
                  <div key={address.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-lime-100 flex items-center justify-center flex-shrink-0 text-sm">
                        {address.type === 'home' ? '🏠' : address.type === 'work' ? '💼' : '📍'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-medium text-gray-900 text-sm capitalize">{address.type}</p>
                          {address.isDefault && (
                            <span className="text-xs bg-lime-100 text-lime-700 px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 font-medium">{address.receiver}</p>
                        <p className="text-xs sm:text-sm text-gray-500 break-words">
                          {address.street}, {address.city}, {address.state} {address.zipCode}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">{address.country}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info Placeholder */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5 md:p-6">
            <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-lime-500 flex-shrink-0" />
              <span>Additional Information</span>
            </h3>
            <div className="space-y-2">
              <DetailItem icon={Briefcase} label="Role" value="Customer" />
              <DetailItem icon={Calendar} label="Member Since" value={formatDate(user.joinDate)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileTab;
