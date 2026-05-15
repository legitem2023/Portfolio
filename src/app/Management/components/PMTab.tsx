'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser } from '../../../../Redux/selectedUserSlice';
import { decryptToken } from '../../../../utils/decryptToken';
import VideoCall from '../../components/VideoCall';

import { 
  Search, 
  X, 
  ChevronLeft, 
  Menu, 
  Phone, 
  Check, 
  MessageCircle, 
  Send, 
  Paperclip, 
  Image as ImageIcon,
  MessageSquare,
  Loader2,
  ArrowLeft
} from 'lucide-react';

// Shimmer Components
const Shimmer = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={`relative overflow-hidden bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 ${className}`}>
    {children}
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
  </div>
);

const ContactShimmer = () => (
  <div className="flex items-center p-3 border-b border-zinc-100">
    <Shimmer className="w-10 h-10 md:w-12 md:h-12 rounded-xl" />
    <div className="ml-3 flex-1">
      <Shimmer className="h-4 rounded w-3/4 mb-2" />
      <Shimmer className="h-3 rounded w-1/2" />
    </div>
  </div>
);

const MessageShimmer = ({ isOwnMessage = false }: { isOwnMessage?: boolean }) => (
  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
    {!isOwnMessage && (
      <Shimmer className="w-6 h-6 md:w-8 md:h-8 rounded-full mr-2 self-end mb-1" />
    )}
    <div className={`max-w-[85%] md:max-w-xs lg:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'}`}>
      <Shimmer className={`rounded-2xl md:rounded-3xl ${isOwnMessage ? 'w-48' : 'w-64'}`}>
        <div className="h-10 md:h-12"></div>
      </Shimmer>
      <div className="mt-1">
        <Shimmer className="h-3 rounded w-16" />
      </div>
    </div>
    {isOwnMessage && (
      <Shimmer className="w-6 h-6 md:w-8 md:h-8 rounded-full ml-2 self-end mb-1" />
    )}
  </div>
);

// GraphQL Queries & Mutations
const GET_CONVERSATION = gql`
  query GetConversation($currentUser:ID, $userId: ID!, $page: Int, $limit: Int) {
    conversation(currentUser:$currentUser, userId: $userId, page: $page, limit: $limit) {
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
    messageThreads(page: $page, limit: $limit, userId:$userId) {
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

const GET_USER_BY_ID = gql`
  query GetUserById($userId: ID!) {
    user(id: $userId) {
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const userIdFromUrl = searchParams.get('id');
  const dispatch = useDispatch();
  const reduxSelectedUserId = useSelector((state: any) => state.selectedUser.value);
  
  // State
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUserState] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"threads" | "allUsers">("threads");
  const [isSending, setIsSending] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasAttemptedUrlSelection, setHasAttemptedUrlSelection] = useState(false);
  
  // Video Call States
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallTarget, setVideoCallTarget] = useState<User | null>(null);
  const [isInitiator, setIsInitiator] = useState(true);
  const [incomingCallData, setIncomingCallData] = useState<any>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pusherRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  // GraphQL Queries
  const { data: threadsData, loading: threadsLoading, refetch: refetchThreads } = useQuery(GET_MESSAGE_THREADS, {
    variables: { page: 1, limit: 50, userId: UserId },
    skip: !UserId,
    pollInterval: 10000,
  });

  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery(GET_ALL_USERS);

  const { data: conversationData, loading: conversationLoading, refetch: refetchConversation } = useQuery(GET_CONVERSATION, {
    variables: { 
      currentUser: UserId,
      userId: selectedUser?.id,
      page: 1,
      limit: 50
    },
    skip: !selectedUser?.id || !UserId,
    pollInterval: 10000,
  });

  const { data: unreadCountData } = useQuery(GET_UNREAD_MESSAGE_COUNT, {
    skip: !UserId,
    pollInterval: 10000,
  });

  const { data: selectedUserData } = useQuery(GET_USER_BY_ID, {
    variables: { userId: reduxSelectedUserId },
    skip: !reduxSelectedUserId
  });

  // GraphQL Mutations
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

  // Scroll functions
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  const smoothScrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Initialize Pusher for incoming calls
  useEffect(() => {
    if (!userId) return;

    const initPusher = async () => {
      try {
        const Pusher = (await import('pusher-js')).default;
        
        if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
          console.error('Pusher configuration missing');
          return;
        }

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
          authEndpoint: '/api/pusher/auth',
        });

        pusherRef.current = pusher;
        const channel = pusher.subscribe(`private-user-${userId}`);
        channelRef.current = channel;

        // Listen for incoming calls
        channel.bind('incoming-call', (data: any) => {
          console.log('Incoming call received:', data);
          
          // Don't show if already in a call
          if (showVideoCall) return;
          
          // Find the caller in users list
          const caller = usersData?.users?.find((u: User) => u.id === data.fromUserId);
          
          if (caller) {
            setVideoCallTarget(caller);
            setIncomingCallData(data);
            setIsInitiator(false);
            setShowVideoCall(true);
          } else {
            // If caller not in list, create temporary user object
            setVideoCallTarget({
              id: data.fromUserId,
              firstName: 'Unknown',
              lastName: 'Caller',
              avatar: '/NoImage.webp',
              email: ''
            });
            setIncomingCallData(data);
            setIsInitiator(false);
            setShowVideoCall(true);
          }
        });

        // Listen for call acceptance
        channel.bind('call-accepted', (data: any) => {
          console.log('Call accepted:', data);
        });

        // Listen for call rejection
        channel.bind('call-rejected', (data: any) => {
          console.log('Call rejected:', data);
        });

      } catch (error) {
        console.error('Error initializing Pusher:', error);
      }
    };

    initPusher();

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, [userId, usersData?.users, showVideoCall]);

  // Handle outgoing video call
  const handleVideoCall = useCallback((user: User) => {
    if (showVideoCall) return;
    setVideoCallTarget(user);
    setIsInitiator(true);
    setIncomingCallData(null);
    setShowVideoCall(true);
  }, [showVideoCall]);

  const handleCallClose = useCallback(() => {
    setShowVideoCall(false);
    setVideoCallTarget(null);
    setIsInitiator(true);
    setIncomingCallData(null);
  }, []);

  // Update selectedUser from Redux
  useEffect(() => {
    if (selectedUserData?.user) {
      setSelectedUserState(selectedUserData.user);
    } else if (!reduxSelectedUserId) {
      setSelectedUserState(null);
    }
  }, [selectedUserData, reduxSelectedUserId]);

  // Get current user data
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        setIsInitialLoading(true);
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
        console.error('Error getting user:', err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    getCurrentUser();
  }, []);

  // Handle URL parameter to auto-select user
  useEffect(() => {
    if (userIdFromUrl && usersData?.users && !hasAttemptedUrlSelection && !selectedUser && !usersLoading && userId) {
      const userFromUrl = usersData.users.find((user: User) => user.id === userIdFromUrl);
      if (userFromUrl && userFromUrl.id !== userId) {
        handleUserSelect(userFromUrl);
        setHasAttemptedUrlSelection(true);
        
        // Remove ID from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('id');
        router.replace(newUrl.pathname + newUrl.search);
      } else if (userFromUrl && userFromUrl.id === userId) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('id');
        router.replace(newUrl.pathname + newUrl.search);
      }
    }
  }, [userIdFromUrl, usersData?.users, selectedUser, hasAttemptedUrlSelection, router, usersLoading, userId]);

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
      setTimeout(scrollToBottom, 100);
      
      // Mark unread messages as read
      const unreadMessages = uiMessages.filter(msg => !msg.isRead && !msg.isOwnMessage);
      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map(msg => msg.id);
        markMultipleAsReadMutation({ variables: { messageIds: unreadIds } })
          .catch(err => console.error('Error marking messages as read:', err));
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
            senderId: UserId || userId,
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
        
        await refetchThreads();
        await refetchConversation();
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

  const handleUserSelect = useCallback(async (user: User) => {
    if (user.id === userId) return;
    
    dispatch(setSelectedUser(user.id));
    setSelectedUserState(user);
    if (isMobile) setIsSidebarOpen(false);
    await refetchConversation({ userId: user.id });
    setTimeout(scrollToBottom, 100);
  }, [isMobile, refetchConversation, scrollToBottom, userId, dispatch]);

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

  // Loading states
  const isSidebarLoading = isInitialLoading || threadsLoading || usersLoading;
  const isChatLoading = conversationLoading && selectedUser;
 
  return (
    <>
      {/* Video Call Component - Supports both outgoing and incoming calls */}
      {showVideoCall && videoCallTarget && userId && (
        <VideoCall
          userId={userId}
          targetUserId={videoCallTarget.id}
          targetUserName={getUserFullName(videoCallTarget)}
          onClose={handleCallClose}
          isInitiator={isInitiator}
          incomingCallData={incomingCallData}
        />
      )}

      <div>
        <div className="relative top-0 h-[100vh] bg-gradient-to-br from-zinc-100 to-zinc-200">
          <div className="max-w-6xl mx-auto bg-white rounded-none shadow-none md:shadow-xl md:shadow-2xl overflow-hidden h-full">
            <div className="flex h-full relative">
              {/* Sidebar/Contacts List */}
              <div className={`
                ${isMobile ? 'absolute inset-0 z-30 w-full' : 'relative z-20 w-1/3 lg:w-1/4 flex-shrink-0'}
                bg-gradient-to-b from-zinc-50 to-zinc-100 border-r border-zinc-200
                transform transition-transform duration-300 ease-in-out h-full
                ${shouldShowSidebar ? 'translate-x-0' : '-translate-x-full'}
                flex flex-col
              `}>
                {/* Sidebar Header */}
                <div className="flex-shrink-0">
                  <div className="relative p-0 aspect-[4/1] sm:aspect-[9/1] bg-gradient-to-r from-zinc-700 to-zinc-800 flex-shrink-0">
                    <div className="z-20 flex items-center justify-between p-2 h-[100%] w-[100%]">
                      <div className="z-20 h-[100%] flex items-center">
                        <Image 
                          src="/VendorCity_Store.webp" 
                          alt="Logo" 
                          height={100} 
                          width={100} 
                          className="h-[100%] w-[auto] rounded transform transition-all duration-300 hover:scale-105 cursor-pointer"
                        />
                      </div>
                      <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white">Messages</h1>
                        <p className="text-zinc-300 text-sm hidden md:block">
                          {unreadCountData?.unreadMessageCount > 0 
                            ? `${unreadCountData.unreadMessageCount} unread messages`
                            : 'Chat with your connections'
                          }
                        </p>
                      </div>
                      {isMobile && (
                        <button 
                          onClick={() => setIsSidebarOpen(false)}
                          className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Search and Tabs */}
                <div className="p-3 md:p-4 bg-white border-b border-zinc-200 flex-shrink-0">
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 md:py-3 text-sm md:text-base rounded-xl md:rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent bg-white"
                    />
                    <Search className="absolute left-2.5 top-2.5 md:left-3 md:top-3 h-4 w-4 md:h-5 md:w-5 text-zinc-400" />
                  </div>

                  {/* Tabs */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setActiveTab("threads")}
                      className={`flex-1 py-2 px-3 text-xs md:text-sm rounded-lg font-medium transition-colors ${
                        activeTab === "threads"
                          ? "bg-zinc-700 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      Conversations
                    </button>
                    <button
                      onClick={() => setActiveTab("allUsers")}
                      className={`flex-1 py-2 px-3 text-xs md:text-sm rounded-lg font-medium transition-colors ${
                        activeTab === "allUsers"
                          ? "bg-zinc-700 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      All Users
                    </button>
                  </div>
                </div>

                {/* Scrollable Contacts List */}
                <div className="flex-1 overflow-y-auto messages-scrollbar">
                  {isSidebarLoading ? (
                    <>
                      <ContactShimmer />
                      <ContactShimmer />
                      <ContactShimmer />
                      <ContactShimmer />
                      <ContactShimmer />
                    </>
                  ) : (
                    <>
                      {displayContacts.map((user) => {
                        const thread = getThreadInfo(user);
                        return (
                          <div key={user.id} className="relative group">
                            <div
                              className={`flex items-center p-3 border-b border-zinc-100 cursor-pointer transition-all duration-200 ${
                                selectedUser?.id === user.id ? 'bg-zinc-50 border-l-4 border-l-zinc-500' : 'hover:bg-zinc-50'
                              }`}
                              onClick={() => handleUserSelect(user)}
                            >
                              <div className="relative flex-shrink-0">
                                <img
                                  src={getUserAvatar(user)}
                                  alt={getUserFullName(user)}
                                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover border-2 border-zinc-200"
                                />
                                {thread && thread.unreadCount > 0 && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                    {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                                  </div>
                                )}
                              </div>
                              <div className="ml-3 flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <h3 className="font-semibold text-zinc-800 text-sm md:text-base truncate">
                                    {getUserFullName(user)}
                                  </h3>
                                  {thread?.lastMessage && (
                                    <span className="text-xs text-zinc-400 whitespace-nowrap ml-2">
                                      {formatTime(thread.lastMessage.createdAt)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs md:text-sm text-zinc-500 truncate">
                                  {thread?.lastMessage?.body || user?.email || 'Start a conversation'}
                                </p>
                                {!thread && (
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded-full">
                                    New
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Video Call Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVideoCall(user);
                              }}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-purple-100 text-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-purple-200"
                              title="Start video call"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                      
                      {displayContacts.length === 0 && (
                        <div className="text-center py-8 text-zinc-400">
                          <MessageCircle className="w-12 h-12 mx-auto mb-3" />
                          <p className="text-sm">
                            {searchTerm ? 'No users found' : 
                             activeTab === "threads" ? 'No conversations yet' : 'No users available'}
                          </p>
                          <p className="text-xs mt-1">
                            {searchTerm ? 'Try a different search term' : 'Start a conversation with someone!'}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Chat Area */}
              {shouldShowChat && (
                <div className="flex-1 flex flex-col h-full bg-white">
                  {/* Chat Header */}
                  {selectedUser ? (
                    <div className="flex-shrink-0">
                      <div className="relative p-0 aspect-[4/1] sm:aspect-[9/1] bg-gradient-to-r from-zinc-700 to-zinc-800">
                        <div className="z-20 flex items-center justify-between p-2 h-[100%] w-[100%]">
                          <div className="z-20 h-[100%] flex items-center gap-3 min-w-0 flex-1">
                            {isMobile && (
                              <button 
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300 flex-shrink-0"
                              >
                                <ArrowLeft className="w-5 h-5 text-white" />
                              </button>
                            )}
                            <Image 
                              src="/VendorCity_Store.webp" 
                              alt="Logo" 
                              height={100} 
                              width={100} 
                              className="h-[100%] w-[auto] rounded transform transition-all duration-300 hover:scale-105 cursor-pointer flex-shrink-0"
                            />
                            <div className="flex flex-col min-w-0 flex-1">
                              <h2 className="font-bold text-white text-sm md:text-base truncate">
                                {getUserFullName(selectedUser)}
                              </h2>
                              <p className="text-xs text-zinc-300 truncate">
                                {selectedUser.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2 flex-shrink-0">
                            {/* Video Call Button in Chat Header */}
                            <button 
                              onClick={() => handleVideoCall(selectedUser)}
                              className="p-2 text-white hover:text-zinc-200 transition-all duration-300 hover:scale-110 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
                              title="Start video call"
                            >
                              <Phone className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => setIsSidebarOpen(true)}
                              className="p-2 text-white hover:text-zinc-200 transition-all duration-300 hover:scale-110 md:hidden"
                            >
                              <Menu className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-shrink-0">
                      <div className="relative p-0 aspect-[4/1] sm:aspect-[9/1] bg-gradient-to-r from-zinc-700 to-zinc-800">
                        <div className="z-20 flex items-center justify-between p-2 h-[100%] w-[100%]">
                          <div className="z-20 h-[100%] flex items-center min-w-0 flex-1">
                            <Image 
                              src="/VendorCity_Store.webp" 
                              alt="Logo" 
                              height={100} 
                              width={100} 
                              className="h-[100%] w-[auto] rounded transform transition-all duration-300 hover:scale-105 cursor-pointer flex-shrink-0"
                            />
                            <div className="ml-3 min-w-0">
                              <h2 className="font-bold text-white text-sm md:text-base truncate">Messages</h2>
                              <p className="text-xs text-zinc-300 truncate">Select a conversation</p>
                            </div>
                          </div>
                          {isMobile && (
                            <button 
                              onClick={() => setIsSidebarOpen(true)}
                              className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300 flex-shrink-0"
                            >
                              <Menu className="w-5 h-5 text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Messages Container */}
                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-zinc-50 messages-scrollbar"
                  >
                    {selectedUser ? (
                      isChatLoading ? (
                        <div className="space-y-4">
                          <div className="flex justify-center my-4">
                            <Shimmer className="h-6 w-20 rounded-full" />
                          </div>
                          <MessageShimmer />
                          <MessageShimmer isOwnMessage={true} />
                          <MessageShimmer />
                          <MessageShimmer isOwnMessage={true} />
                          <MessageShimmer />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-zinc-400">
                            <MessageCircle className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-lg font-medium">No messages yet</p>
                            <p className="text-sm mt-2">Send a message to start the conversation</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(messageGroups).map(([date, dateMessages]) => (
                            <div key={date}>
                              <div className="flex justify-center my-4">
                                <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-xs font-medium">
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
                                        className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover border-2 border-zinc-200 mr-2 self-end mb-1 flex-shrink-0"
                                      />
                                    )}
                                    <div className={`max-w-[85%] md:max-w-xs lg:max-w-md ${message.isOwnMessage ? 'items-end' : 'items-start'}`}>
                                      <div className={`inline-block rounded-2xl md:rounded-3xl p-3 md:p-4 ${
                                        message.isOwnMessage
                                          ? 'bg-gradient-to-r from-zinc-600 to-zinc-700 text-white rounded-br-none'
                                          : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-none'
                                      }`}>
                                        <p className="text-sm md:text-base whitespace-pre-wrap break-words">{message.content}</p>
                                      </div>
                                      <div className={`flex items-center mt-1 space-x-2 text-xs ${
                                        message.isOwnMessage ? 'justify-end' : 'justify-start'
                                      }`}>
                                        <span className={message.isOwnMessage ? 'text-zinc-400' : 'text-zinc-400'}>
                                          {formatTime(message.timestamp)}
                                        </span>
                                        {message.isOwnMessage && (
                                          <Check className="w-3 h-3 md:w-4 md:h-4 text-zinc-400" />
                                        )}
                                      </div>
                                    </div>
                                    {message.isOwnMessage && (
                                      <img
                                        src={message.avatar}
                                        alt={message.sender}
                                        className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover border-2 border-zinc-200 ml-2 self-end mb-1 flex-shrink-0"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-zinc-400">
                          <MessageSquare className="w-16 h-16 mx-auto mb-4" />
                          <p className="text-lg font-medium">Select a conversation</p>
                          <p className="text-sm mt-2">Choose from your contacts to start messaging</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  {selectedUser && !isChatLoading && (
                    <div className="border-t border-zinc-200 bg-white flex-shrink-0">
                      <div className="p-4">
                        <div className="flex space-x-3">
                          <div className="flex-1 bg-zinc-50 rounded-2xl border border-zinc-200 focus-within:ring-2 focus-within:ring-zinc-400 focus-within:border-zinc-300">
                            <textarea
                              ref={textareaRef}
                              value={newMessage}
                              onChange={handleTextareaChange}
                              onKeyPress={handleKeyPress}
                              placeholder={isSending ? "Sending..." : "Type your message..."}
                              disabled={isSending}
                              className="w-full px-4 py-3 text-base bg-transparent focus:outline-none resize-none rounded-2xl min-h-[44px] max-h-[120px] disabled:opacity-60 disabled:cursor-not-allowed"
                              rows={1}
                              style={{ height: 'auto' }}
                            />
                          </div>
                          <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || isSending}
                            className={`bg-gradient-to-r from-zinc-600 to-zinc-700 text-white p-3 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                              isSending ? 'opacity-70 cursor-wait' : 'hover:from-zinc-700 hover:to-zinc-800'
                            }`}
                          >
                            {isSending ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <Send className="w-6 h-6" />
                            )}
                          </button>
                        </div>
                        <div className="flex justify-between items-center mt-2 px-1">
                          <div className="flex space-x-2">
                            <button 
                              className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isSending}
                            >
                              <Paperclip className="w-5 h-5" />
                            </button>
                            <button 
                              className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isSending}
                            >
                              <ImageIcon className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="text-xs text-zinc-400 hidden md:block">
                            Press Enter to send • Shift+Enter for new line
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom Styles */}
        <style jsx global>{`
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
          
          .messages-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          
          .messages-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          
          .messages-scrollbar::-webkit-scrollbar-thumb {
            background: #a1a1aa;
            border-radius: 10px;
          }
          
          .messages-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #71717a;
          }

          @media (max-width: 768px) {
            .messages-scrollbar::-webkit-scrollbar {
              width: 3px;
            }
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default PMTab;
