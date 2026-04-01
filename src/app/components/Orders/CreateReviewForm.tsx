// components/CreateReviewForm.tsx

import React, { useState } from 'react';
import { useCreateReview, useAddImageToReview } from '../hooks/useReviews';
import { Star, Upload, X } from 'lucide-react';

export const CreateReviewForm = ({ productId, userId }: { productId: string; userId: string }) => {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createReview, { loading: createLoading }] = useCreateReview();
  const [addImage] = useAddImageToReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // First create the review
      const { data } = await createReview({
        data: {
          userId,
          productId,
          rating,
          title,
          comment,
          isApproved: false,
        },
      });
      
      // Check if review was created successfully
      if (data?.createReview?.statusText !== 'Successfully Added!') {
        throw new Error('Failed to create review');
      }

      const reviewId = data.createReview.id;
      
      // Then upload images if any
      if (images.length > 0 && reviewId) {
        for (const image of images) {
          // Convert image file to base64 string or blob URL
          const imageUrl = await fileToBase64(image);
          
          await addImage({
            input: {
              reviewId,
              url: imageUrl, // Send base64 string
              publicId: `review/${reviewId}/${image.name}`,
            },
          });
        }
      }
      
      alert('Review created successfully!');
      // Reset form
      setRating(5);
      setTitle('');
      setComment('');
      setImages([]);
    } catch (error) {
      console.error('Error creating review:', error);
      alert('Failed to create review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  // Helper function to convert File to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      {/* Rating Section */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Rating *
        </label>
        <div className="flex gap-1 sm:gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
              aria-label={`Rate ${star} stars`}
            >
              <Star
                size={28}
                className={`sm:w-8 sm:h-8 w-7 h-7 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                } transition-colors`}
              />
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent'}
        </p>
      </div>

      {/* Title Input */}
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
          Review Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          required
        />
      </div>

      {/* Comment Textarea */}
      <div className="mb-6">
        <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-2">
          Your Review *
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you like or dislike? What should others know?"
          rows={4}
          className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
          required
        />
      </div>

      {/* Image Upload Section */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Add Photos (Optional)
        </label>
        
        {/* Image Preview Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <div className="relative">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              const newFiles = Array.from(e.target.files || []);
              setImages([...images, ...newFiles]);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
          >
            <Upload size={20} className="text-gray-500" />
            <span className="text-sm text-gray-600">
              {images.length > 0 ? 'Add more photos' : 'Click to upload photos'}
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: JPG, PNG, GIF. Max size: 5MB each
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || createLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting || createLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Submitting...</span>
          </>
        ) : (
          <span>Submit Review</span>
        )}
      </button>
    </form>
  );
};
