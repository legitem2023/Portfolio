'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import Image from 'next/image';
import { decryptToken } from '../../../utils/decryptToken';
import { 
  Search, 
  X, 
  Menu, 
  Phone, 
  Check, 
  MessageCircle, 
  Send, 
  Paperclip, 
  Image as ImageIcon,
  MessageSquare,
  ChevronRight,
  Loader2,
  ArrowLeft
} from 'lucide-react';

// GraphQL Queries & Mutations
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
  query GetMessageThreads($page: Int, $limit: Int, $userId:ID) {
    messageThreads(page: $page, limit: $limit, userId: $userId) {
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

const GET_ALL_USERS = gql`
  query GetUsers {
    users {
      id
      email
      firstName
      lastName
      avatar
      phone
      emailVerified
      createdAt
      updatedAt
      role
    }
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

const MARK_MULTIPLE_AS_READ = gql`
  mutation MarkMultipleAsRead($messageIds: [ID!]!) {
    markMultipleAsRead(messageIds: $messageIds)
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

const PMTab = ({ UserId }: { UserId: string }) => {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"threads" | "allUsers">("threads");
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // GraphQL Queries
  const { data: threadsData, refetch: refetchThreads } = useQuery(GET_MESSAGE_THREADS, {
    variables: { page: 1, limit: 50, userId: UserId },
    skip: !userId,
    pollInterval: 30000,
  });

  const { data: usersData } = useQuery(GET_ALL_USERS, {
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
    skip: !userId,
    pollInterval: 30000,
  });

  const [sendMessageMutation] = useMutation(SEND_MESSAGE);
  const [markMultipleAsReadMutation] = useMutation(MARK_MULTIPLE_AS_READ);

  // Helper functions
  const getUserFullName = (user: User) => `${user.firstName} ${user.lastName}`;
  const getUserAvatar = (user: User) => user.avatar || "/NoImage.webp";
  const formatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Scroll to bottom - immediate with no delay
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // Smooth scroll to bottom
  const smoothScrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Keyboard handling for mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const handleResize = () => {
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;
      
      const windowHeight = window.innerHeight;
      const viewportHeight = visualViewport.height;
      const newKeyboardHeight = Math.max(0, windowHeight - viewportHeight);
      
      setKeyboardHeight(newKeyboardHeight);
      
      if (newKeyboardHeight > 100) {
        setTimeout(scrollToBottom, 100);
      }
    };
    
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, [isMobile, scrollToBottom]);

  // Get user data
  useEffect(() => {
    const getRole = async () => {
      try {
        const response = await fetch('/api/protected', { credentials: 'include' });
        if (response.status === 401) throw new Error('Unauthorized');
        
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

  // Update message threads
  useEffect(() => {
    if (threadsData?.messageThreads?.threads) {
      const sortedThreads = [...threadsData.messageThreads.threads].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setMessageThreads(sortedThreads);
    }
  }, [threadsData]);

  // Convert and set messages
  useEffect(() => {
    if (conversationData?.conversation?.messages && userId) {
      const sortedMessages = [...conversationData.conversation.messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      const uiMessages: Message[] = sortedMessages.map((msg: GraphQLMessage) => ({
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
      
      // Immediate scroll to bottom
      setTimeout(scrollToBottom, 100);
      
      // Mark unread messages as read
      const unreadMessages = uiMessages.filter(msg => !msg.isRead && !msg.isOwnMessage);
      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map(msg => msg.id);
        markMultipleAsReadMutation({ variables: { messageIds: unreadIds } });
      }
    }
  }, [conversationData, userId, markMultipleAsReadMutation, scrollToBottom]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      smoothScrollToBottom();
    }
  }, [messages, smoothScrollToBottom]);

  // Send message
  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !selectedUser || isSending) return;
    
    setIsSending(true);
    try {
      const { data } = await sendMessageMutation({
        variables: {
          input: {
            senderId: UserId,
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
        
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        
        refetchThreads();
        refetchConversation();
        
        // Immediate scroll after sending
        setTimeout(scrollToBottom, 50);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  };

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    if (isMobile) setIsSidebarOpen(false);
    await refetchConversation({ userId: user.id });
    setTimeout(scrollToBottom, 100);
  };

  // Group messages by date
  const messageGroups = useMemo(() => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
    });
    return groups;
  }, [messages]);

  // Filter contacts
  const allContacts = useMemo(() => {
    const threadUsers = messageThreads.map(t => t.user);
    const otherUsers = usersData?.users?.filter((user: User) => 
      user.id !== userId && !threadUsers.some(tu => tu.id === user.id)
    ) || [];
    return [...threadUsers, ...otherUsers];
  }, [messageThreads, usersData?.users, userId]);

  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return allContacts;
    const searchLower = searchTerm.toLowerCase();
    return allContacts.filter(user => 
      getUserFullName(user).toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  }, [allContacts, searchTerm]);

  const displayContacts = useMemo(() => {
    if (activeTab === "threads") {
      return filteredContacts.filter(user => 
        messageThreads.some(thread => thread.user.id === user.id)
      );
    }
    return filteredContacts;
  }, [filteredContacts, activeTab, messageThreads]);

  const getThreadInfo = (user: User) => messageThreads.find(thread => thread.user.id === user.id);

  // Check mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldShowSidebar = isMobile ? isSidebarOpen : true;
  const shouldShowChat = isMobile ? !isSidebarOpen : true;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="h-full max-w-6xl mx-auto bg-white md:rounded-2xl md:shadow-2xl overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className={`
            ${isMobile ? 'absolute inset-0 z-30' : 'relative w-80'}
            bg-white border-r border-gray-200
            transform transition-transform duration-300 ease-in-out
            ${shouldShowSidebar ? 'translate-x-0' : '-translate-x-full'}
            flex flex-col
            h-full
          `}>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Image 
                    src="/VendorCity_Store.webp" 
                    alt="Logo" 
                    height={40} 
                    width={40} 
                    className="rounded-lg bg-white p-1"
                  />
                  <div>
                    <h1 className="text-white font-bold text-lg">Messages</h1>
                    <p className="text-purple-200 text-xs">Connect with others</p>
                  </div>
                </div>
                {isMobile && (
                  <button onClick={() => setIsSidebarOpen(false)} className="text-white">
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="p-4 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 pb-4 flex-shrink-0">
              <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("threads")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === "threads"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Conversations
                </button>
                <button
                  onClick={() => setActiveTab("allUsers")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === "allUsers"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All Users
                </button>
              </div>
            </div>

            {/* Contacts List - Scrollable */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {displayContacts.map((user) => {
                const thread = getThreadInfo(user);
                return (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={`
                      w-full flex items-center space-x-3 p-3 rounded-xl transition-all mb-1
                      ${selectedUser?.id === user.id 
                        ? 'bg-purple-50 border-l-4 border-purple-500' 
                        : 'hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={getUserAvatar(user)}
                        alt={getUserFullName(user)}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {thread && thread.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{getUserFullName(user)}</h3>
                      <p className="text-sm text-gray-500 truncate">
                        {thread?.lastMessage?.body || user?.email || 'Start a conversation'}
                      </p>
                    </div>
                    {thread?.lastMessage && (
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatTime(thread.lastMessage.createdAt)}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                );
              })}
              
              {displayContacts.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">
                    {searchTerm ? 'No users found' : 'No conversations yet'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          {shouldShowChat && (
            <div className="flex-1 flex flex-col h-full bg-gray-50">
              {/* Chat Header - Fixed */}
              {selectedUser ? (
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
                  <div className="flex items-center space-x-3 min-w-0">
                    {isMobile && (
                      <button onClick={() => setIsSidebarOpen(true)} className="p-2 flex-shrink-0">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                    <img
                      src={getUserAvatar(selectedUser)}
                      alt={getUserFullName(selectedUser)}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h2 className="font-semibold text-gray-800 truncate">{getUserFullName(selectedUser)}</h2>
                      <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button className="p-2 text-gray-600 hover:text-purple-600 transition-colors flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Image 
                        src="/VendorCity_Store.webp" 
                        alt="Logo" 
                        height={40} 
                        width={40} 
                        className="rounded-lg"
                      />
                      <div>
                        <h2 className="font-semibold text-gray-800">Messages</h2>
                        <p className="text-xs text-gray-500">Select a conversation to start messaging</p>
                      </div>
                    </div>
                    {isMobile && (
                      <button onClick={() => setIsSidebarOpen(true)} className="p-2">
                        <Menu className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Messages Container - Scrollable with proper height */}
              <div className="flex-1 relative overflow-hidden">
                <div 
                  ref={messagesContainerRef}
                  className="absolute inset-0 overflow-y-auto"
                  style={{
                    paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '16px'
                  }}
                >
                  {selectedUser ? (
                    <div className="p-4">
                      {Object.entries(messageGroups).map(([date, dateMessages]) => (
                        <div key={date}>
                          <div className="flex justify-center my-4">
                            <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                              {date}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {dateMessages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                              >
                                {!message.isOwnMessage && (
                                  <img
                                    src={message.avatar}
                                    alt={message.sender}
                                    className="w-8 h-8 rounded-full object-cover mr-2 self-end mb-1 flex-shrink-0"
                                  />
                                )}
                                <div className={`max-w-[70%] ${message.isOwnMessage ? 'items-end' : 'items-start'}`}>
                                  <div className={`
                                    rounded-2xl px-4 py-2
                                    ${message.isOwnMessage 
                                      ? 'bg-purple-600 text-white rounded-br-none' 
                                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                    }
                                  `}>
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                      {message.content}
                                    </p>
                                  </div>
                                  <div className={`flex items-center gap-1 mt-1 text-xs ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                    <span className={message.isOwnMessage ? 'text-purple-500' : 'text-gray-400'}>
                                      {formatTime(message.timestamp)}
                                    </span>
                                    {message.isOwnMessage && (
                                      <Check className="w-3 h-3 text-purple-500" />
                                    )}
                                  </div>
                                </div>
                                {message.isOwnMessage && (
                                  <img
                                    src={message.avatar}
                                    alt={message.sender}
                                    className="w-8 h-8 rounded-full object-cover ml-2 self-end mb-1 flex-shrink-0"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No conversation selected</h3>
                        <p className="text-sm text-gray-500">Choose a contact to start messaging</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area - Fixed at bottom */}
              {selectedUser && (
                <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
                  <div className="flex space-x-3">
                    <div className="flex-1 bg-gray-100 rounded-2xl focus-within:ring-2 focus-within:ring-purple-500">
                      <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={handleTextareaChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="w-full px-4 py-2 bg-transparent focus:outline-none resize-none rounded-2xl min-h-[40px] max-h-[100px] text-sm"
                        rows={1}
                        style={{ height: 'auto' }}
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="bg-purple-600 text-white p-2 rounded-2xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] h-[44px] flex items-center justify-center"
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex space-x-2 mt-2 px-1">
                    <button className="p-1 text-gray-400 hover:text-purple-600 transition-colors">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-purple-600 transition-colors">
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-400 ml-auto hidden md:block">
                      Enter to send • Shift+Enter for new line
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PMTab;
