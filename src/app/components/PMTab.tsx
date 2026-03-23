'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import Image from 'next/image';
import { decryptToken } from '../../../utils/decryptToken';
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
  ChevronRight,
  User
} from 'lucide-react';

// GraphQL Queries & Mutations (same as before)
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Keyboard handling
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // GraphQL Mutations
  const [sendMessageMutation] = useMutation(SEND_MESSAGE);
  const [markMultipleAsReadMutation] = useMutation(MARK_MULTIPLE_AS_READ);

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

  // Enhanced scroll to bottom function with smooth behavior
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (messagesContainerRef.current) {
        const scrollElement = messagesContainerRef.current;
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: behavior
        });
      }
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: behavior,
          block: 'end'
        });
      }
    }, 50);
  };

  // Immediate scroll to bottom (no delay)
  const immediateScrollToBottom = () => {
    if (messagesContainerRef.current) {
      const scrollElement = messagesContainerRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        block: 'end'
      });
    }
  };

  // Keyboard detection for mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const handleResize = () => {
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;
      
      const windowHeight = window.innerHeight;
      const viewportHeight = visualViewport.height;
      const newKeyboardHeight = windowHeight - viewportHeight;
      
      if (newKeyboardHeight > 100 && isInputFocused) {
        setIsKeyboardVisible(true);
        setKeyboardHeight(newKeyboardHeight);
        
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollToBottom('auto');
        }, 150);
      } else if (!isInputFocused) {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (textareaRef.current && textareaRef.current.contains(e.target as Node)) {
        setIsInputFocused(true);
        setTimeout(() => {
          scrollToBottom('auto');
        }, 100);
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

    window.visualViewport?.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isMobile, isInputFocused]);

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
      const sortedThreads = [...threadsData.messageThreads.threads].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setMessageThreads(sortedThreads);
    }
  }, [threadsData]);

  // Convert GraphQL messages to UI messages
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
      
      // Immediate scroll to bottom when messages load
      setTimeout(() => {
        immediateScrollToBottom();
      }, 100);

      const unreadMessages = uiMessages.filter(msg => !msg.isRead && !msg.isOwnMessage);
      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map(msg => msg.id);
        markMultipleAsReadMutation({
          variables: { messageIds: unreadIds }
        });
      }
    }
  }, [conversationData, userId, markMultipleAsReadMutation]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !selectedUser) return;

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
        setTimeout(() => {
          immediateScrollToBottom();
        }, 50);
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
      setTimeout(() => {
        immediateScrollToBottom();
      }, 100);
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

  const handleTextareaFocus = () => {
    setIsInputFocused(true);
    setTimeout(() => {
      scrollToBottom('auto');
    }, 200);
  };

  const handleTextareaBlur = () => {
    setIsInputFocused(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
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
    return user.avatar || "/NoImage.webp";
  };

  const shouldShowSidebar = isMobile ? isSidebarOpen : true;
  const shouldShowChat = isMobile ? !isSidebarOpen : true;

  return (
    <div className="relative top-0 h-[100vh] bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="max-w-6xl mx-auto bg-white rounded-none md:rounded-2xl md:rounded-3xl shadow-none md:shadow-xl md:shadow-2xl overflow-hidden h-full">
        <div className="flex h-full relative">
          {/* Sidebar - Enhanced with animations similar to Header */}
          <div className={`
            ${isMobile ? 'absolute inset-0 z-30' : 'relative z-20 w-1/3 lg:w-1/4 flex-shrink-0'}
            bg-gradient-to-b from-purple-50 via-white to-purple-50 border-r border-purple-100
            transform transition-all duration-300 ease-out
            ${shouldShowSidebar ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
            flex flex-col shadow-xl
          `}>
            <div className="flex-shrink-0">
              {/* Header with Logo - Copied exactly from Header component */}
              <div className="relative p-0 aspect-[4/1] sm:aspect-[9/1] bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(200,180,255,0.5)_100%)]">
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
                  {isMobile && (
                    <button 
                      onClick={handleToggleSidebar}
                      className="z-20 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300 hover:rotate-90"
                    >
                      <X className="w-5 h-5 text-gray-700" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Search and Tabs with hover effects */}
              <div className="p-3 md:p-4 bg-white border-b border-purple-100">
                <div className="relative mb-3 transform transition-all duration-300">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 md:py-3 text-sm md:text-base rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent bg-white transition-all duration-300"
                  />
                  <Search className="absolute left-2.5 top-2.5 md:left-3 md:top-3 h-4 w-4 md:h-5 md:w-5 text-purple-400 transition-all duration-300" />
                </div>

                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab("threads")}
                    className={`flex-1 py-2 px-3 text-xs md:text-sm rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] ${
                      activeTab === "threads"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                        : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                    }`}
                  >
                    Conversations
                  </button>
                  <button
                    onClick={() => setActiveTab("allUsers")}
                    className={`flex-1 py-2 px-3 text-xs md:text-sm rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] ${
                      activeTab === "allUsers"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                        : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                    }`}
                  >
                    All Users
                  </button>
                </div>
              </div>
            </div>

            {/* Contacts List with staggered animations */}
            <div className="flex-1 overflow-y-auto">
              {displayContacts.map((user, index) => {
                const thread = getThreadInfo(user);
                return (
                  <div
                    key={user.id}
                    className={`
                      flex items-center p-3 border-b border-purple-50 cursor-pointer 
                      transition-all duration-300 ease-out transform
                      ${selectedUser?.id === user.id 
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-l-purple-500' 
                        : 'hover:bg-purple-50 hover:pl-4'
                      }
                      ${shouldShowSidebar ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}
                    `}
                    style={{
                      transitionDelay: `${index * 50}ms`
                    }}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={getUserAvatar(user)}
                        alt={getUserFullName(user)}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover border-2 border-purple-200 transition-all duration-300 hover:scale-105"
                      />
                      {thread && thread.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                          {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800 text-sm md:text-base truncate transition-all duration-300">
                          {getUserFullName(user)}
                        </h3>
                        {thread?.lastMessage && (
                          <span className="text-xs text-purple-400 whitespace-nowrap ml-2">
                            {formatTime(thread.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-purple-500 truncate transition-all duration-300">
                        {thread?.lastMessage?.body || user?.email || 'Start a conversation'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-300 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  </div>
                );
              })}
              
              {displayContacts.length === 0 && (
                <div className="text-center py-8 text-purple-400 transform transition-all duration-300">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 animate-pulse" />
                  <p className="text-sm">
                    {searchTerm ? 'No users found' : 
                     activeTab === "threads" ? 'No conversations yet' : 'No users available'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area - Enhanced with animations */}
          {shouldShowChat && (
            <div className="flex-1 flex flex-col h-full bg-white relative">
              {/* Chat Header - Same gradient style without logo */}
              {selectedUser ? (
                <div className="relative p-0 aspect-[4/1] sm:aspect-[9/1] bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(200,180,255,0.5)_100%)] flex-shrink-0">
                  <div className="z-20 flex items-center justify-between p-2 h-[100%] w-[100%]">
                    <div className="flex items-center space-x-3">
                      {isMobile && (
                        <button 
                          onClick={handleBackToContacts}
                          className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300 hover:scale-110"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                      )}
                      <img
                        src={getUserAvatar(selectedUser)}
                        alt={getUserFullName(selectedUser)}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover border-2 border-purple-200 transition-all duration-300 hover:scale-105"
                      />
                      <div className="flex flex-col">
                        <h2 className="font-bold text-gray-800 text-sm md:text-base truncate">
                          {getUserFullName(selectedUser)}
                        </h2>
                        <p className="text-xs text-purple-600 truncate">
                          {selectedUser.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-purple-600 hover:text-purple-800 transition-all duration-300 hover:scale-110">
                        <Phone className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={handleToggleSidebar}
                        className="p-2 text-purple-600 hover:text-purple-800 transition-all duration-300 hover:scale-110 md:hidden"
                      >
                        <Menu className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="relative p-0 aspect-[4/1] sm:aspect-[9/1] bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(200,180,255,0.5)_100%)]">
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
                   {isMobile && (
                      <button 
                        onClick={handleToggleSidebar}
                        className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300 hover:rotate-90"
                      >
                        <Menu className="w-5 h-5 text-gray-700" />
                      </button>
                    )}
                </div>
              </div>
              )}
              {/* Messages Container - Scrollable area */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-purple-50"
                style={{
                  paddingBottom: isMobile && isKeyboardVisible ? `${keyboardHeight}px` : '16px'
                }}
              >
                {selectedUser ? (
                  <div className="p-4 space-y-4">
                    {Object.entries(messageGroups).map(([date, dateMessages]) => (
                      <div key={date} className="transform transition-all duration-300">
                        <div className="flex justify-center my-4">
                          <span className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                            {date}
                          </span>
                        </div>
                        {dateMessages.map((message, index) => (
                          <div
                            key={message.id}
                            className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'} 
                              transform transition-all duration-300 ease-out
                              ${shouldShowChat ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                            style={{
                              transitionDelay: `${index * 50}ms`
                            }}
                          >
                            <div className={`flex max-w-[85%] md:max-w-xs lg:max-w-md ${
                              message.isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                            }`}>
                              <img
                                src={message.avatar}
                                alt={message.sender}
                                className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover border-2 border-purple-200 flex-shrink-0 transition-all duration-300 hover:scale-105"
                              />
                              <div className={`mx-2 ${message.isOwnMessage ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block rounded-2xl md:rounded-3xl p-3 md:p-4 
                                  transform transition-all duration-300 hover:scale-[1.02]
                                  ${
                                  message.isOwnMessage
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-md'
                                    : 'bg-white text-gray-800 border border-purple-100 rounded-bl-none shadow-sm'
                                }`}>
                                  <p className="text-sm md:text-base whitespace-pre-wrap break-words">{message.content}</p>
                                </div>
                                <div className={`flex items-center mt-1 space-x-2 text-xs ${
                                  message.isOwnMessage ? 'justify-end' : 'justify-start'
                                }`}>
                                  <span className={message.isOwnMessage ? 'text-purple-400' : 'text-gray-400'}>
                                    {formatTime(message.timestamp)}
                                  </span>
                                  {message.isOwnMessage && (
                                    <Check className="w-3 h-3 md:w-4 md:h-4 text-purple-400" />
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
                  <div className="flex items-center justify-center h-full transform transition-all duration-300">
                    <div className="text-center text-purple-400 animate-pulse">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg font-medium">Select a conversation</p>
                      <p className="text-sm mt-2">Choose from your contacts to start messaging</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area - Fixed at bottom with animations */}
              {selectedUser && (
                <div className="border-t border-purple-100 bg-white flex-shrink-0 transform transition-all duration-300">
                  <div className="p-4">
                    <div className="flex space-x-3">
                      <div className="flex-1 bg-purple-50 rounded-2xl border border-purple-200 focus-within:ring-2 focus-within:ring-purple-300 transition-all duration-300">
                        <textarea
                          ref={textareaRef}
                          value={newMessage}
                          onChange={handleTextareaChange}
                          onKeyPress={handleKeyPress}
                          onFocus={handleTextareaFocus}
                          onBlur={handleTextareaBlur}
                          placeholder="Type your message..."
                          className="w-full px-4 py-3 text-base bg-transparent focus:outline-none resize-none rounded-2xl min-h-[44px] max-h-[120px] transition-all duration-300"
                          rows={1}
                          style={{ height: 'auto' }}
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transform hover:scale-105 active:scale-95"
                      >
                        <Send className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-2 px-1">
                      <div className="flex space-x-2">
                        <button className="p-2 text-purple-400 hover:text-purple-600 transition-all duration-300 hover:scale-110">
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-purple-400 hover:text-purple-600 transition-all duration-300 hover:scale-110">
                          <ImageIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="text-xs text-purple-400 hidden md:block">
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
  );
};

export default PMTab;
