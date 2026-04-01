// hooks/useReviews.ts

import { useQuery, useMutation, ApolloError } from '@apollo/client';
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

// Types
interface CreateReviewInput {
  data: {
    userId: string;
    productId: string;
    rating: number;
    title: string;
    comment: string;
    isApproved: boolean;
  };
}

interface UpdateReviewInput {
  id: string;
  data: {
    rating?: number;
    title?: string;
    comment?: string;
    isApproved?: boolean;
  };
}

interface AddImageInput {
  input: {
    reviewId: string;
    url: string;
    publicId: string;
    position?: number;
  };
}

interface UpdateImageInput {
  imageId: string;
  url?: string;
  publicId?: string;
  position?: number;
}

interface ReorderImagesInput {
  input: {
    reviewId: string;
    imageIds: string[];
  };
}

interface MutationResponse {
  id: string;
  statusText: string;
}

// Query Hooks
export const useGetReviews = (filters?: any) => {
  return useQuery(GET_REVIEWS, {
    variables: { filters },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
};

export const useGetReviewById = (id: string) => {
  return useQuery(GET_REVIEW_BY_ID, {
    variables: { id },
    skip: !id,
    errorPolicy: 'all',
  });
};

export const useGetProductReviewStats = (productId: string) => {
  return useQuery(GET_PRODUCT_REVIEW_STATS, {
    variables: { productId },
    skip: !productId,
    errorPolicy: 'all',
  });
};

export const useGetReviewImages = (reviewId: string) => {
  return useQuery(GET_REVIEW_IMAGES, {
    variables: { reviewId },
    skip: !reviewId,
    errorPolicy: 'all',
  });
};

// Mutation Hooks with Enhanced Features
export const useCreateReview = () => {
  const [mutate, { loading, error, data }] = useMutation<{ createReview: MutationResponse }, CreateReviewInput>(CREATE_REVIEW, {
    refetchQueries: ['GetProductReviewStats', 'GetReviews'],
    update: (cache, { data }) => {
      if (data?.createReview?.statusText === 'success') {
        // Optional: Add success callback logic here
        console.log('Review created successfully');
      }
    },
    onError: (error: ApolloError) => {
      console.error('Error creating review:', error);
    },
  });

  const createReview = async (variables: CreateReviewInput) => {
    try {
      const response = await mutate({ variables });
      return response;
    } catch (error) {
      throw error;
    }
  };

  return [createReview, { loading, error, data }] as const;
};

export const useUpdateReview = () => {
  const [mutate, { loading, error, data }] = useMutation<{ updateReview: MutationResponse }, UpdateReviewInput>(UPDATE_REVIEW, {
    update: (cache, { data }) => {
      if (data?.updateReview?.statusText === 'success') {
        // Optional: Update cache for specific review
        console.log('Review updated successfully');
      }
    },
    onError: (error: ApolloError) => {
      console.error('Error updating review:', error);
    },
  });

  const updateReview = async (variables: UpdateReviewInput) => {
    try {
      const response = await mutate({ variables });
      return response;
    } catch (error) {
      throw error;
    }
  };

  return [updateReview, { loading, error, data }] as const;
};

export const useDeleteReview = () => {
  const [mutate, { loading, error, data }] = useMutation<{ deleteReview: MutationResponse }, { id: string }>(DELETE_REVIEW, {
    refetchQueries: ['GetReviews', 'GetProductReviewStats'],
    update: (cache, { data }) => {
      if (data?.deleteReview?.statusText === 'success') {
        // Optionally evict the deleted review from cache
        // cache.evict({ id: `Review:${variables.id}` });
        cache.gc();
      }
    },
    onError: (error: ApolloError) => {
      console.error('Error deleting review:', error);
    },
  });

  const deleteReview = async (variables: { id: string }) => {
    try {
      const response = await mutate({ variables });
      return response;
    } catch (error) {
      throw error;
    }
  };

  return [deleteReview, { loading, error, data }] as const;
};

export const useApproveReview = () => {
  const [mutate, { loading, error, data }] = useMutation<{ approveReview: MutationResponse }, { id: string }>(APPROVE_REVIEW, {
    refetchQueries: ['GetReviews', 'GetProductReviewStats'],
    update: (cache, { data }) => {
      if (data?.approveReview?.statusText === 'success') {
        console.log('Review approved successfully');
      }
    },
    onError: (error: ApolloError) => {
      console.error('Error approving review:', error);
    },
  });

  const approveReview = async (variables: { id: string }) => {
    try {
      const response = await mutate({ variables });
      return response;
    } catch (error) {
      throw error;
    }
  };

  return [approveReview, { loading, error, data }] as const;
};

export const useAddImageToReview = () => {
  const [mutate, { loading, error, data }] = useMutation<{ addImageToReview: MutationResponse }, AddImageInput>(ADD_IMAGE_TO_REVIEW, {
    refetchQueries: ['GetReviewImages'],
    update: (cache, { data }) => {
      if (data?.addImageToReview?.statusText === 'success') {
        console.log('Image added successfully');
      }
    },
    onError: (error: ApolloError) => {
      console.error('Error adding image to review:', error);
    },
  });

  const addImageToReview = async (variables: AddImageInput) => {
    try {
      const response = await mutate({ variables });
      return response;
    } catch (error) {
      throw error;
    }
  };

  return [addImageToReview, { loading, error, data }] as const;
};

export const useUpdateReviewImage = () => {
  const [mutate, { loading, error, data }] = useMutation<{ updateReviewImage: MutationResponse }, UpdateImageInput>(UPDATE_REVIEW_IMAGE, {
    refetchQueries: ['GetReviewImages'],
    update: (cache, { data }) => {
      if (data?.updateReviewImage?.statusText === 'success') {
        console.log('Image updated successfully');
      }
    },
    onError: (error: ApolloError) => {
      console.error('Error updating review image:', error);
    },
  });

  const updateReviewImage = async (variables: UpdateImageInput) => {
    try {
      const response = await mutate({ variables });
      return response;
    } catch (error) {
      throw error;
    }
  };

  return [updateReviewImage, { loading, error, data }] as const;
};

export const useDeleteReviewImage = () => {
  const [mutate, { loading, error, data }] = useMutation<{ deleteReviewImage: MutationResponse }, { imageId: string }>(DELETE_REVIEW_IMAGE, {
    refetchQueries: ['GetReviewImages'],
    update: (cache, { data }) => {
      if (data?.deleteReviewImage?.statusText === 'success') {
        // Optionally evict the deleted image from cache
        // cache.evict({ id: `ReviewImage:${imageId}` });
        cache.gc();
      }
    },
    onError: (error: ApolloError) => {
      console.error('Error deleting review image:', error);
    },
  });

  const deleteReviewImage = async (variables: { imageId: string }) => {
    try {
      const response = await mutate({ variables });
      return response;
    } catch (error) {
      throw error;
    }
  };

  return [deleteReviewImage, { loading, error, data }] as const;
};

export const useReorderImages = () => {
  const [mutate, { loading, error, data }] = useMutation<{ reorderImages: MutationResponse }, ReorderImagesInput>(REORDER_IMAGES, {
    refetchQueries: ['GetReviewImages'],
    update: (cache, { data }) => {
      if (data?.reorderImages?.statusText === 'success') {
        console.log('Images reordered successfully');
      }
    },
    onError: (error: ApolloError) => {
      console.error('Error reordering images:', error);
    },
  });

  const reorderImages = async (variables: ReorderImagesInput) => {
    try {
      const response = await mutate({ variables });
      return response;
    } catch (error) {
      throw error;
    }
  };

  return [reorderImages, { loading, error, data }] as const;
};
