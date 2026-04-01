// hooks/useReviews.ts

import { useQuery, useMutation } from '@apollo/client';
import {
  GET_REVIEWS,
  GET_REVIEW_BY_ID,
  GET_PRODUCT_REVIEW_STATS,
  GET_REVIEW_IMAGES,
} from '../graphql/query';
import {
  CREATE_REVIEW,
  UPDATE_REVIEW,
  DELETE_REVIEW,
  APPROVE_REVIEW,
  ADD_IMAGE_TO_REVIEW,
  UPDATE_REVIEW_IMAGE,
  DELETE_REVIEW_IMAGE,
  REORDER_IMAGES,
} from '../graphql/mutation';

// Query Hooks
export const useGetReviews = (filters?: any) => {
  return useQuery(GET_REVIEWS, {
    variables: { filters },
    fetchPolicy: 'cache-and-network',
  });
};

export const useGetReviewById = (id: string) => {
  return useQuery(GET_REVIEW_BY_ID, {
    variables: { id },
    skip: !id,
  });
};

export const useGetProductReviewStats = (productId: string) => {
  return useQuery(GET_PRODUCT_REVIEW_STATS, {
    variables: { productId },
    skip: !productId,
  });
};

export const useGetReviewImages = (reviewId: string) => {
  return useQuery(GET_REVIEW_IMAGES, {
    variables: { reviewId },
    skip: !reviewId,
  });
};

// Mutation Hooks
export const useCreateReview = () => {
  return useMutation(CREATE_REVIEW, {
    refetchQueries: ['GetProductReviewStats'],
  });
};

export const useUpdateReview = () => {
  return useMutation(UPDATE_REVIEW);
};

export const useDeleteReview = () => {
  return useMutation(DELETE_REVIEW, {
    refetchQueries: ['GetReviews', 'GetProductReviewStats'],
  });
};

export const useApproveReview = () => {
  return useMutation(APPROVE_REVIEW, {
    refetchQueries: ['GetReviews', 'GetProductReviewStats'],
  });
};

export const useAddImageToReview = () => {
  return useMutation(ADD_IMAGE_TO_REVIEW);
};

export const useUpdateReviewImage = () => {
  return useMutation(UPDATE_REVIEW_IMAGE);
};

export const useDeleteReviewImage = () => {
  return useMutation(DELETE_REVIEW_IMAGE);
};

export const useReorderImages = () => {
  return useMutation(REORDER_IMAGES);
};
