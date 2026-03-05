// components/UserProfile.tsx
'use client';

import { useQuery, useMutation } from '@apollo/client';
import Image from 'next/image';
import { GET_USER_PROFILE } from './graphql/query';
import { UPDATE_USER_PHONE, UPDATE_USER_AVATAR } from './graphql/mutations';
import { User } from '../../../types';
import UserProfileShimmer from './UserProfileShimmer';
import UserProfileShimmerRed from './UserProfileShimmerRed';
import ProfileTabs from './ProfileTabs';
import ParticleBackground from './ParticleBackground';
import { useState, useRef } from 'react';
import TabContent from './TabContent';
import { Pencil, Phone, Camera, X, Check } from 'lucide-react';

const UserProfile = ({ userId }: { userId: string }) => {
  const { data, loading, error, refetch } = useQuery(GET_USER_PROFILE, {
    variables: { id: userId },
  });

  const [updateUserPhone] = useMutation(UPDATE_USER_PHONE);
  const [updateUserAvatar] = useMutation(UPDATE_USER_AVATAR);
  
  const [activeTab, setActiveTab] = useState<string>('address');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) return <UserProfileShimmer />;
  if (error) return <UserProfileShimmerRed />;
  if(!data?.user) return <UserProfileShimmer />;
  
  const user: User = data?.user;

  const handlePhoneUpdate = async () => {
    // Validate phone number (basic validation)
    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    // Simple phone number validation (adjust as needed)
    const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert('Please enter a valid phone number');
      return;
    }

    try {
      await updateUserPhone({
        variables: {
          id: userId,
          phone: phoneNumber
        }
      });
      setIsEditingPhone(false);
      refetch();
      alert('Phone number updated successfully!');
    } catch (error) {
      console.error('Error updating phone:', error);
      alert('Failed to update phone number. Please try again.');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64String = reader.result as string;
          
          await updateUserAvatar({
            variables: {
              id: userId,
              avatar: base64String
            }
          });
          
          refetch();
          alert('Avatar updated successfully!');
        } catch (error) {
          console.error('Error updating avatar:', error);
          alert('Failed to update avatar. Please try again.');
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        alert('Error reading file. Please try again.');
        setIsUploading(false);
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen p-0">
      <div className="max-w-2xl mx-auto">
        {/* Cover Photo */}
        <div className="h-36 relative overflow">
          <div className="absolute bottom-0 w-full h-1/2"></div>
          <ParticleBackground />
          
          {/* Profile Picture - Made Uploadable */}
          <div className="absolute -bottom-12 md:-bottom-16 left-4 md:left-8 transform md:transform-none group">
            <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40">
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg">
                <Image
                  src={user.avatar || '/NoImage.webp'}
                  alt={`${user.firstName}'s avatar`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 96px, (max-width: 1024px) 128px, 160px"
                />
              </div>
              
              {/* Upload Overlay */}
              <button
                onClick={triggerFileInput}
                disabled={isUploading}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Upload avatar"
              >
                {isUploading ? (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="max-w-4xl mx-auto px-4 pt-16 md:pt-20 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="w-full md:w-auto">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-600 mt-1">
                @{user.firstName.toLowerCase()}{user.lastName.toLowerCase()}
              </p>
              
              {/* Phone Number Section - Made Editable */}
              <div className="flex items-center gap-2 mt-3 text-gray-700">
                <Phone className="w-5 h-5 text-gray-500" />
                {isEditingPhone ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handlePhoneUpdate}
                        className="p-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                        aria-label="Save phone number"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingPhone(false);
                          setPhoneNumber(user.phone || '');
                        }}
                        className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                        aria-label="Cancel editing"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-base">
                      {user.phone || 'No phone number added'}
                    </span>
                    <button
                      onClick={() => {
                        setPhoneNumber(user.phone || '');
                        setIsEditingPhone(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Edit phone number"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 md:gap-6 mt-4 text-gray-700 text-sm md:text-base">
                <span className="hover:underline cursor-pointer">
                  <strong>{user.posts?.length || 0}</strong> posts
                </span>
                <span className="hover:underline cursor-pointer">
                  <strong>{user.addresses?.length || 0}</strong> Addresses
                </span>
              </div>
            </div>
          </div>
          
          {/* Tabs Navigation */}
          <ProfileTabs 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabsConfig={[
              { id: 'posts', label: 'Posts', icon: 'user' },
              { id: 'address', label: 'Addresses', icon: 'location' },
              { id: 'wishlist', label: 'Wishlist', icon: 'wishlist' }
            ]}
          />
        </div>

        {/* Tab Content */}
        <TabContent activeTab={activeTab} user={user} userId={userId} refetch={refetch} />
      </div>
    </div>
  );
};

export default UserProfile;
