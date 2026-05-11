import React, { useState } from 'react';
import { Star, StarHalf, User, Calendar, Camera } from 'lucide-react';

interface ReviewImage {
  url?: string;
  src?: string;
  [key: string]: any;
}

// Updated Review interface to match the global type
interface Review {
  id?: string;
  productId?: string;
  userId?: string;
  variantId?: string | null;
  rating: number;
  images?: ReviewImage[];
  comment?: string;
  createdAt?: string | Date; // Allow both string and Date
}

// Make ProductVariant flexible
interface ProductVariant {
  id?: string;
  name?: string;
  sku?: string;
  price?: number;
  salePrice?: number;
  stock?: number;
  size?: string;
  color?: string;
  model?: string;
  images?: any[];
  reviews?: Review[];
  createdAt?: string | Date;
}

interface ProductReviewsProps {
  product: ProductVariant;
}

// Helper function to render star ratings
const renderStars = (rating: number) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    stars.push(<Star key={`star-${i}`} className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
  }
  
  if (hasHalfStar) {
    stars.push(<StarHalf key="half-star" className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
  }
  
  const emptyStars = 5 - stars.length;
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />);
  }
  
  return stars;
};

// Format date to readable string - now handles Date objects
const formatDate = (dateString?: string | Date) => {
  if (!dateString) return 'Recent';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Recent';
  }
};

// Individual Review Card Component
const ReviewCard: React.FC<{ review: Review; index: number }> = ({ review, index }) => {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleImageError = (imgIndex: number) => {
    setImageErrors(prev => new Set(prev).add(imgIndex));
  };

  const getImageUrl = (image: ReviewImage): string | null => {
    if (!image) return null;
    if (typeof image === 'string') return image;
    if (image.url) return image.url;
    if (image.src) return image.src;
    return null;
  };

  const reviewImages = review.images?.filter(img => getImageUrl(img)) || [];

  // Helper to safely get date for sorting
  const getReviewDate = (date?: string | Date): number => {
    if (!date) return 0;
    if (date instanceof Date) return date.getTime();
    return new Date(date).getTime();
  };

  return (
    <div key={review.id || index} className="border-b border-gray-200 pb-6 last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Customer {review.userId?.slice(-6) || 'Anonymous'}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-0.5">
                {renderStars(review.rating)}
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(review.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Verified Purchase
          </span>
        </div>
      </div>
      
      {review.comment && (
        <div className="mt-3 ml-13">
          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
        </div>
      )}
      
      {reviewImages.length > 0 && (
        <div className="mt-4 ml-13">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Customer Photos ({reviewImages.length})</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {reviewImages.map((img, imgIdx) => {
              const imgUrl = getImageUrl(img);
              if (!imgUrl || imageErrors.has(imgIdx)) return null;
              
              return (
                <div 
                  key={imgIdx} 
                  className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(imgUrl, '_blank')}
                >
                  <img 
                    src={imgUrl} 
                    alt={`Review image ${imgIdx + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(imgIdx)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Reviews Component
const ProductReviews: React.FC<ProductReviewsProps> = ({ product }) => {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  
  // Add safety check for product
  if (!product || typeof product !== 'object') {
    return null;
  }
  
  const reviews = product?.reviews || [];
  
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => Math.floor(r.rating) === rating).length
  }));
  
  const filteredReviews = reviews.filter(review => {
    if (filterRating === null) return true;
    return Math.floor(review.rating) === filterRating;
  });
  
  // Helper to safely get timestamp from Date or string
  const getTimestamp = (date?: string | Date): number => {
    if (!date) return 0;
    if (date instanceof Date) return date.getTime();
    return new Date(date).getTime();
  };
  
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
      case 'oldest':
        return getTimestamp(a.createdAt) - getTimestamp(b.createdAt);
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });
  
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No Reviews Yet</h3>
          <p className="text-gray-500 mt-2">Be the first to review this product!</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Customer Reviews</h2>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <div className="flex">{renderStars(averageRating)}</div>
                <span className="font-medium text-gray-900 ml-1">{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-gray-500 text-sm">Based on {reviews.length} reviews</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row">
        <div className="md:w-64 border-r border-gray-200 p-6 bg-gray-50/30">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
            <div className="flex justify-center mt-2">{renderStars(averageRating)}</div>
          </div>
          
          <div className="space-y-2">
            {ratingDistribution.map(({ rating, count }) => (
              <button
                key={rating}
                onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                className={`w-full flex items-center gap-2 text-sm py-1 px-2 rounded transition-colors ${
                  filterRating === rating ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                <span className="w-8 text-gray-600">{rating} ★</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-gray-500 text-xs w-8">{count}</span>
              </button>
            ))}
          </div>
          
          {filterRating && (
            <button
              onClick={() => setFilterRating(null)}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 w-full text-center"
            >
              Clear Filter
            </button>
          )}
        </div>
        
        <div className="flex-1 p-6">
          <div className="space-y-6">
            {sortedReviews.map((review, idx) => (
              <ReviewCard key={review.id || idx} review={review} index={idx} />
            ))}
          </div>
          
          {sortedReviews.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No reviews match the selected filter.</p>
              <button
                onClick={() => setFilterRating(null)}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;
