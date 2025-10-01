// components/ads/PromoAd.tsx
import React from 'react';

interface PromoAdProps {
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  imageUrl?: string;
}

export const PromoAd: React.FC<PromoAdProps> = ({
  title,
  description,
  ctaText,
  ctaLink,
  imageUrl,
}) => {
  return (
    <div className="flex h-full items-center justify-between bg-white p-6">
      {imageUrl && (
        <div className="flex-shrink-0">
          <img
            src={imageUrl}
            alt={title}
            className="h-32 w-32 rounded-lg object-cover"
          />
        </div>
      )}
      <div className={`flex-1 ${imageUrl ? 'ml-6' : ''}`}>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-gray-600">{description}</p>
        <a
          href={ctaLink}
          className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          {ctaText}
        </a>
      </div>
    </div>
  );
};
