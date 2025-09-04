// components/DeluxeMessageCard.tsx
import React from 'react';
import Image from 'next/image';

// In your DeluxeMessageCard component, modify the interface:
interface Message {
  id: string;
  sender: string;
  avatar?: string;
  timestamp: string;
  content: string;
  status?: string; // Change from specific union to string
  isOwnMessage?: boolean;
}

interface DeluxeMessageCardProps {
  message: Message;
  className?: string;
}

const DeluxeMessageCard: React.FC<DeluxeMessageCardProps> = ({ 
  message, 
  className = '' 
}) => {
  const {
    sender,
    avatar,
    timestamp,
    content,
    status = 'delivered',
    isOwnMessage = false
  } = message;

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`flex max-w-xs md:max-w-md ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        {avatar && (
          <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden mr-3 ml-3 relative">
            <Image
              src={avatar}
              alt={sender}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        {/* Message Bubble */}
        <div className={`relative rounded-2xl p-4 shadow-lg ${
          isOwnMessage 
            ? 'bg-gradient-to-br from-purple-600 to-blue-500 text-white rounded-br-none' 
            : 'bg-gradient-to-br from-gray-100 to-white text-gray-800 rounded-bl-none border border-gray-200'
        }`}>
          {/* Sender name for received messages */}
          {!isOwnMessage && (
            <div className="font-semibold text-sm mb-1 text-indigo-700">{sender}</div>
          )}
          
          {/* Message content */}
          <p className="text-sm md:text-base">{content}</p>
          
          {/* Timestamp and status */}
          <div className={`flex items-center mt-2 text-xs ${
            isOwnMessage ? 'text-blue-100 justify-end' : 'text-gray-500 justify-start'
          }`}>
            <span>{timestamp}</span>
            {isOwnMessage && (
              <span className="ml-1">
                {status === 'read' ? '✓✓' : status === 'delivered' ? '✓✓' : '✓'}
              </span>
            )}
          </div>
          
          {/* Decorative elements */}
          <div className={`absolute bottom-0 ${
            isOwnMessage ? '-right-2' : '-left-2'
          }`}>
            <svg className={`h-4 w-4 ${
              isOwnMessage ? 'text-blue-500' : 'text-gray-100'
            }`} viewBox="0 0 20 20" fill="currentColor">
              <path d="M0 0h20v20H0z" fill="none"/>
              <path d="M0 0h10c5.523 0 10 4.477 10 10v10H0V0z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeluxeMessageCard;
