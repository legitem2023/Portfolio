// components/CreateReviewForm.tsx

import React, { useState } from 'react';
import { useCreateReview, useAddImageToReview } from '../hooks/useReviews';

export const CreateReviewForm = ({ productId, userId }: { productId: string; userId: string }) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);

  const [createReview] = useCreateReview();
  const [addImage] = useAddImageToReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // First create the review
      const { data } = await createReview({
        variables: {
          data: {
            userId,
            productId,
            rating,
            title,
            comment,
            isApproved: false,
          },
        },
      });

      const reviewId = data.createReview.id;

      // Then upload images if any
      if (images.length > 0 && reviewId) {
        for (const image of images) {
          // Upload image to cloud storage first
          const uploadedUrl = await uploadImageToCloud(image);
          
          await addImage({
            variables: {
              input: {
                reviewId,
                url: uploadedUrl,
                publicId: `review/${reviewId}/${image.name}`,
              },
            },
          });
        }
      }

      alert('Review created successfully!');
    } catch (error) {
      console.error('Error creating review:', error);
      alert('Failed to create review');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Rating:</label>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>{r} Stars</option>
          ))}
        </select>
      </div>

      <div>
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Comment:</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Images:</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setImages(Array.from(e.target.files || []))}
        />
      </div>

      <button type="submit">Submit Review</button>
    </form>
  );
};

// Helper function to upload image
const uploadImageToCloud = async (file: File): Promise<string> => {
  // Implement your cloud upload logic here
  // Return the uploaded image URL
  return 'https://cdn.example.com/uploaded-image.jpg';
};
