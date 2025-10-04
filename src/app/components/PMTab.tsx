'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { decryptToken } from '../../../utils/decryptToken';

// GraphQL Queries & Mutations (keep the same as before)
const GET_MY_MESSAGES = gql`
  query GetMyMessages($page: Int, $limit: Int, $isRead: Boolean) {
    myMessages(page: $page, limit: $limit, isRead: $isRead) {
      messages {
        id
        subject
        body
        isRead
        createdAt
        sender {
          id
          firstName
          lastName
          avatar
          email
        }
        recipient {
          id
          firstName
          lastName
          avatar
          email
        }
        parent {
          id
          body
          sender {
            firstName
            lastName
          }
        }
        replies {
          id
          body
          createdAt
          sender {
            firstName
            lastName
          }
        }
      }
      totalCount
      hasNextPage
      page
    }
  }
`;

const GET_CONVERSATION = gql`
  query GetConversation($userId: ID!, $page: Int, $limit: Int) {
    conversation(userId: $userId, page: $page, limit: $limit) {
      messages {
        id
        subject
        body
        isRead
        createdAt
        sender {
          id
          firstName
          lastName
          avatar
          email
        }
        recipient {
          id
          firstName
          lastName
          avatar
          email
        }
        parent {
          id
          body
          sender {
            firstName
            lastName
          }
        }
        replies {
          id
          body
          createdAt
          sender {
            firstName
            lastName
          }
        }
      }
      totalCount
      hasNextPage
      page
    }
  }
`;

const GET_MESSAGE_THREADS = gql`
  query GetMessageThreads($page: Int, $limit: Int) {
    messageThreads(page: $page, limit: $limit) {
      threads {
        user {
          id
          firstName
          lastName
          avatar
          email
        }
        lastMessage {
          id
          body
          createdAt
          isRead
        }
        unreadCount
        updatedAt
      }
      totalCount
      hasNextPage
      page
    }
  }
`;

const GET_UNREAD_MESSAGE_COUNT = gql`
  query GetUnreadMessageCount {
    unreadMessageCount
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      subject
      body
      isRead
      createdAt
      sender {
        id
        firstName
        lastName
        avatar
      }
      recipient {
        id
        firstName
        lastName
        avatar
      }
    }
  }
`;

const MARK_AS_READ = gql`
  mutation MarkAsRead($messageId: ID!) {
    markAsRead(messageId: $messageId) {
      id
      isRead
    }
  }
`;

const MARK_MULTIPLE_AS_READ = gql`
  mutation MarkMultipleAsRead($messageIds: [ID!]!) {
    markMultipleAsRead(messageIds: $messageIds)
  }
`;

const REPLY_MESSAGE = gql`
  mutation ReplyMessage($input: ReplyMessageInput!) {
    replyMessage(input: $input) {
      id
      body
      isRead
      createdAt
      sender {
        id
        firstName
        lastName
        avatar
      }
      recipient {
        id
        firstName
        lastName
        avatar
      }
      parent {
        id
        body
        sender {
          firstName
          lastName
        }
      }
    }
  }
`;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  email?: string;
  phone?: string | null;
  role?: string;
}

interface GraphQLMessage {
  id: string;
  subject?: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  sender: User;
  recipient: User;
  parent?: GraphQLMessage;
  replies: GraphQLMessage[];
}

interface MessageThread {
  user: User;
  lastMessage?: GraphQLMessage;
  unreadCount: number;
  updatedAt: string;
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
  isRead: boolean;
  graphQLData?: GraphQLMessage;
}

const PMTab = () => {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // GraphQL Queries
  const { data: threadsData, refetch: refetchThreads } = useQuery(GET_MESSAGE_THREADS, {
    variables: { page: 1, limit: 50 },
    skip: !userId
  });

  const { data: conversationData, refetch: refetchConversation } = useQuery(GET_CONVERSATION, {
    variables: { 
      userId: selectedUser?.id,
      page: 1,
      limit: 50
    },
    skip: !selectedUser?.id || !userId
  });

  const { data: unreadCountData } = useQuery(GET_UNREAD_MESSAGE_COUNT, {
    skip: !userId
  });

  // GraphQL Mutations
  const [sendMessageMutation] = useMutation(SEND_MESSAGE);
  const [markAsReadMutation] = useMutation(MARK_AS_READ);
  const [markMultipleAsReadMutation] = useMutation(MARK_MULTIPLE_AS_READ);
  const [replyMessageMutation] = useMutation(REPLY_MESSAGE);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, sidebar starts closed; on desktop, it starts open
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Update message threads when data loads
  useEffect(() => {
    if (threadsData?.messageThreads?.threads) {
      setMessageThreads(threadsData.messageThreads.threads);
    }
  }, [threadsData]);

  // Convert GraphQL messages to UI messages
  useEffect(() => {
    if (conversationData?.conversation?.messages && userId) {
      const uiMessages: Message[] = conversationData.conversation.messages.map((msg: GraphQLMessage) => ({
        id: msg.id,
        sender: `${msg.sender.firstName} ${msg.sender.lastName}`,
        avatar: msg.sender.avatar || "/NoImage.webp",
        timestamp: msg.createdAt,
        content: msg.body,
        likes: 0,
        comments: msg.replies.length,
        isLikedByMe: false,
        images: [],
        isOwnMessage: msg.sender.id === userId,
        isRead: msg.isRead,
        graphQLData: msg
      }));

      setMessages(uiMessages);

      // Mark messages as read when conversation is opened
      const unreadMessages = uiMessages.filter(msg => !msg.isRead && !msg.isOwnMessage);
      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map(msg => msg.id);
        markMultipleAsReadMutation({
          variables: { messageIds: unreadIds }
        });
      }
    }
  }, [conversationData, userId, markMultipleAsReadMutation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !selectedUser) return;

    try {
      const { data } = await sendMessageMutation({
        variables: {
          input: {
            recipientId: selectedUser.id,
            body: newMessage.trim()
          }
        }
      });

      if (data?.sendMessage) {
        const newMsg: Message = {
          id: data.sendMessage.id,
          sender: name,
          avatar: avatar,
          timestamp: data.sendMessage.createdAt,
          content: data.sendMessage.body,
          likes: 0,
          comments: 0,
          isLikedByMe: false,
          images: [],
          isOwnMessage: true,
          isRead: data.sendMessage.isRead,
          graphQLData: data.sendMessage
        };

        setMessages(prev => [...prev, newMsg]);
        setNewMessage("");
        refetchThreads();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
    
    try {
      await refetchConversation({ userId: user.id });
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const handleBackToContacts = () => {
    setSelectedUser(null);
    if (isMobile) {
      setIsSidebarOpen(true);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  const getUserFullName = (user: User) => {
    return `${user.firstName} ${user.lastName}`;
  };

  const getUserAvatar = (user: User) => {
    return user.avatar || "/NoImage.webp";
  };

  // Determine which view to show based on mobile/desktop and state
  const shouldShowSidebar = isMobile ? isSidebarOpen : true;
  const shouldShowChat = isMobile ? !isSidebarOpen : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 safe-area-inset-bottom">
      <div className="max-w-6xl mx-auto bg-white rounded-none md:rounded-2xl md:rounded-3xl shadow-none md:shadow-xl md:shadow-2xl overflow-hidden h-screen md:h-[80vh]">
        <div className="flex h-full relative">
          {/* Sidebar/Contacts List */}
          <div className={`
            ${isMobile ? 'fixed inset-0 z-30' : 'relative z-20 w-1/3 lg:w-1/4 flex-shrink-0'}
            bg-gradient-to-b from-purple-50 to-lavender-100 border-r border-purple-200
            transform transition-transform duration-300 ease-in-out h-full
            ${shouldShowSidebar ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="p-4 md:p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">Messages</h1>
                  <p className="text-purple-200 text-sm hidden md:block">
                    {unreadCountData?.unreadMessageCount > 0 
                      ? `${unreadCountData.unreadMessageCount} unread messages`
                      : 'Chat with your connections'
                    }
                  </p>
                </div>
                {isMobile && (
                  <button 
                    onClick={handleToggleSidebar}
                    className="p-2 rounded-lg bg-purple-700 hover:bg-purple-800"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-3 md:p-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 md:py-3 text-sm md:text-base rounded-xl md:rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent bg-white"
                />
                <svg className="absolute left-2.5 top-2.5 md:left-3 md:top-3 h-4 w-4 md:h-5 md:w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="overflow-y-auto h-[calc(100%-120px)] md:h-[calc(100%-140px)] messages-scrollbar">
              {messageThreads.map((thread) => (
                <div
                  key={thread.user.id}
                  className={`flex items-center p-3 border-b border-purple-50 cursor-pointer transition-all duration-200 ${
                    selectedUser?.id === thread.user.id ? 'bg-purple-50 border-l-4 border-l-purple-500' : 'hover:bg-purple-25'
                  }`}
                  onClick={() => handleUserSelect(thread.user)}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={getUserAvatar(thread.user)}
                      alt={getUserFullName(thread.user)}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover border-2 border-purple-200"
                    />
                    {thread.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {thread.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-purple-900 text-sm md:text-base truncate">
                        {getUserFullName(thread.user)}
                      </h3>
                      {thread.lastMessage && (
                        <span className="text-xs text-purple-400 whitespace-nowrap ml-2">
                          {formatTime(thread.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-purple-600 truncate">
                      {thread.lastMessage?.body || 'No messages yet'}
                    </p>
                  </div>
                </div>
              ))}
              
              {messageThreads.length === 0 && (
                <div className="text-center py-8 text-purple-400">
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Start a conversation with someone!</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area - Only show when not in sidebar mode on mobile */}
          {shouldShowChat && (
            <div className={`
              ${isMobile ? 'fixed inset-0 z-20' : 'relative z-10 flex-1'}
              flex flex-col h-full bg-white
              transform transition-transform duration-300 ease-in-out
            `}>
              {/* Chat Header */}
              {selectedUser ? (
                <div className="bg-gradient-to-r from-purple-50 to-lavender-50 border-b border-purple-200 p-4 safe-area-inset-top">
                  <div className="flex items-center">
                    {isMobile && (
                      <button 
                        onClick={handleBackToContacts}
                        className="mr-3 p-2 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-600"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    <img
                      src={getUserAvatar(selectedUser)}
                      alt={getUserFullName(selectedUser)}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl object-cover border-2 border-purple-200"
                    />
                    <div className="ml-3 flex-1 min-w-0">
                      <h2 className="font-bold text-purple-900 text-sm md:text-base truncate">
                        {getUserFullName(selectedUser)}
                      </h2>
                      <p className="text-xs md:text-sm text-purple-500 truncate">Online • Last seen recently</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-purple-400 hover:text-purple-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </button>
                      <button 
                        onClick={handleToggleSidebar}
                        className="p-2 text-purple-400 hover:text-purple-600 transition-colors md:hidden"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-purple-50 to-lavender-50 border-b border-purple-200 p-4 safe-area-inset-top">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {isMobile && (
                        <button 
                          onClick={handleToggleSidebar}
                          className="mr-3 p-2 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-600"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </button>
                      )}
                      <div>
                        <h2 className="font-bold text-purple-900 text-sm md:text-base">Messages</h2>
                        <p className="text-xs md:text-sm text-purple-500">Select a conversation</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-purple-25 messages-scrollbar safe-area-inset-bottom">
                {selectedUser ? (
                  <div className="space-y-4">
                    {Object.entries(messageGroups).map(([date, dateMessages]) => (
                      <div key={date}>
                        <div className="flex justify-center my-4">
                          <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-xs font-medium">
                            {date}
                          </span>
                        </div>
                        {dateMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex max-w-[85%] md:max-w-xs lg:max-w-md ${
                              message.isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                            }`}>
                              <img
                                src={message.avatar}
                                alt={message.sender}
                                className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover border-2 border-purple-200 flex-shrink-0"
                              />
                              <div className={`mx-2 ${message.isOwnMessage ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block rounded-2xl md:rounded-3xl p-3 md:p-4 ${
                                  message.isOwnMessage
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none'
                                    : 'bg-white text-purple-900 border border-purple-100 rounded-bl-none'
                                }`}>
                                  <p className="text-sm md:text-base whitespace-pre-wrap break-words">{message.content}</p>
                                </div>
                                <div className={`flex items-center mt-1 space-x-2 text-xs ${
                                  message.isOwnMessage ? 'justify-end' : 'justify-start'
                                }`}>
                                  <span className={`${message.isOwnMessage ? 'text-purple-300' : 'text-purple-400'}`}>
                                    {formatTime(message.timestamp)}
                                  </span>
                                  {message.isOwnMessage && (
                                    <svg className="w-3 h-3 md:w-4 md:h-4 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-purple-400">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-lg font-medium">Select a conversation</p>
                      <p className="text-sm mt-2">Choose from your contacts to start messaging</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              {selectedUser && (
                <div className="border-t border-purple-200 p-4 bg-white safe-area-inset-bottom">
                  <div className="flex space-x-3">
                    <div className="flex-1 bg-purple-50 rounded-2xl border border-purple-200 focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-purple-300">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="w-full px-4 py-3 text-base bg-transparent focus:outline-none resize-none rounded-2xl min-h-[44px] max-h-[120px]"
                        rows={1}
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-2 px-1">
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
                    <div className="text-xs text-purple-400 hidden md:block">
                      Press Enter to send • Shift+Enter for new line
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        /* Safe area insets for modern mobile devices */
       /* .safe-area-inset-bottom {
          padding-bottom: calc(env(safe-area-inset-bottom) + 0.5rem);
        }
        
        .safe-area-inset-top {
          padding-top: env(safe-area-inset-top);
        }
        */
        
        /* Custom scrollbar */
        .messages-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .messages-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .messages-scrollbar::-webkit-scrollbar-thumb {
          background: #c4b5fd;
          border-radius: 10px;
        }
        
        .messages-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a78bfa;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .messages-scrollbar::-webkit-scrollbar {
            width: 3px;
          }
        }

        /* Custom colors */
        .bg-lavender-100 {
          background-color: #f4f0ff;
        }

        .bg-purple-25 {
          background-color: #faf9ff;
        }
      `}</style>
    </div>
  );
};

export default PMTab;
