// hooks/useGetReviewById.ts
import { useQuery } from '@apollo/client';
import { GET_REVIEW_BY_ID } from '../graphql/query';

interface ReviewImage {
  id: string;
  url: string;
  publicId: string;
  position: number;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
}

interface Review {
  id: string;
  userId: string;
  productId: string;
  variantId: string;
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  user: User;
  product: Product;
  images: ReviewImage[];
}

interface GetReviewByIdResponse {
  getReviewById: Review;
}

interface GetReviewByIdVariables {
  id: string;
}

export const useGetReviewById = (id: string) => {
  const { data, loading, error, refetch } = useQuery<
    GetReviewByIdResponse,
    GetReviewByIdVariables
  >(GET_REVIEW_BY_ID, {
    variables: { id },
    skip: !id,
  });

  const exportRatingData = () => {
    if (!data?.getReviewById) return null;

    const review = data.getReviewById;
    
    return {
      // Basic rating info
      rating: review.rating,
      reviewId: review.id,
      title: review.title,
      comment: review.comment,
      
      // Context info
      productName: review.product.name,
      productId: review.productId,
      userId: review.userId,
      userName: review.user.name,
      
      // Metadata
      isApproved: review.isApproved,
      createdAt: review.createdAt,
      ratingScore: `${review.rating}/5`,
      
      // For analytics
      ratingCategory: getRatingCategory(review.rating),
      hasComment: !!review.comment,
      imageCount: review.images.length,
    };
  };

  const exportToCSV = () => {
    const ratingData = exportRatingData();
    if (!ratingData) return;

    const headers = [
      'Review ID',
      'Rating',
      'Title',
      'Comment',
      'Product',
      'User',
      'Status',
      'Date',
    ];
    
    const row = [
      ratingData.reviewId,
      ratingData.rating,
      ratingData.title,
      ratingData.comment,
      ratingData.productName,
      ratingData.userName,
      ratingData.isApproved ? 'Approved' : 'Pending',
      new Date(ratingData.createdAt).toLocaleDateString(),
    ];

    const csvContent = [
      headers.join(','),
      row.map(cell => `"${cell}"`).join(','),
    ].join('\n');

    downloadCSV(csvContent, `review_${id}_rating.csv`);
  };

  const getRatingDetails = () => {
    if (!data?.getReviewById) return null;
    
    return {
      ratingValue: data.getReviewById.rating,
      maxRating: 5,
      percentage: (data.getReviewById.rating / 5) * 100,
      stars: getStarRating(data.getReviewById.rating),
    };
  };

  return {
    review: data?.getReviewById,
    rating: data?.getReviewById?.rating,
    loading,
    error,
    refetch,
    exportRatingData,
    exportToCSV,
    getRatingDetails,
  };
};

// Helper functions
const getRatingCategory = (rating: number): string => {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4) return 'Very Good';
  if (rating >= 3) return 'Good';
  if (rating >= 2) return 'Average';
  return 'Poor';
};

const getStarRating = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(emptyStars);
};

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
