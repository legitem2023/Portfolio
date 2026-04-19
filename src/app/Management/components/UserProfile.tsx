// components/UserProfile.tsx
'use client';

import { useQuery, useMutation } from '@apollo/client';
import Image from 'next/image';
import { GET_USER_PROFILE } from '../../components/graphql/query';
import { UPDATE_USER_PHONE, UPDATE_USER_AVATAR, UPDATE_USER_BUSINESS_NAME, UPDATE_USER_BUSINESS_TYPE, UPDATE_USER_PRODUCT_CATEGORY, UPDATE_USER_BUSINESS_DESCRIPTION, UPDATE_USER_WEBSITE, UPDATE_USER_BUSINESS_ADDRESS, UPDATE_USER_ADDRESS_INSTRUCTION } from '../../components/graphql/mutation';
import { User } from '../../../../types';
import UserProfileShimmer from '../../components/UserProfileShimmer';
import UserProfileShimmerRed from '../../components/UserProfileShimmerRed';
import ProfileTabs from '../../components/ProfileTabs';
import ParticleBackground from '../../components/ParticleBackground';
import { useState, useRef } from 'react';
import TabContent from '../../components/TabContent';
import { Pencil, Phone, Camera, X, Check, Building2, MapPin, Globe, FileText, Package, Briefcase, Home } from 'lucide-react';

const UserProfile = ({ userId }: { userId: string }) => {
  const { data, loading, error, refetch } = useQuery(GET_USER_PROFILE, {
    variables: { id: userId },
  });

  const [updateUserPhone] = useMutation(UPDATE_USER_PHONE);
  const [updateUserAvatar] = useMutation(UPDATE_USER_AVATAR);
  const [updateUserBusinessName] = useMutation(UPDATE_USER_BUSINESS_NAME);
  const [updateUserBusinessType] = useMutation(UPDATE_USER_BUSINESS_TYPE);
  const [updateUserProductCategory] = useMutation(UPDATE_USER_PRODUCT_CATEGORY);
  const [updateUserBusinessDescription] = useMutation(UPDATE_USER_BUSINESS_DESCRIPTION);
  const [updateUserWebsite] = useMutation(UPDATE_USER_WEBSITE);
  const [updateUserBusinessAddress] = useMutation(UPDATE_USER_BUSINESS_ADDRESS);
  const [updateUserAddressInstruction] = useMutation(UPDATE_USER_ADDRESS_INSTRUCTION);
  
  const [activeTab, setActiveTab] = useState<string>('address');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingBusinessName, setIsEditingBusinessName] = useState(false);
  const [isEditingBusinessType, setIsEditingBusinessType] = useState(false);
  const [isEditingProductCategory, setIsEditingProductCategory] = useState(false);
  const [isEditingBusinessDescription, setIsEditingBusinessDescription] = useState(false);
  const [isEditingWebsite, setIsEditingWebsite] = useState(false);
  const [isEditingBusinessAddress, setIsEditingBusinessAddress] = useState(false);
  const [isEditingAddressInstruction, setIsEditingAddressInstruction] = useState(false);
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [addressInstruction, setAddressInstruction] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) return <UserProfileShimmer />;
  if (error) return <UserProfileShimmerRed />;
  if(!data?.user) return <UserProfileShimmer />;
  
  const user: User = data?.user;

  const handlePhoneUpdate = async () => {
    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

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

  const handleBusinessNameUpdate = async () => {
    if (!businessName.trim()) {
      alert('Please enter a business name');
      return;
    }

    try {
      await updateUserBusinessName({
        variables: {
          id: userId,
          businessName: businessName
        }
      });
      setIsEditingBusinessName(false);
      refetch();
      alert('Business name updated successfully!');
    } catch (error) {
      console.error('Error updating business name:', error);
      alert('Failed to update business name. Please try again.');
    }
  };

  const handleBusinessTypeUpdate = async () => {
    if (!businessType.trim()) {
      alert('Please enter business type');
      return;
    }

    try {
      await updateUserBusinessType({
        variables: {
          id: userId,
          businessType: businessType
        }
      });
      setIsEditingBusinessType(false);
      refetch();
      alert('Business type updated successfully!');
    } catch (error) {
      console.error('Error updating business type:', error);
      alert('Failed to update business type. Please try again.');
    }
  };

  const handleProductCategoryUpdate = async () => {
    if (!productCategory.trim()) {
      alert('Please enter product category');
      return;
    }

    try {
      await updateUserProductCategory({
        variables: {
          id: userId,
          productCategory: productCategory
        }
      });
      setIsEditingProductCategory(false);
      refetch();
      alert('Product category updated successfully!');
    } catch (error) {
      console.error('Error updating product category:', error);
      alert('Failed to update product category. Please try again.');
    }
  };

  const handleBusinessDescriptionUpdate = async () => {
    if (!businessDescription.trim()) {
      alert('Please enter business description');
      return;
    }

    try {
      await updateUserBusinessDescription({
        variables: {
          id: userId,
          businessDescription: businessDescription
        }
      });
      setIsEditingBusinessDescription(false);
      refetch();
      alert('Business description updated successfully!');
    } catch (error) {
      console.error('Error updating business description:', error);
      alert('Failed to update business description. Please try again.');
    }
  };

  const handleWebsiteUpdate = async () => {
    if (!website.trim()) {
      alert('Please enter website URL');
      return;
    }

    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlRegex.test(website)) {
      alert('Please enter a valid website URL');
      return;
    }

    try {
      await updateUserWebsite({
        variables: {
          id: userId,
          website: website
        }
      });
      setIsEditingWebsite(false);
      refetch();
      alert('Website updated successfully!');
    } catch (error) {
      console.error('Error updating website:', error);
      alert('Failed to update website. Please try again.');
    }
  };

  const handleBusinessAddressUpdate = async () => {
    if (!businessAddress.trim()) {
      alert('Please enter business address');
      return;
    }

    try {
      await updateUserBusinessAddress({
        variables: {
          id: userId,
          businessAddress: businessAddress
        }
      });
      setIsEditingBusinessAddress(false);
      refetch();
      alert('Business address updated successfully!');
    } catch (error) {
      console.error('Error updating business address:', error);
      alert('Failed to update business address. Please try again.');
    }
  };

  const handleAddressInstructionUpdate = async () => {
    if (!addressInstruction.trim()) {
      alert('Please enter address instructions');
      return;
    }

    try {
      await updateUserAddressInstruction({
        variables: {
          id: userId,
          addressInstruction: addressInstruction
        }
      });
      setIsEditingAddressInstruction(false);
      refetch();
      alert('Address instructions updated successfully!');
    } catch (error) {
      console.error('Error updating address instructions:', error);
      alert('Failed to update address instructions. Please try again.');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, GIF, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    
    try {
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

  // Reusable component for info rows
  const InfoRow = ({ icon: Icon, label, value, isEditing, onEdit, onSave, onCancel, editValue, setEditValue, placeholder, isTextarea = false, rows = 2 }: any) => (
    <div className="flex items-start gap-2 md:gap-3 mt-2 md:mt-3 text-gray-700 w-full">
      <div className="flex-shrink-0 mt-1">
        <Icon className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
            {isTextarea ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm w-full"
                rows={rows}
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm w-full"
                autoFocus
              />
            )}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={onSave}
                className="p-1.5 bg-lime-500 text-white rounded-md hover:bg-lime-600 transition-colors"
                aria-label="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onCancel}
                className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2 w-full">
            <div className="flex-1 min-w-0">
              {label && <span className="text-xs md:text-sm text-gray-500">{label}</span>}
              <p className="text-sm md:text-base break-words whitespace-pre-wrap">
                {value || 'Not provided'}
              </p>
            </div>
            <button
              onClick={onEdit}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              aria-label="Edit"
            >
              <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-0">
      <div className="max-w-2xl mx-auto px-3 md:px-0">
        {/* Cover Photo */}
        <div className="h-32 md:h-36 relative overflow bg-gradient-to-r from-gray-500 to-gray-800 bg-opacity-90 backdrop-blur-sm">
          <div className="absolute bottom-0 w-full h-1/2"></div>
          
          {/* Profile Picture - Made Uploadable */}
          <div className="absolute -bottom-10 md:-bottom-12 left-3 md:left-4 transform md:transform-none group">
            <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32">
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg">
                <Image
                  src={user.avatar?user.avatar:'/NoImage_2.webp'}
                  alt={`${user.firstName}'s avatar`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 80px, (max-width: 1024px) 96px, 128px"
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
                  <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 md:w-5 md:h-5 text-white" />
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
        <div className="max-w-4xl mx-auto px-2 md:px-4 pt-14 md:pt-16 pb-4">
          <div className="flex flex-col">
            <div className="w-full">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                @{user.firstName.toLowerCase()}{user.lastName.toLowerCase()}
              </p>
              
              {/* Business Name */}
              <InfoRow
                icon={Building2}
                value={user.businessName}
                isEditing={isEditingBusinessName}
                onEdit={() => {
                  setBusinessName(user.businessName || '');
                  setIsEditingBusinessName(true);
                }}
                onSave={handleBusinessNameUpdate}
                onCancel={() => {
                  setIsEditingBusinessName(false);
                  setBusinessName(user.businessName || '');
                }}
                editValue={businessName}
                setEditValue={setBusinessName}
                placeholder="Enter business name"
              />

              {/* Business Type */}
              <InfoRow
                icon={Briefcase}
                label="Business Type"
                value={user.businessType}
                isEditing={isEditingBusinessType}
                onEdit={() => {
                  setBusinessType(user.businessType || '');
                  setIsEditingBusinessType(true);
                }}
                onSave={handleBusinessTypeUpdate}
                onCancel={() => {
                  setIsEditingBusinessType(false);
                  setBusinessType(user.businessType || '');
                }}
                editValue={businessType}
                setEditValue={setBusinessType}
                placeholder="Enter business type (e.g., Retail, Wholesale, Service)"
              />

              {/* Product Category */}
              <InfoRow
                icon={Package}
                label="Product Category"
                value={user.productCategory}
                isEditing={isEditingProductCategory}
                onEdit={() => {
                  setProductCategory(user.productCategory || '');
                  setIsEditingProductCategory(true);
                }}
                onSave={handleProductCategoryUpdate}
                onCancel={() => {
                  setIsEditingProductCategory(false);
                  setProductCategory(user.productCategory || '');
                }}
                editValue={productCategory}
                setEditValue={setProductCategory}
                placeholder="Enter product category (e.g., Electronics, Clothing, Food)"
              />

              {/* Business Description */}
              <InfoRow
                icon={FileText}
                label="Business Description"
                value={user.businessDescription}
                isEditing={isEditingBusinessDescription}
                onEdit={() => {
                  setBusinessDescription(user.businessDescription || '');
                  setIsEditingBusinessDescription(true);
                }}
                onSave={handleBusinessDescriptionUpdate}
                onCancel={() => {
                  setIsEditingBusinessDescription(false);
                  setBusinessDescription(user.businessDescription || '');
                }}
                editValue={businessDescription}
                setEditValue={setBusinessDescription}
                placeholder="Enter business description"
                isTextarea={true}
                rows={3}
              />

              {/* Website */}
              <div className="flex items-start gap-2 md:gap-3 mt-2 md:mt-3 text-gray-700 w-full">
                <div className="flex-shrink-0 mt-1">
                  <Globe className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  {isEditingWebsite ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="Enter website URL"
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm w-full"
                        autoFocus
                      />
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={handleWebsiteUpdate}
                          className="p-1.5 bg-lime-500 text-white rounded-md hover:bg-lime-600 transition-colors"
                          aria-label="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingWebsite(false);
                            setWebsite(user.website || '');
                          }}
                          className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                          aria-label="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs md:text-sm text-gray-500">Website</span>
                        {user.website ? (
                          <a 
                            href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm md:text-base text-lime-600 hover:text-lime-700 hover:underline break-all block"
                          >
                            {user.website}
                          </a>
                        ) : (
                          <p className="text-sm md:text-base break-words">Not provided</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setWebsite(user.website || '');
                          setIsEditingWebsite(true);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                        aria-label="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Address */}
              <InfoRow
                icon={Home}
                label="Business Address"
                value={user.businessAddress}
                isEditing={isEditingBusinessAddress}
                onEdit={() => {
                  setBusinessAddress(user.businessAddress || '');
                  setIsEditingBusinessAddress(true);
                }}
                onSave={handleBusinessAddressUpdate}
                onCancel={() => {
                  setIsEditingBusinessAddress(false);
                  setBusinessAddress(user.businessAddress || '');
                }}
                editValue={businessAddress}
                setEditValue={setBusinessAddress}
                placeholder="Enter business address"
                isTextarea={true}
                rows={2}
              />

              {/* Address Instruction */}
              <InfoRow
                icon={MapPin}
                label="Delivery Instructions"
                value={user.addressInstruction}
                isEditing={isEditingAddressInstruction}
                onEdit={() => {
                  setAddressInstruction(user.addressInstruction || '');
                  setIsEditingAddressInstruction(true);
                }}
                onSave={handleAddressInstructionUpdate}
                onCancel={() => {
                  setIsEditingAddressInstruction(false);
                  setAddressInstruction(user.addressInstruction || '');
                }}
                editValue={addressInstruction}
                setEditValue={setAddressInstruction}
                placeholder="Enter delivery instructions (e.g., gate code, landmark, special notes)"
                isTextarea={true}
                rows={2}
              />

              {/* Phone Number */}
              <InfoRow
                icon={Phone}
                label="Phone Number"
                value={user.phone}
                isEditing={isEditingPhone}
                onEdit={() => {
                  setPhoneNumber(user.phone || '');
                  setIsEditingPhone(true);
                }}
                onSave={handlePhoneUpdate}
                onCancel={() => {
                  setIsEditingPhone(false);
                  setPhoneNumber(user.phone || '');
                }}
                editValue={phoneNumber}
                setEditValue={setPhoneNumber}
                placeholder="Enter phone number"
              />
              
              <div className="flex gap-4 md:gap-6 mt-4 md:mt-6 text-gray-700 text-xs md:text-sm">
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
          <div className="mt-4 md:mt-6">
            <ProfileTabs 
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabsConfig={[
                { id: 'address', label: 'Addresses', icon: 'location' },
              ]}
            />
          </div>
        </div>

        {/* Tab Content */}
        <TabContent activeTab={activeTab} user={user} userId={userId} refetch={refetch} />
      </div>
    </div>
  );
};

export default UserProfile;
