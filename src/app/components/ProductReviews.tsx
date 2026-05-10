import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { 
  Star, 
  StarHalf, 
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Clock,
  Edit2,
  MessageCircle
} from 'lucide-react';

// ============ TYPES ============

interface ReviewImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  publicId: string;
  position: number;
  createdAt: string;
}

interface ReviewUser {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface Review {
  id: string;
  userId: string;
  productId: string;
  variantId?: string;
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt?: string;
  user: ReviewUser;
  images: ReviewImage[];
}

interface GetProductReviewsResponse {
  getProductReviews: Review[];
}

// ============ GRAPHQL QUERY ============

export const GET_PRODUCT_REVIEWS = gql`
  query GetProductReviews($id: String!) {
    getReviewById(id: $id) {
      id
      userId
      productId
      variantId
      rating
      title
      comment
      isApproved
      createdAt
      updatedAt
      user {
        id
        name
        email
      }
      images {
        id
        url
        publicId
        position
        createdAt
      }
    }
  }
`;

// ============ UTILITY FUNCTIONS ============

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInHours < 48) return 'Yesterday';
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
  return formatDate(dateString);
};

const getUserDisplayName = (user: ReviewUser): string => {
  if (user.name) return user.name;
  if (user.email) return user.email.split('@')[0];
  return 'Anonymous User';
};

// ============ RATING STARS COMPONENT ============

interface RatingStarsProps {
  rating: number;
  size?: number;
  showLabel?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating, 
  size = 20, 
  showLabel = false
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={size} fill="#fbbf24" className="text-amber-400" />
        ))}
        {hasHalfStar && (
          <StarHalf key="half" size={size} fill="#fbbf24" className="text-amber-400" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={size} className="text-gray-300" />
        ))}
      </div>
      {showLabel && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

// ============ IMAGE GALLERY COMPONENT ============

interface ImageGalleryProps {
  images: ReviewImage[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative group cursor-pointer overflow-hidden rounded-lg"
            onClick={() => setSelectedImage(image.url)}
          >
            <img
              src={image.url}
              alt={`Review image ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
          </div>
        ))}
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors z-10"
          >
            ✕
          </button>
          <img 
            src={selectedImage} 
            alt="Full size review" 
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

// ============ SINGLE REVIEW CARD ============

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-white" />
          </div>
          
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900">
                {getUserDisplayName(review.user)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <RatingStars rating={review.rating} size={16} />
              <span className="text-xs text-gray-500">
                {formatRelativeDate(review.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {review.title}
      </h3>
      
      <p className="text-gray-700 leading-relaxed">
        {review.comment}
      </p>
      
      <ImageGallery images={review.images} />
      
      {review.updatedAt && review.updatedAt !== review.createdAt && (
        <div className="mt-2 text-xs text-gray-400">
          Edited {formatRelativeDate(review.updatedAt)}
        </div>
      )}
    </div>
  );
};

// ============ MAIN PRODUCT REVIEWS COMPONENT ============

interface ProductReviewsProps {
  productId: string;
  className?: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ 
  productId,
  className = ''
}) => {
  const { loading, error, data, refetch } = useQuery<GetProductReviewsResponse>(
    GET_PRODUCT_REVIEWS,
    {
      variables: { id: productId },
      fetchPolicy: 'network-only',
    }
  );

  if (loading) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Reviews</h3>
          <p className="text-red-600 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const reviews = data?.getReviewById || [];
  const approvedReviews = reviews.filter(review => review.isApproved);

  if (approvedReviews.length === 0) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-600">Be the first to review this product!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="space-y-4">
        {approvedReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;
