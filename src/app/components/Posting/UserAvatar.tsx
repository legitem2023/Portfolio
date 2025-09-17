// components/UserAvatar.tsx
import React, { useState } from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  src, 
  alt, 
  size = 'md', 
  className = '' 
}) => {
  const [error, setError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden relative ${className}`}>
      {src && !error ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
          {alt.charAt(0)}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
