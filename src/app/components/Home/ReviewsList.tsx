import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client';
import { Star, StarHalf, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

// ============ TYPES ============

interface ReviewImage {
  id: string;
  url: string;
  publicId: string;
  position: number;
  createdAt: string;
}

interface ReviewUser {
  id: string;
  name?: string;  // Made optional
  firstName?: string;  // Alternative field
  lastName?: string;   // Alternative field
  email?: string;      // Made optional
  username?: string;   // Alternative field
}

interface ReviewProduct {
  id: string;
  name: string;
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
  user: ReviewUser;
  product?: ReviewProduct;
  images: ReviewImage[];
}

interface GetReviewsInput {
  productId?: string;
  rating?: number;
  isApproved?: boolean;
  page?: number;
  limit?: number;
}

interface MetaData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface GetReviewsResponse {
  getReviews: {
    data: Review[];
    meta: MetaData;
  };
}

interface RatingStarsProps {
  rating: number;
  size?: number;
}

interface ReviewCardProps {
  review: Review;
}

interface ReviewFiltersProps {
  filters: GetReviewsInput;
  onFilterChange: (filters: GetReviewsInput) => void;
  onApplyFilters: (filters: GetReviewsInput) => void;
}

interface PaginationProps {
  meta: MetaData;
  onPageChange: (page: number) => void;
}

interface ReviewsListProps {
  initialFilters?: GetReviewsInput;
}

// ============ GRAPHQL QUERY ============

// FIXED QUERY - Removed 'name' field if it doesn't exist on User
export const GET_REVIEWS = gql`
  query GetReviews($filters: GetReviewsInput) {
    getReviews(filters: $filters) {
      data {
        id
        userId
        productId
        variantId
        rating
        title
        comment
        isApproved
        createdAt
        user {
          id
          email
          # Remove 'name' if it doesn't exist, or use alternative fields:
          # firstName
          # lastName
          # username
        }
        product {
          id
          name
        }
        images {
          id
          url
          publicId
          position
          createdAt
        }
      }
      meta {
        total
        page
        limit
        totalPages
      }
    }
  }
`;

// Alternative query if you have firstName and lastName:
export const GET_REVIEWS_ALTERNATIVE = gql`
  query GetReviews($filters: GetReviewsInput) {
    getReviews(filters: $filters) {
      data {
        id
        userId
        productId
        variantId
        rating
        title
        comment
        isApproved
        createdAt
        user {
          id
          firstName
          lastName
          email
        }
        product {
          id
          name
        }
        images {
          id
          url
          publicId
          position
          createdAt
        }
      }
      meta {
        total
        page
        limit
        totalPages
      }
    }
  }
`;

// ============ RATING STARS COMPONENT ============

const RatingStars: React.FC<RatingStarsProps> = ({ rating, size = 16 }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} size={size} fill="#fbbf24" className="text-amber-400" />
      ))}
      {hasHalfStar && <StarHalf size={size} fill="#fbbf24" className="text-amber-400" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} size={size} className="text-gray-300" />
      ))}
    </div>
  );
};

// ============ REVIEW CARD COMPONENT ============

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const [showFullComment, setShowFullComment] = useState<boolean>(false);
  const maxCommentLength: number = 200;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shouldTruncate: boolean = review.comment?.length > maxCommentLength;
  const displayedComment: string = showFullComment || !shouldTruncate
    ? review.comment
    : `${review.comment?.slice(0, maxCommentLength)}...`;

  // Helper function to get user display name
  const getUserDisplayName = (user: ReviewUser): string => {
    if (user.name) return user.name;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    return 'Anonymous';
  };

  return (
    <div className="bg-white p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{review.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={review.rating} size={16} />
            <span className="text-sm text-gray-500">
              {review.rating.toFixed(1)}
            </span>
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {formatDate(review.createdAt)}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600">
          by <span className="font-medium">{getUserDisplayName(review.user)}</span>
          {review.product && (
            <span className="text-gray-400">
              {' '}on <span className="font-medium">{review.product.name}</span>
            </span>
          )}
        </p>
      </div>

      <p className="text-gray-700 mb-3 leading-relaxed">
        {displayedComment}
        {shouldTruncate && (
          <button
            onClick={() => setShowFullComment(!showFullComment)}
            className="ml-2 text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            {showFullComment ? 'Show less' : 'Read more'}
          </button>
        )}
      </p>

      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mt-3">
          {review.images.slice(0, 3).map((image, index) => (
            <div key={image.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={`Review image ${image.position}`}
                className="w-16 h-16 object-cover rounded-md border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(image.url, '_blank')}
              />
              {review.images.length > 3 && index === 2 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center text-white text-sm font-medium">
                  +{review.images.length - 3}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!review.isApproved && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            Pending Approval
          </span>
        </div>
      )}
    </div>
  );
};

// ============ FILTER COMPONENT ============

const ReviewFilters: React.FC<ReviewFiltersProps> = ({ filters, onFilterChange, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState<GetReviewsInput>(filters);

  const handleChange = (key: keyof GetReviewsInput, value: any): void => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = (): void => {
    onApplyFilters(localFilters);
  };

  const handleReset = (): void => {
    const resetFilters: GetReviewsInput = { page: 1, limit: 10 };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product ID
          </label>
          <input
            type="text"
            value={localFilters.productId || ''}
            onChange={(e) => handleChange('productId', e.target.value)}
            placeholder="Filter by product"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rating
          </label>
          <select
            value={localFilters.rating || ''}
            onChange={(e) => handleChange('rating', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars & up</option>
            <option value="3">3 stars & up</option>
            <option value="2">2 stars & up</option>
            <option value="1">1 star & up</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Approval Status
          </label>
          <select
            value={localFilters.isApproved !== undefined ? String(localFilters.isApproved) : ''}
            onChange={(e) => {
              const value = e.target.value;
              handleChange('isApproved', value === '' ? undefined : value === 'true');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All reviews</option>
            <option value="true">Approved only</option>
            <option value="false">Pending only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Items per page
          </label>
          <select
            value={localFilters.limit || 10}
            onChange={(e) => handleChange('limit', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

// ============ PAGINATION COMPONENT ============

const Pagination: React.FC<PaginationProps> = ({ meta, onPageChange }) => {
  const { page, totalPages } = meta;
  const maxVisible: number = 5;
  
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronLeft size={20} />
      </button>
      
      {getPageNumbers().map(pageNum => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          className={`px-3 py-1 rounded-md ${
            pageNum === page
              ? 'bg-blue-500 text-white'
              : 'border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {pageNum}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

// ============ LOADING SKELETON ============

const ReviewSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </div>
    <div className="space-y-2 mb-3">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
    <div className="flex gap-2">
      <div className="w-16 h-16 bg-gray-200 rounded"></div>
      <div className="w-16 h-16 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// ============ EMPTY STATE COMPONENT ============

const EmptyState: React.FC = () => (
  <div className="text-center py-12">
    <div className="text-gray-400 mb-3">
      <ImageIcon size={48} className="mx-auto" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-1">No reviews found</h3>
    <p className="text-gray-500">Try adjusting your filters or check back later</p>
  </div>
);

// ============ MAIN REVIEWS COMPONENT ============

const ReviewsList: React.FC<ReviewsListProps> = ({ initialFilters = { page: 1, limit: 10 } }) => {
  const [filters, setFilters] = useState<GetReviewsInput>(initialFilters);
  
  const { loading, error, data, refetch } = useQuery<GetReviewsResponse, { filters: GetReviewsInput }>(
    GET_REVIEWS,
    {
      variables: { filters },
      fetchPolicy: 'network-only',
    }
  );

  const handleFilterChange = (newFilters: GetReviewsInput): void => {
    setFilters(newFilters);
  };

  const handlePageChange = (newPage: number): void => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefetch = (): void => {
    refetch({ filters });
  };

  if (error) {
    console.error('GraphQL Error:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600 mb-2">Error loading reviews</p>
        <p className="text-sm text-red-500">{error.message}</p>
        <button
          onClick={handleRefetch}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const reviews: Review[] = data?.getReviews?.data || [];
  const meta: MetaData | undefined = data?.getReviews?.meta;

  return (
    <div className="max-w-7xl mx-auto p-0">
      {/*  <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
        {meta && (
          <p className="text-gray-600 mt-1">
            Showing {reviews.length} of {meta.total} reviews
          </p>
        )}
      </div>

      <ReviewFilters
        filters={filters}
        onFilterChange={setFilters}
        onApplyFilters={handleFilterChange}
      />*/}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <ReviewSkeleton key={i} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          
          {meta && meta.totalPages > 1 && (
            <Pagination meta={meta} onPageChange={handlePageChange} />
          )}
        </>
      )}
    </div>
  );
};

export default ReviewsList;
