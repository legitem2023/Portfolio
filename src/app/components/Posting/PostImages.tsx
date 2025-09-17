// components/PostImages.tsx
import React, { useState } from 'react';
import Image from 'next/image';

interface PostImagesProps {
  images: string[];
  className?: string;
}

const PostImages: React.FC<PostImagesProps> = ({ images, className = '' }) => {
  const [errorIndexes, setErrorIndexes] = useState<number[]>([]);
  const FALLBACK_IMAGE = 'https://new-client-legitem.vercel.app/Thumbnail.png';

  const handleImageError = (index: number) => {
    if (!errorIndexes.includes(index)) {
      setErrorIndexes([...errorIndexes, index]);
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 ${className}`}>
      {images.map((img, index) => (
        <div key={index} className="relative h-64 w-full rounded-lg overflow-hidden">
          <Image
            src={errorIndexes.includes(index) ? FALLBACK_IMAGE : img}
            alt={`Post image ${index + 1}`}
            fill
            className="object-cover"
            onError={() => handleImageError(index)}
          />
        </div>
      ))}
    </div>
  );
};

export default PostImages;
