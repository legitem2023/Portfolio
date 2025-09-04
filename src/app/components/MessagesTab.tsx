// pages/index.tsx (Example usage)
import React, { useState } from 'react';
import DeluxeMessageCard from './DeluxeMessageCard';

const MessagesTab: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'Alex Johnson',
      avatar: '/avatars/1.jpg', // Replace with actual image path
      timestamp: '10:30 AM',
      content: 'Hey there! I wanted to discuss the upcoming project deadline. Are you available for a quick call?',
      isOwnMessage: false
    },
    {
      id: '2',
      sender: 'You',
      timestamp: '10:32 AM',
      content: 'Sure, I can jump on a call in about 15 minutes. Will that work?',
      status: 'read',
      isOwnMessage: true
    },
    {
      id: '3',
      sender: 'Alex Johnson',
      avatar: '/avatars/1.jpg',
      timestamp: '10:33 AM',
      content: 'Perfect! I\'ll send the calendar invite right away.',
      isOwnMessage: false
    }
  ]);


 // Add a type validation function
function isValidMessageStatus(status: string): status is 'delivered' | 'read' | 'sending' {
  return ['delivered', 'read', 'sending'].includes(status);
}

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 bg-opacity-40 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-700 border-opacity-50 overflow-hidden">
        {/* Chat header */}
        <div className="p-6 bg-gradient-to-r from-purple-800 to-blue-800 text-white">
          <h1 className="text-2xl font-bold">Messenger</h1>
          <p className="text-purple-200">Luxury conversation experience</p>
        </div>
        
        {/* Chat body */}
        <div className="p-4 space-y-6 bg-gradient-to-b from-gray-900 to-gray-800 max-h-[60vh] overflow-y-auto">

{messages.map((message) => {
  if (message.status && !isValidMessageStatus(message.status)) {
    // Handle invalid status or set a default
    message.status = 'delivered';
  }
  return (
    <DeluxeMessageCard 
      key={message.id} 
      message={message} 
      className="mb-4"
    />
  );
})}
        </div>
        
        {/* Input area */}
        <div className="p-4 bg-gray-900 bg-opacity-70 border-t border-gray-700">
          <div className="flex items-center">
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="flex-1 bg-gray-800 text-white rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button className="ml-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white p-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesTab;
