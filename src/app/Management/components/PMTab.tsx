'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { decryptToken } from '../../../../utils/decryptToken';
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser } from '../../../../Redux/selectedUserSlice';

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
  Image,
  MessageSquare,
  Loader2
} from 'lucide-react';

// Shimmer Components with proper shimmer effect
const Shimmer = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={`relative overflow-hidden bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 ${className}`}>
    {children}
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
  </div>
);

const ContactShimmer = () => (
  <div className="w-full flex items-center space-x-3 p-3 rounded-xl mb-1">
    <Shimmer className="w-12 h-12 rounded-xl" />
    <div className="flex-1">
      <Shimmer className="h-4 rounded w-3/4 mb-2" />
      <Shimmer className="h-3 rounded w-1/2" />
    </div>
    <Shimmer className="w-4 h-4 rounded" />
  </div>
);

const MessageShimmer = ({ isOwnMessage = false }: { isOwnMessage?: boolean }) => (
  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
    {!isOwnMessage && (
      <Shimmer className="w-8 h-8 rounded-full mr-2 self-end mb-1" />
    )}
    <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
      <Shimmer className={`rounded-2xl ${isOwnMessage ? 'w-48' : 'w-64'}`}>
        <div className="h-10"></div>
      </Shimmer>
      <div className="mt-1">
        <Shimmer className="h-3 rounded w-16" />
      </div>
    </div>
    {isOwnMessage && (
      <Shimmer className="w-8 h-8 rounded-full ml-2 self-end mb-1" />
    )}
  </div>
);

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

const PMTab = ({ UserId }: { UserId: string }) => {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Use Redux for selectedUser (this is the ID)
  const dispatch = useDispatch();
  const selectedUserId = useSelector((state: any) => state.selectedUser.value);
  const [selectedUser, setSelectedUserState] = useState<User | null>(null);
  
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"threads" | "allUsers">("threads");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // GraphQL Queries
  const { data: threadsData, loading: threadsLoading, refetch: refetchThreads } = useQuery(GET_MESSAGE_THREADS, {
    variables: { page: 1, limit: 50, userId: UserId },
    pollInterval: 30000,
  });

  const { data: usersData, loading: usersLoading } = useQuery(GET_ALL_USERS, {
    skip: !userId
  });

  // Fetch user details when selectedUserId changes
  const { data: selectedUserData, loading: selectedUserLoading } = useQuery(GET_USER_BY_ID, {
    variables: { userId: selectedUserId },
    skip: !selectedUserId
  });

  const { data: conversationData, loading: conversationLoading, refetch: refetchConversation } = useQuery(GET_CONVERSATION, {
    variables: { 
      currentUser: UserId,
      userId: selectedUserId,
      page: 1,
      limit: 50
    },
    skip: !selectedUserId || !userId,
    pollInterval: 30000,
  });

  const { data: unreadCountData } = useQuery(GET_UNREAD_MESSAGE_COUNT, {
    skip: !userId,
    pollInterval: 30000,
  });

  // GraphQL Mutations
  const [sendMessageMutation] = useMutation(SEND_MESSAGE);
  const [markAsReadMutation] = useMutation(MARK_AS_READ);
  const [markMultipleAsReadMutation] = useMutation(MARK_MULTIPLE_AS_READ);
  const [replyMessageMutation] = useMutation(REPLY_MESSAGE);

  // Update selectedUser state when data is fetched
  useEffect(() => {
    if (selectedUserData?.user) {
      setSelectedUserState(selectedUserData.user);
    } else if (!selectedUserId) {
      setSelectedUserState(null);
    }
  }, [selectedUserData, selectedUserId]);

  // Combine and filter contacts
  const allContacts = useMemo(() => {
    const threadUsers = messageThreads.map((thread: MessageThread) => thread.user);
    const otherUsers = usersData?.users?.filter((user: User) => 
      user.id !== userId &&
      !threadUsers.some(threadUser => threadUser.id === user.id)
    ) || [];
    
    return [...threadUsers, ...otherUsers];
  }, [messageThreads, usersData?.users, userId]);

  // Filter contacts based on search term
  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return allContacts;
    
    const searchLower = searchTerm.toLowerCase();
    return allContacts.filter(user => 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  }, [allContacts, searchTerm]);

  // Filter contacts by tab
  const displayContacts = useMemo(() => {
    if (activeTab === "threads") {
      return filteredContacts.filter(user => 
        messageThreads.some(thread => thread.user.id === user.id)
      );
    } else {
      return filteredContacts;
    }
  }, [filteredContacts, activeTab, messageThreads]);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
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

  // Enhanced keyboard detection for mobile
  useEffect(() => {
    if (!isMobile || !window.visualViewport) return;
    
    const visualViewport = window.visualViewport;
    
    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const viewportHeight = visualViewport.height;
      const newKeyboardHeight = windowHeight - viewportHeight;
      
      if (newKeyboardHeight > 100 && isInputFocused) {
        setIsKeyboardVisible(true);
        setKeyboardHeight(newKeyboardHeight);
        
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (textareaRef.current && textareaRef.current.contains(e.target as Node)) {
        setIsInputFocused(true);
        setTimeout(() => {
          handleResize();
        }, 200);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (!textareaRef.current?.contains(e.target as Node)) {
        setIsInputFocused(false);
        setTimeout(() => {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
        }, 100);
      }
    };

    visualViewport.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    handleResize();

    return () => {
      visualViewport.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [isMobile, isInputFocused]);

  // Adjust messages container padding when keyboard is visible
  useEffect(() => {
    if (messagesContainerRef.current && isMobile) {
      if (isKeyboardVisible) {
        messagesContainerRef.current.style.bottom = `${keyboardHeight}px`;
      } else {
        messagesContainerRef.current.style.bottom = '0px';
      }
    }
  }, [isKeyboardVisible, keyboardHeight, isMobile]);

  useEffect(() => {
    const getRole = async () => {
      try {
        setIsInitialLoading(true);
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
        setAvatar(payload.image?payload.image:"/NoImage_1.webp");
      } catch (err) {
        console.error('Error getting role:', err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    getRole();
  }, []);

  // Update message threads when data loads
  useEffect(() => {
    if (threadsData?.messageThreads?.threads) {
      const sortedThreads = [...threadsData.messageThreads.threads].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setMessageThreads(sortedThreads);
    }
  }, [threadsData]);

  // Convert GraphQL messages to UI messages - SORT BY LATEST FIRST
  useEffect(() => {
    if (conversationData?.conversation?.messages && userId) {
      const sortedMessages = [...conversationData.conversation.messages].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
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
    if (newMessage.trim() === "" || !selectedUserId || isSending) return;

    setIsSending(true);

    try {
      const { data } = await sendMessageMutation({
        variables: {
          input: {
            senderId: userId,
            recipientId: selectedUserId,
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
        refetchConversation();
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

  const handleUserSelect = async (user: User) => {
    dispatch(setSelectedUser(user.id)); // Store only the ID in Redux
    setSelectedThread(messageThreads.find(thread => thread.user.id === user.id) || null);
    
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
    dispatch(setSelectedUser("")); // Clear the ID from Redux
    setSelectedThread(null);
    if (isMobile) {
      setIsSidebarOpen(true);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTextareaFocus = () => {
    setIsInputFocused(true);
  };

  const handleTextareaBlur = () => {
    setIsInputFocused(false);
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

  const getThreadInfo = (user: User) => {
    return messageThreads.find(thread => thread.user.id === user.id);
  };

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
    return user.avatar || "/NoImage_1.webp";
  };

  const shouldShowSidebar = isMobile ? isSidebarOpen : true;
  const shouldShowChat = isMobile ? !isSidebarOpen : true;
  
  const isSidebarLoading = isInitialLoading || threadsLoading || usersLoading;
  const isChatLoading = conversationLoading && selectedUser;
 
  return (
    <div>
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-100 to-zinc-200">
        <div className="h-full max-w-6xl mx-auto bg-white md:rounded-2xl md:shadow-2xl overflow-hidden">
          <div className="flex h-full">
            {/* Sidebar/Contacts List */}
            <div className={`
              ${isMobile ? 'absolute inset-0 z-30' : 'relative w-80'}
              bg-white border-r border-zinc-200
              transform transition-transform duration-300 ease-in-out
              ${shouldShowSidebar ? 'translate-x-0' : '-translate-x-full'}
              flex flex-col
              h-full
            `}>
              {/* Fixed Sidebar Header */}
              <div className="flex-shrink-0">
                <div className="relative p-0 aspect-[4/1] sm:aspect-[9/1] bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(113,113,122,0.3)_100%)]">
                  <div className="z-20 flex items-center justify-between p-2 h-[100%] w-[100%]">
                    <div className="z-20 h-[100%] flex items-center">
                      <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-zinc-700 to-zinc-800 bg-clip-text text-transparent">
                        Messages
                      </h1>
                    </div>
                    {isMobile && (
                      <button 
                        onClick={handleToggleSidebar}
                        className="z-20 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300"
                      >
                        <X className="w-5 h-5 text-gray-700" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Search and Tabs */}
                <div className="p-4 border-b border-zinc-200">
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent bg-white"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                  </div>

                  {/* Tabs */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setActiveTab("threads")}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                        activeTab === "threads"
                          ? "bg-gradient-to-r from-zinc-700 to-zinc-800 text-white shadow-md"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      Conversations
                    </button>
                    <button
                      onClick={() => setActiveTab("allUsers")}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                        activeTab === "allUsers"
                          ? "bg-gradient-to-r from-zinc-700 to-zinc-800 text-white shadow-md"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      All Users
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Contacts List with Shimmer */}
              <div className="flex-1 overflow-y-auto px-2 pb-4">
                {isSidebarLoading ? (
                  // Show shimmer while loading
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
                        <button
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          className={`
                            w-full flex items-center space-x-3 p-3 rounded-xl transition-all mb-1
                            ${selectedUserId === user.id 
                              ? 'bg-gradient-to-r from-zinc-50 to-zinc-100 border-l-4 border-zinc-500' 
                              : 'hover:bg-zinc-50'
                            }
                          `}
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              src={getUserAvatar(user)}
                              alt={getUserFullName(user)}
                              className="w-12 h-12 rounded-xl object-cover border-2 border-zinc-200"
                            />
                            {thread && thread.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <h3 className="font-semibold text-gray-800 truncate">{getUserFullName(user)}</h3>
                            <p className="text-sm text-zinc-500 truncate">
                              {thread?.lastMessage?.body || user?.email || 'Start a conversation'}
                            </p>
                          </div>
                          {thread?.lastMessage && (
                            <span className="text-xs text-zinc-400 flex-shrink-0">
                              {formatTime(thread.lastMessage.createdAt)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    
                    {displayContacts.length === 0 && (
                      <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
                        <p className="text-zinc-500">
                          {searchTerm ? 'No users found' : 
                           activeTab === "threads" ? 'No conversations yet' : 'No users available'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Chat Area - Only show when not in sidebar mode on mobile */}
            {shouldShowChat && (
              <div className="flex-1 flex flex-col h-full bg-white">
                {/* Chat Header */}
                {selectedUser ? (
                  <div className="flex-shrink-0">
                    <div className="relative p-0 aspect-[4/1] sm:aspect-[9/1] bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(113,113,122,0.3)_100%)]">
                      <div className="z-20 flex items-center justify-between p-2 h-[100%] w-[100%]">
                        <div className="z-20 h-[100%] flex items-center gap-3 min-w-0 flex-1">
                          {isMobile && (
                            <button 
                              onClick={handleBackToContacts}
                              className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300 flex-shrink-0"
                            >
                              <ChevronLeft className="w-5 h-5 text-gray-700" />
                            </button>
                          )}
                          <img
                            src={getUserAvatar(selectedUser)}
                            alt={getUserFullName(selectedUser)}
                            className="w-10 h-10 rounded-xl object-cover border-2 border-zinc-200 flex-shrink-0"
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <h2 className="font-bold text-gray-800 text-sm md:text-base truncate">
                              {getUserFullName(selectedUser)}
                            </h2>
                            <p className="text-xs text-zinc-500 truncate">
                              {selectedUser.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                          <button className="p-2 text-zinc-600 hover:text-zinc-800 transition-all duration-300">
                            <Phone className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={handleToggleSidebar}
                            className="p-2 text-zinc-600 hover:text-zinc-800 transition-all duration-300 md:hidden"
                          >
                            <Menu className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-shrink-0">
                    <div className="relative p-0 aspect-[4/1] sm:aspect-[9/1] bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(113,113,122,0.3)_100%)]">
                      <div className="z-20 flex items-center justify-between p-2 h-[100%] w-[100%]">
                        <div className="z-20 h-[100%] flex items-center min-w-0 flex-1">
                          <div>
                            <h2 className="font-bold text-gray-800 text-sm md:text-base">Messages</h2>
                            <p className="text-xs text-zinc-500">Select a conversation</p>
                          </div>
                        </div>
                        {isMobile && (
                          <button 
                            onClick={handleToggleSidebar}
                            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300 flex-shrink-0"
                          >
                            <Menu className="w-5 h-5 text-gray-700" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages Container - Scrollable with Shimmer */}
                <div className="flex-1 relative overflow-hidden">
                  <div 
                    ref={messagesContainerRef}
                    className="absolute inset-0 overflow-y-auto bg-gradient-to-br from-white to-zinc-50"
                  >
                    {selectedUser ? (
                      isChatLoading ? (
                        // Show shimmer while loading messages
                        <div className="p-4">
                          <div className="flex justify-center my-4">
                            <Shimmer className="h-6 w-20 rounded-full" />
                          </div>
                          <MessageShimmer />
                          <MessageShimmer isOwnMessage={true} />
                          <MessageShimmer />
                          <MessageShimmer isOwnMessage={true} />
                          <MessageShimmer />
                        </div>
                      ) : (
                        <div className="p-4">
                          {Object.entries(messageGroups).map(([date, dateMessages]) => (
                            <div key={date}>
                              <div className="flex justify-center my-4">
                                <span className="bg-gradient-to-r from-zinc-100 to-zinc-200 text-zinc-600 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
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
                                        className="w-8 h-8 rounded-full object-cover border-2 border-zinc-200 mr-2 self-end mb-1 flex-shrink-0"
                                      />
                                    )}
                                    <div className={`max-w-[70%] ${message.isOwnMessage ? 'items-end' : 'items-start'}`}>
                                      <div className={`
                                        rounded-2xl px-4 py-2
                                        ${message.isOwnMessage 
                                          ? 'bg-gradient-to-r from-zinc-600 to-zinc-700 text-white rounded-br-none shadow-md' 
                                          : 'bg-white text-gray-800 border border-zinc-200 rounded-bl-none shadow-sm'
                                        }
                                      `}>
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                          {message.content}
                                        </p>
                                      </div>
                                      <div className={`flex items-center gap-1 mt-1 text-xs ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                        <span className={message.isOwnMessage ? 'text-zinc-400' : 'text-gray-400'}>
                                          {formatTime(message.timestamp)}
                                        </span>
                                        {message.isOwnMessage && (
                                          <Check className="w-3 h-3 text-zinc-400" />
                                        )}
                                      </div>
                                    </div>
                                    {message.isOwnMessage && (
                                      <img
                                        src={message.avatar}
                                        alt={message.sender}
                                        className="w-8 h-8 rounded-full object-cover border-2 border-zinc-200 ml-2 self-end mb-1 flex-shrink-0"
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
                </div>

                {/* Message Input */}
                {selectedUser && !isChatLoading && (
                  <div 
                    className="border-t border-zinc-200 bg-white transition-all duration-300 flex-shrink-0"
                    style={{
                      position: isKeyboardVisible && isMobile ? 'fixed' : 'static',
                      bottom: isKeyboardVisible && isMobile ? '0px' : '0px',
                      left: isKeyboardVisible && isMobile ? '0' : '0',
                      right: isKeyboardVisible && isMobile ? '0' : '0',
                      width: isKeyboardVisible && isMobile ? '100%' : '100%',
                      zIndex: isKeyboardVisible && isMobile ? 1000 : 'auto',
                    }}
                  >
                    <div 
                      className="p-4 mx-auto w-full"
                      style={{
                        maxWidth: isKeyboardVisible && isMobile ? '100%' : 'none',
                        paddingLeft: isKeyboardVisible && isMobile ? '1rem' : '1rem',
                        paddingRight: isKeyboardVisible && isMobile ? '1rem' : '1rem',
                      }}
                    >
                      <div className="flex space-x-3">
                        <div className="flex-1 bg-zinc-50 rounded-2xl border border-zinc-200 focus-within:ring-2 focus-within:ring-zinc-400 transition-all duration-300">
                          <textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            onFocus={handleTextareaFocus}
                            onBlur={handleTextareaBlur}
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
                          className="bg-gradient-to-r from-zinc-600 to-zinc-700 text-white p-3 rounded-2xl hover:from-zinc-700 hover:to-zinc-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transform hover:scale-105 active:scale-95 min-w-[52px]"
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
                            className="p-2 text-zinc-400 hover:text-zinc-600 transition-all duration-300 hover:scale-110"
                            disabled={isSending}
                          >
                            <Paperclip className="w-5 h-5" />
                          </button>
                          <button 
                            className="p-2 text-zinc-400 hover:text-zinc-600 transition-all duration-300 hover:scale-110"
                            disabled={isSending}
                          >
                            <Image className="w-5 h-5" />
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
        
        /* Custom scrollbar */
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

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .messages-scrollbar::-webkit-scrollbar {
            width: 3px;
          }
        }

        /* Loading animation */
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
  );
};

export default PMTab;
