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

  return (
    <div className="min-h-screen p-0">
      <div className="max-w-2xl mx-auto">
        {/* Cover Photo */}
        <div className="h-36 relative overflow bg-gradient-to-r from-gray-500 to-gray-800 bg-opacity-90 backdrop-blur-sm">
          <div className="absolute bottom-0 w-full h-1/2"></div>
          
          {/* Profile Picture - Made Uploadable */}
          <div className="absolute -bottom-12 md:-bottom-16 left-4 md:left-8 transform md:transform-none group">
            <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40">
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg">
                <Image
                  src={user.avatar?user.avatar:'/NoImage_2.webp'}
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
                  <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
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
              
              {/* Business Name */}
              <div className="flex items-center gap-2 mt-3 text-gray-700">
                <Building2 className="w-5 h-5 text-gray-500" />
                {isEditingBusinessName ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Enter business name"
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleBusinessNameUpdate}
                        className="p-1 bg-lime-500 text-white rounded-md hover:bg-lime-600 transition-colors"
                        aria-label="Save business name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingBusinessName(false);
                          setBusinessName(user.businessName || '');
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
                    <span className="text-sm md:text-base font-medium">
                      {user.businessName || 'Business name not provided'}
                    </span>
                    <button
                      onClick={() => {
                        setBusinessName(user.businessName || '');
                        setIsEditingBusinessName(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Edit business name"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Business Type */}
              <div className="flex items-center gap-2 mt-2 text-gray-700">
                <Briefcase className="w-5 h-5 text-gray-500" />
                {isEditingBusinessType ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      placeholder="Enter business type (e.g., Retail, Wholesale, Service)"
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleBusinessTypeUpdate}
                        className="p-1 bg-lime-500 text-white rounded-md hover:bg-lime-600 transition-colors"
                        aria-label="Save business type"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingBusinessType(false);
                          setBusinessType(user.businessType || '');
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
                      Business Type: {user.businessType || 'Not specified'}
                    </span>
                    <button
                      onClick={() => {
                        setBusinessType(user.businessType || '');
                        setIsEditingBusinessType(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Edit business type"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Product Category */}
              <div className="flex items-center gap-2 mt-2 text-gray-700">
                <Package className="w-5 h-5 text-gray-500" />
                {isEditingProductCategory ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      placeholder="Enter product category (e.g., Electronics, Clothing, Food)"
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleProductCategoryUpdate}
                        className="p-1 bg-lime-500 text-white rounded-md hover:bg-lime-600 transition-colors"
                        aria-label="Save product category"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingProductCategory(false);
                          setProductCategory(user.productCategory || '');
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
                      Product Category: {user.productCategory || 'Not specified'}
                    </span>
                    <button
                      onClick={() => {
                        setProductCategory(user.productCategory || '');
                        setIsEditingProductCategory(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Edit product category"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Business Description */}
              <div className="flex items-start gap-2 mt-2 text-gray-700">
                <FileText className="w-5 h-5 text-gray-500 mt-1" />
                {isEditingBusinessDescription ? (
                  <div className="flex items-start gap-2 flex-wrap w-full">
                    <textarea
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      placeholder="Enter business description"
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm w-full min-w-[200px]"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleBusinessDescriptionUpdate}
                        className="p-1 bg-lime-500 text-white rounded-md hover:bg-lime-600 transition-colors"
                        aria-label="Save business description"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingBusinessDescription(false);
                          setBusinessDescription(user.businessDescription || '');
                        }}
                        className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                        aria-label="Cancel editing"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="text-sm md:text-base flex-1">
                      {user.businessDescription || 'No business description provided'}
                    </span>
                    <button
                      onClick={() => {
                        setBusinessDescription(user.businessDescription || '');
                        setIsEditingBusinessDescription(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                      aria-label="Edit business description"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Website */}
              <div className="flex items-center gap-2 mt-2 text-gray-700">
                <Globe className="w-5 h-5 text-gray-500" />
                {isEditingWebsite ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="Enter website URL"
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleWebsiteUpdate}
                        className="p-1 bg-lime-500 text-white rounded-md hover:bg-lime-600 transition-colors"
                        aria-label="Save website"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingWebsite(false);
                          setWebsite(user.website || '');
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
                    {user.website ? (
                      <a 
                        href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm md:text-base text-lime-600 hover:text-lime-700 hover:underline"
                      >
                        {user.website}
                      </a>
                    ) : (
                      <span className="text-sm md:text-base">No website provided</span>
                    )}
                    <button
                      onClick={() => {
                        setWebsite(user.website || '');
                        setIsEditingWebsite(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Edit website"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Business Address */}
              <div className="flex items-start gap-2 mt-2 text-gray-700">
                <Home className="w-5 h-5 text-gray-500 mt-1" />
                {isEditingBusinessAddress ? (
                  <div className="flex items-start gap-2 flex-wrap w-full">
                    <textarea
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="Enter business address"
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm w-full min-w-[200px]"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleBusinessAddressUpdate}
                        className="p-1 bg-lime-500 text-white rounded-md hover:bg-lime-600 transition-colors"
                        aria-label="Save business address"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingBusinessAddress(false);
                          setBusinessAddress(user.businessAddress || '');
                        }}
                        className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                        aria-label="Cancel editing"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="text-sm md:text-base flex-1">
                      {user.businessAddress || 'Business address not provided'}
                    </span>
                    <button
                      onClick={() => {
                        setBusinessAddress(user.businessAddress || '');
                        setIsEditingBusinessAddress(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                      aria-label="Edit business address"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Address Instruction */}
              <div className="flex items-start gap-2 mt-2 text-gray-700">
                <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                {isEditingAddressInstruction ? (
                  <div className="flex items-start gap-2 flex-wrap w-full">
                    <textarea
                      value={addressInstruction}
                      onChange={(e) => setAddressInstruction(e.target.value)}
                      placeholder="Enter delivery instructions (e.g., gate code, landmark, special notes)"
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm w-full min-w-[200px]"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddressInstructionUpdate}
                        className="p-1 bg-lime-500 text-white rounded-md hover:bg-lime-600 transition-colors"
                        aria-label="Save address instructions"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingAddressInstruction(false);
                          setAddressInstruction(user.addressInstruction || '');
                        }}
                        className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                        aria-label="Cancel editing"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="text-sm md:text-base flex-1">
                      Delivery Instructions: {user.addressInstruction || 'Not provided'}
                    </span>
                    <button
                      onClick={() => {
                        setAddressInstruction(user.addressInstruction || '');
                        setIsEditingAddressInstruction(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                      aria-label="Edit address instructions"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div className="flex items-center gap-2 mt-2 text-gray-700">
                <Phone className="w-5 h-5 text-gray-500" />
                {isEditingPhone ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handlePhoneUpdate}
                        className="p-1 bg-lime-500 text-white rounded-md hover:bg-lime-600 transition-colors"
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
              { id: 'address', label: 'Addresses', icon: 'location' },
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
