// Example usage in a page or component
import React from 'react';
import DeluxeMessageCard from '../components/DeluxeMessageCard';
import PostInput from './PostInput';
const MessagesTab = () => {
  const sampleMessages = [
    {
      id: '1',
      sender: 'Jane Smith',
      avatar: '/path/to/avatar1.jpg',
      timestamp: '2 hours ago',
      content: 'Just visited the most amazing art exhibition! The contemporary pieces were mind-blowing. Definitely recommend checking it out if you\'re in town! 🎨',
      likes: 245,
      comments: 32,
      shares: 12,
      postImage: '/path/to/exhibition.jpg',
      isOwnMessage: false
    },
    {
      id: '2',
      sender: 'John Doe',
      avatar: '/path/to/avatar2.jpg',
      timestamp: '5 hours ago',
      content: 'My new project is finally live! After months of hard work, our team has launched the new eco-friendly product line. So proud of what we\'ve accomplished! 🌱',
      likes: 512,
      comments: 47,
      shares: 28,
      isOwnMessage: true,
      status: 'read'
    },
    {
      id: '3',
      sender: 'Travel Enthusiast',
      timestamp: '1 day ago',
      content: 'The view from the mountain peak was absolutely worth the 5-hour hike! Nature never ceases to amaze me. 🏔️',
      likes: 892,
      comments: 63,
      shares: 41,
      postImage: '/path/to/mountain.jpg',
      isOwnMessage: false
    }
  ];

const handlePostSubmit = (content: string) => {
    console.log('New post:', content);
    // Add your post submission logic here
  };


  
  return (
    <div className="min-h-screen bg-gray-100 p-0">
      <div className="max-w-2xl mx-auto">
        <PostInput
        user={{
          name: "John Doe",
          avatar: "/path/to/avatar.jpg"
        }}
        onPostSubmit={handlePostSubmit}
        placeholder="What's on your mind?"
      />
         {sampleMessages.map(message => (
          <DeluxeMessageCard 
            key={message.id} 
            message={message} 
            className="mb-6"
          />
        ))}
      </div>
    </div>
  );
};

export default MessagesTab;
