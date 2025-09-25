'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USER_FEED } from './graphql/query';
import { CREATE_POST } from './graphql/mutation';
import { decryptToken } from '../../../utils/decryptToken';

interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string | null;
  role?: string;
}

interface Message {
  id: string;
  sender: string;
  avatar: string;
  timestamp: string;
  content: string;
  likes: number;
  comments: number;
  isLikedByMe: boolean;
  images: string[];
  isOwnMessage: boolean;
}

const PMTab = () => {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock users for demonstration
  const mockUsers: User[] = [
    { id: "1", name: "Sarah Johnson", avatar: "/avatars/sarah.jpg", email: "sarah@example.com" },
    { id: "2", name: "Mike Chen", avatar: "/avatars/mike.jpg", email: "mike@example.com" },
    { id: "3", name: "Emma Wilson", avatar: "/avatars/emma.jpg", email: "emma@example.com" },
    { id: "4", name: "Alex Rivera", avatar: "/avatars/alex.jpg", email: "alex@example.com" },
  ];

  useEffect(() => {
    const getRole = async () => {
      try {
        const response = await fetch('/api/protected', {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        const token = data?.user;
        const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";

        const payload = await decryptToken(token, secret.toString());
        setUserId(payload.userId);
        setName(payload.name);
        setAvatar(payload.image || "/NoImage.webp");
      } catch (err) {
        console.error('Error getting role:', err);
      }
    };
    getRole();
  }, []);

  // Mock messages data
  useEffect(() => {
    if (userId) {
      const mockMessages: Message[] = [
        {
          id: "1",
          sender: "Sarah Johnson",
          avatar: "/avatars/sarah.jpg",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          content: "Hey! How's the project going? 🚀",
          likes: 2,
          comments: 1,
          isLikedByMe: false,
          images: [],
          isOwnMessage: false
        },
        {
          id: "2",
          sender: name,
          avatar: avatar,
          timestamp: new Date(Date.now() - 180000).toISOString(),
          content: "Going great! Just finished the UI components. What do you think?",
          likes: 3,
          comments: 0,
          isLikedByMe: true,
          images: [],
          isOwnMessage: true
        },
        {
          id: "3",
          sender: "Sarah Johnson",
          avatar: "/avatars/sarah.jpg",
          timestamp: new Date(Date.now() - 60000).toISOString(),
          content: "The lavender theme looks absolutely stunning! ✨",
          likes: 5,
          comments: 2,
          isLikedByMe: false,
          images: [],
          isOwnMessage: false
        }
      ];
      setMessages(mockMessages);
      setSelectedUser(mockUsers[0]);
    }
  }, [userId, name, avatar]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    const newMsg: Message = {
      id: (messages.length + 1).toString(),
      sender: name,
      avatar: avatar,
      timestamp: new Date().toISOString(),
      content: newMessage,
      likes: 0,
      comments: 0,
      isLikedByMe: false,
      images: [],
      isOwnMessage: true
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex h-[80vh]">
          {/* Sidebar */}
          <div className="w-1/3 bg-gradient-to-b from-purple-50 to-lavender-100 border-r border-purple-200">
            <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-purple-200">Chat with your connections</p>
            </div>
            
            <div className="p-4">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent bg-white"
                />
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="overflow-y-auto h-[calc(80vh-140px)]">
              {mockUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center p-4 border-b border-purple-50 cursor-pointer transition-all duration-200 ${
                    selectedUser?.id === user.id ? 'bg-purple-50 border-l-4 border-l-purple-500' : 'hover:bg-purple-25'
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="relative">
                    <img
                      src={user.avatar || "/NoImage.webp"}
                      alt={user.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-200"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-purple-900">{user.name}</h3>
                      <span className="text-xs text-purple-400">2 min ago</span>
                    </div>
                    <p className="text-sm text-purple-600 truncate">Looking forward to our meeting!</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="w-2/3 flex flex-col">
            {/* Chat Header */}
            {selectedUser && (
              <div className="bg-gradient-to-r from-purple-50 to-lavender-50 border-b border-purple-200 p-4">
                <div className="flex items-center">
                  <img
                    src={selectedUser.avatar || "/NoImage.webp"}
                    alt={selectedUser.name}
                    className="w-10 h-10 rounded-2xl object-cover border-2 border-purple-200"
                  />
                  <div className="ml-3">
                    <h2 className="font-bold text-purple-900">{selectedUser.name}</h2>
                    <p className="text-sm text-purple-500">Online • Last seen recently</p>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-white to-purple-25">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-xs lg:max-w-md xl:max-w-lg 2xl:max-w-xl ${
                      message.isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      <img
                        src={message.avatar}
                        alt={message.sender}
                        className="w-8 h-8 rounded-full object-cover border-2 border-purple-200"
                      />
                      <div className={`mx-3 ${message.isOwnMessage ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block rounded-3xl p-4 shadow-lg ${
                          message.isOwnMessage
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none'
                            : 'bg-white text-purple-900 border border-purple-100 rounded-bl-none'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <div className="flex items-center mt-1 space-x-2 text-xs">
                          <span className={`${message.isOwnMessage ? 'text-purple-300' : 'text-purple-400'}`}>
                            {formatTime(message.timestamp)}
                          </span>
                          {message.isOwnMessage && (
                            <svg className="w-4 h-4 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t border-purple-200 p-4 bg-white">
              <div className="flex space-x-3">
                <div className="flex-1 bg-purple-50 rounded-2xl border border-purple-200 focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-purple-300">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full px-4 py-3 bg-transparent focus:outline-none resize-none rounded-2xl"
                    rows={1}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <div className="flex justify-between items-center mt-2 px-2">
                <div className="flex space-x-2">
                  <button className="p-2 text-purple-400 hover:text-purple-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <button className="p-2 text-purple-400 hover:text-purple-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <div className="text-xs text-purple-400">
                  Press Enter to send • Shift+Enter for new line
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .bg-lavender-100 { background-color: #f4f0ff; }
        .bg-purple-25 { background-color: #faf9ff; }
        .text-lavender-800 { color: #6d28d9; }
        
        /* Scrollbar Styling */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #c4b5fd;
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #a78bfa;
        }
      `}</style>
    </div>
  );
};

export default PMTab;
