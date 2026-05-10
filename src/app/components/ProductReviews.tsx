import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { 
  Star, 
  StarHalf, 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  Share2, 
  Edit2, 
  Trash2,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  MapPin,
  ShoppingBag,
  Clock,
  ArrowLeft,
  ExternalLink
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
  location?: string;
  memberSince?: string;
  totalReviews?: number;
  helpfulVotes?: number;
}

interface ReviewProduct {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  image?: string;
  category?: string;
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
  product?: ReviewProduct;
  images: ReviewImage[];
  helpfulCount?: number;
  notHelpfulCount?: number;
  isVerifiedPurchase?: boolean;
  reply?: {
    id: string;
    comment: string;
    createdAt: string;
    user: ReviewUser;
  };
}

interface GetReviewByIdResponse {
  getReviewById: Review;
}

interface UpdateReviewInput {
  rating?: number;
  title?: string;
  comment?: string;
}

interface DeleteReviewResponse {
  deleteReview: {
    success: boolean;
    message: string;
  };
}

interface VoteReviewResponse {
  voteReview: {
    success: boolean;
    message: string;
    helpfulCount: number;
  };
}

// ============ GRAPHQL QUERIES & MUTATIONS ============

export const GET_REVIEW_BY_ID = gql`
  query GetReviewById($id: String!) {
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
      user {
        id
        name
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
  }
`;

const UPDATE_REVIEW = gql`
  mutation UpdateReview($id: String!, $input: UpdateReviewInput!) {
    updateReview(id: $id, input: $input) {
      id
      rating
      title
      comment
      updatedAt
    }
  }
`;

const DELETE_REVIEW = gql`
  mutation DeleteReview($id: String!) {
    deleteReview(id: $id) {
      success
      message
    }
  }
`;

const VOTE_REVIEW = gql`
  mutation VoteReview($reviewId: String!, $isHelpful: Boolean!) {
    voteReview(reviewId: $reviewId, isHelpful: $isHelpful) {
      success
      message
      helpfulCount
    }
  }
`;

const REPORT_REVIEW = gql`
  mutation ReportReview($reviewId: String!, $reason: String!) {
    reportReview(reviewId: $reviewId, reason: $reason) {
      success
      message
    }
  }
`;

// ============ UTILITY FUNCTIONS ============

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showLabel?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating, 
  size = 20, 
  interactive = false,
  onRatingChange,
  showLabel = false
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);
  
  const displayRating = hoverRating || rating;
  const fullStars = Math.floor(displayRating);
  const hasHalfStar = displayRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const handleClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <button
            key={`full-${i}`}
            onClick={() => handleClick(i)}
            onMouseEnter={() => interactive && setHoverRating(i + 1)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
            type="button"
          >
            <Star size={size} fill="#fbbf24" className="text-amber-400" />
          </button>
        ))}
        {hasHalfStar && (
          <button
            onClick={() => handleClick(fullStars)}
            onMouseEnter={() => interactive && setHoverRating(fullStars + 0.5)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
            type="button"
          >
            <StarHalf size={size} fill="#fbbf24" className="text-amber-400" />
          </button>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <button
            key={`empty-${i}`}
            onClick={() => handleClick(fullStars + (hasHalfStar ? 1 : 0) + i)}
            onMouseEnter={() => interactive && setHoverRating(fullStars + (hasHalfStar ? 1 : 0) + i + 1)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
            type="button"
          >
            <Star size={size} className="text-gray-300" />
          </button>
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
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  if (!images || images.length === 0) return null;

  const handleImageClick = (url: string, index: number) => {
    setSelectedImage(url);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    setSelectedImage(images[nextIndex].url);
    setCurrentIndex(nextIndex);
  };

  const handlePrevious = () => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setSelectedImage(images[prevIndex].url);
    setCurrentIndex(prevIndex);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative group cursor-pointer overflow-hidden rounded-lg"
            onClick={() => handleImageClick(image.url, index)}
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

      {/* Lightbox Modal */}
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
          
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all"
              >
                <ArrowLeft size={24} className="text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all"
              >
                <ArrowLeft size={24} className="text-white rotate-180" />
              </button>
            </>
          )}
          
          <img 
            src={selectedImage} 
            alt="Full size review" 
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
};

// ============ EDIT REVIEW MODAL ============

interface EditReviewModalProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (input: UpdateReviewInput) => Promise<void>;
}

const EditReviewModal: React.FC<EditReviewModalProps> = ({ review, isOpen, onClose, onUpdate }) => {
  const [rating, setRating] = useState<number>(review.rating);
  const [title, setTitle] = useState<string>(review.title);
  const [comment, setComment] = useState<string>(review.comment);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onUpdate({ rating, title, comment });
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold text-gray-900">Edit Review</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <RatingStars 
              rating={rating} 
              size={32} 
              interactive={true}
              onRatingChange={setRating}
              showLabel={true}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Summary of your experience"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your detailed experience..."
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Review'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============ DELETE REVIEW MODAL ============

interface DeleteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteReviewModal: React.FC<DeleteReviewModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Review</h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete your review? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ REPORT REVIEW MODAL ============

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

const ReportReviewModal: React.FC<ReportReviewModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    await onSubmit(reason);
    setIsSubmitting(false);
    onClose();
    setReason('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Review</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please explain why you're reporting this review..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
          rows={4}
        />
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Report'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ REVIEW ACTIONS MENU ============

interface ReviewActionsMenuProps {
  review: Review;
  currentUserId?: string;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  onVote: (isHelpful: boolean) => void;
  userVote?: 'helpful' | 'notHelpful' | null;
}

const ReviewActionsMenu: React.FC<ReviewActionsMenuProps> = ({
  review,
  currentUserId,
  onEdit,
  onDelete,
  onReport,
  onVote,
  userVote
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const isOwner = currentUserId === review.userId;

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      
      {isMenuOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
            {isOwner ? (
              <>
                <button
                  onClick={() => { onEdit(); setIsMenuOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Edit Review
                </button>
                <button
                  onClick={() => { onDelete(); setIsMenuOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Review
                </button>
              </>
            ) : (
              <button
                onClick={() => { onReport(); setIsMenuOpen(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Flag size={16} />
                Report Review
              </button>
            )}
          </div>
        </>
      )}
      
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={() => onVote(true)}
          className={`flex items-center gap-1 text-sm transition-colors ${
            userVote === 'helpful' 
              ? 'text-green-600' 
              : 'text-gray-500 hover:text-green-600'
          }`}
        >
          <ThumbsUp size={16} />
          <span>Helpful ({review.helpfulCount || 0})</span>
        </button>
        
        <button
          onClick={() => onVote(false)}
          className={`flex items-center gap-1 text-sm transition-colors ${
            userVote === 'notHelpful' 
              ? 'text-red-600' 
              : 'text-gray-500 hover:text-red-600'
          }`}
        >
          <ThumbsDown size={16} />
          <span>Not Helpful ({review.notHelpfulCount || 0})</span>
        </button>
        
        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
          <Share2 size={16} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

// ============ MAIN REVIEW COMPONENT ============

interface ProductReviewProps {
  reviewId: string;
  currentUserId?: string;
  onBack?: () => void;
  onReviewDeleted?: () => void;
  onReviewUpdated?: () => void;
}

const ProductReviews: React.FC<ProductReviewProps> = ({ 
  reviewId, 
  currentUserId,
  onBack,
  onReviewDeleted,
  onReviewUpdated
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [userVote, setUserVote] = useState<'helpful' | 'notHelpful' | null>(null);

  const { loading, error, data, refetch } = useQuery<GetReviewByIdResponse>(
    GET_REVIEW_BY_ID,
    {
      variables: { id: reviewId },
      fetchPolicy: 'network-only',
    }
  );

  const [updateReview] = useMutation(UPDATE_REVIEW);
  const [deleteReview] = useMutation<DeleteReviewResponse>(DELETE_REVIEW);
  const [voteReview] = useMutation(VOTE_REVIEW);
  const [reportReview] = useMutation(REPORT_REVIEW);

  const handleUpdateReview = async (input: UpdateReviewInput) => {
    try {
      await updateReview({
        variables: { id: reviewId, input }
      });
      await refetch();
      onReviewUpdated?.();
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  };

  const handleDeleteReview = async () => {
    try {
      const response = await deleteReview({
        variables: { id: reviewId }
      });
      if (response.data?.deleteReview.success) {
        onReviewDeleted?.();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleVote = async (isHelpful: boolean) => {
    if (userVote === (isHelpful ? 'helpful' : 'notHelpful')) return;
    
    try {
      await voteReview({
        variables: { reviewId, isHelpful }
      });
      setUserVote(isHelpful ? 'helpful' : 'notHelpful');
      await refetch();
    } catch (error) {
      console.error('Error voting on review:', error);
    }
  };

  const handleReport = async (reason: string) => {
    try {
      await reportReview({
        variables: { reviewId, reason }
      });
      alert('Review reported successfully');
    } catch (error) {
      console.error('Error reporting review:', error);
      alert('Failed to report review');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Review</h3>
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

  const review = data?.getReviewById;
  
  if (!review) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-yellow-400 mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Review Not Found</h3>
          <p className="text-yellow-600">The review you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Reviews</span>
        </button>
      )}

      {/* Review Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={24} className="text-white" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{review.title}</h1>
                <RatingStars rating={review.rating} size={20} showLabel={true} />
                
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>{getUserDisplayName(review.user)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{formatRelativeDate(review.createdAt)}</span>
                  </div>
                  {review.isVerifiedPurchase && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle size={14} />
                      <span>Verified Purchase</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <ReviewActionsMenu
              review={review}
              currentUserId={currentUserId}
              onEdit={() => setIsEditModalOpen(true)}
              onDelete={() => setIsDeleteModalOpen(true)}
              onReport={() => setIsReportModalOpen(true)}
              onVote={handleVote}
              userVote={userVote}
            />
          </div>
        </div>

        {/* Product Info */}
        {review.product && (
          <div className="bg-blue-50 p-4 border-b border-blue-100">
            <div className="flex items-start gap-3">
              <ShoppingBag size={20} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Product</p>
                <a 
                  href={`/product/${review.product.id}`}
                  className="font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {review.product.name}
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Review Content */}
        <div className="p-6">
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {review.comment}
            </p>
          </div>
          
          {/* Images */}
          <ImageGallery images={review.images} />
          
          {/* Status Badges */}
          <div className="flex gap-2 mt-4">
            {!review.isApproved && (
              <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                <Clock size={12} />
                Pending Approval
              </span>
            )}
            {review.updatedAt && review.updatedAt !== review.createdAt && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                <Edit2 size={12} />
                Edited
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditReviewModal
        review={review}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateReview}
      />
      
      <DeleteReviewModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteReview}
      />
      
      <ReportReviewModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReport}
      />
    </div>
  );
};

export default ProductReviews;
