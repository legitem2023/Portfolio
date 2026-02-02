'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { decryptToken } from '../../../utils/decryptToken';
import Header from './Header';
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
  MessageSquare
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"threads" | "allUsers">("threads");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Add these new state variables for keyboard handling
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // GraphQL Queries
  const { data: threadsData, refetch: refetchThreads } = useQuery(GET_MESSAGE_THREADS, {
    variables: { page: 1, limit: 50 },
    skip: !userId,
    pollInterval: 30000, // Refresh every 30 seconds
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
  const [markAsReadMutation] = useMutation(MARK_AS_READ);
  const [markMultipleAsReadMutation] = useMutation(MARK_MULTIPLE_AS_READ);
  const [replyMessageMutation] = useMutation(REPLY_MESSAGE);

  // Combine and filter contacts
  const allContacts = useMemo(() => {
    const threadUsers = messageThreads.map((thread: MessageThread) => thread.user);
    const otherUsers = usersData?.users?.filter((user: User) => 
      user.id !== userId && // Exclude current user
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

  // Enhanced keyboard detection for mobile
  useEffect(() => {
    if (!isMobile || !window.visualViewport) return;
    
    const visualViewport = window.visualViewport;
    
    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const viewportHeight = visualViewport.height;
      const newKeyboardHeight = windowHeight - viewportHeight;
      
      // More reliable keyboard detection
      if (newKeyboardHeight > 100 && isInputFocused) {
        setIsKeyboardVisible(true);
        setKeyboardHeight(newKeyboardHeight);
        
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    };

    // Handle focus events
    const handleFocusIn = (e: FocusEvent) => {
      if (textareaRef.current && textareaRef.current.contains(e.target as Node)) {
        setIsInputFocused(true);
        // Give time for keyboard to fully appear
        setTimeout(() => {
          handleResize();
        }, 200);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (!textareaRef.current?.contains(e.target as Node)) {
        setIsInputFocused(false);
        // Small delay to ensure keyboard is fully dismissed
        setTimeout(() => {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
        }, 100);
      }
    };

    // Add event listeners
    visualViewport.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    // Initial check
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
        // Add padding to prevent content from being hidden behind keyboard
        messagesContainerRef.current.style.bottom = `${keyboardHeight}px`;
      } else {
        messagesContainerRef.current.style.bottom = '0px';
      }
    }
  }, [isKeyboardVisible, keyboardHeight, isMobile]);

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

  // Convert GraphQL messages to UI messages - SORT BY LATEST FIRST
  useEffect(() => {
    if (conversationData?.conversation?.messages && userId) {
      // Sort messages by createdAt in ascending order (oldest first)
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
        refetchThreads();
        refetchConversation();
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
    setSelectedUser(null);
    setSelectedThread(null);
    if (isMobile) {
      setIsSidebarOpen(true);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle textarea focus
  const handleTextareaFocus = () => {
    setIsInputFocused(true);
  };

  // Handle textarea blur
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

  // Get thread info for a user
  const getThreadInfo = (user: User) => {
    return messageThreads.find(thread => thread.user.id === user.id);
  };

  // Group messages by date - messages are already sorted by time
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
    <div>
    <Header/>
    <div className="relative top-0 h-[100vh] bg-gradient-to-br from-purple-50 to-indigo-100 safe-area-inset-bottom">
      <div className="max-w-6xl mx-auto bg-white rounded-none md:rounded-2xl md:rounded-3xl shadow-none md:shadow-xl md:shadow-2xl overflow-hidden h-full">
        <div className="flex h-full relative">
          {/* Sidebar/Contacts List */}
          <div className={`
            ${isMobile ? 'fixed inset-0 z-30' : 'relative z-20 w-1/3 lg:w-1/4 flex-shrink-0'}
            bg-gradient-to-b from-purple-50 to-lavender-100 border-r border-purple-200
            transform transition-transform duration-300 ease-in-out h-full
            ${shouldShowSidebar ? 'translate-x-0' : '-translate-x-full'}
            flex flex-col
          `}>
            {/* Fixed Sidebar Header */}
            <div className="flex-shrink-0">
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
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Search and Tabs */}
              <div className="p-3 md:p-4 bg-white border-b border-purple-200">
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 md:py-3 text-sm md:text-base rounded-xl md:rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent bg-white"
                  />
                  <Search className="absolute left-2.5 top-2.5 md:left-3 md:top-3 h-4 w-4 md:h-5 md:w-5 text-purple-400" />
                </div>

                {/* Tabs */}
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab("threads")}
                    className={`flex-1 py-2 px-3 text-xs md:text-sm rounded-lg font-medium transition-colors ${
                      activeTab === "threads"
                        ? "bg-purple-600 text-white"
                        : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                    }`}
                  >
                    Conversations
                  </button>
                  <button
                    onClick={() => setActiveTab("allUsers")}
                    className={`flex-1 py-2 px-3 text-xs md:text-sm rounded-lg font-medium transition-colors ${
                      activeTab === "allUsers"
                        ? "bg-purple-600 text-white"
                        : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                    }`}
                  >
                    All Users
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Contacts List */}
            <div className="flex-1 overflow-y-auto messages-scrollbar">
              {displayContacts.map((user) => {
                const thread = getThreadInfo(user);
                return (
                  <div
                    key={user.id}
                    className={`flex items-center p-3 border-b border-purple-50 cursor-pointer transition-all duration-200 ${
                      selectedUser?.id === user.id ? 'bg-purple-50 border-l-4 border-l-purple-500' : 'hover:bg-purple-25'
                    }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={getUserAvatar(user)}
                        alt={getUserFullName(user)}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover border-2 border-purple-200"
                      />
                      {thread && thread.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-purple-900 text-sm md:text-base truncate">
                          {getUserFullName(user)}
                        </h3>
                        {thread?.lastMessage && (
                          <span className="text-xs text-purple-400 whitespace-nowrap ml-2">
                            {formatTime(thread.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-purple-600 truncate">
                        {thread?.lastMessage?.body || user?.email || 'Start a conversation'}
                      </p>
                      {!thread && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {displayContacts.length === 0 && (
                <div className="text-center py-8 text-purple-400">
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
            </div>
          </div>

          {/* Chat Area - Only show when not in sidebar mode on mobile */}
          {shouldShowChat && (
            <div className={`
              ${isMobile ? 'absolute inset-0 z-20' : 'relative z-10 flex-1'}
              flex flex-col h-full bg-white
              transform transition-transform duration-300 ease-in-out
            `}>
              {/* Fixed Chat Header */}
              {selectedUser ? (
                <div className="bg-gradient-to-r from-purple-50 to-lavender-50 border-b border-purple-200 p-4 safe-area-inset-top flex-shrink-0">
                  <div className="flex items-center">
                    {isMobile && (
                      <button 
                        onClick={handleBackToContacts}
                        className="mr-3 p-2 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-600"
                      >
                        <ChevronLeft className="w-5 h-5" />
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
                      <p className="text-xs md:text-sm text-purple-500 truncate">
                        {selectedUser.email}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-purple-400 hover:text-purple-600 transition-colors">
                        <Phone className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={handleToggleSidebar}
                        className="p-2 text-purple-400 hover:text-purple-600 transition-colors md:hidden"
                      >
                        <Menu className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-purple-50 to-lavender-50 border-b border-purple-200 p-4 safe-area-inset-top flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {isMobile && (
                        <button 
                          onClick={handleToggleSidebar}
                          className="mr-3 p-2 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-600"
                        >
                          <Menu className="w-5 h-5" />
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

              {/* Messages Container - This is the scrollable part */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-purple-25 messages-scrollbar safe-area-inset-bottom transition-all duration-300"
              >
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
                                    <Check className="w-3 h-3 md:w-4 md:h-4 text-purple-300" />
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
                      <MessageSquare className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg font-medium">Select a conversation</p>
                      <p className="text-sm mt-2">Choose from your contacts to start messaging</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              {selectedUser && (
                <div 
                  className="border-t border-purple-200 bg-white transition-all duration-300 flex-shrink-0"
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
                      <div className="flex-1 bg-purple-50 rounded-2xl border border-purple-200 focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-purple-300">
                        <textarea
                          ref={textareaRef}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          onFocus={handleTextareaFocus}
                          onBlur={handleTextareaBlur}
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
                        <Send className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-2 px-1">
                      <div className="flex space-x-2">
                        <button className="p-2 text-purple-400 hover:text-purple-600 transition-colors">
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-purple-400 hover:text-purple-600 transition-colors">
                          <Image className="w-5 h-5" />
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

      {/* Custom Styles */}
      <style jsx global>{`
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
    </div>
  );
};

export default PMTab;
