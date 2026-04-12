import { useEffect, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import Pusher from 'pusher-js';

export const useRealtimeMessages = (userId: string | null, selectedUserId: string | null) => {
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const client = useApolloClient();

  useEffect(() => {
    if (!userId) return;

    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });

    setPusher(pusherClient);

    // Subscribe to user's private channel
    const channel = pusherClient.subscribe(`private-user-${userId}`);
    
    // Listen for new messages
    channel.bind('new-message', (data: any) => {
      // Update Apollo cache with new message
      client.cache.modify({
        fields: {
          conversation(existingMessages = [], { readField }) {
            // Add new message to cache if it belongs to current conversation
            if (data.message.sender.id === selectedUserId || 
                data.message.recipient.id === selectedUserId) {
              return [data.message, ...existingMessages];
            }
            return existingMessages;
          },
          messageThreads(existingThreads = { threads: [] }) {
            // Update threads list with new message
            const updatedThreads = [...existingThreads.threads];
            const threadIndex = updatedThreads.findIndex(
              t => t.user.id === data.message.sender.id || 
                   t.user.id === data.message.recipient.id
            );
            
            if (threadIndex !== -1) {
              updatedThreads[threadIndex].lastMessage = data.message;
              updatedThreads[threadIndex].updatedAt = data.message.createdAt;
              if (data.message.recipient.id === userId) {
                updatedThreads[threadIndex].unreadCount++;
              }
            } else {
              // Add new thread
              const newUser = data.message.sender.id === userId 
                ? data.message.recipient 
                : data.message.sender;
              updatedThreads.unshift({
                user: newUser,
                lastMessage: data.message,
                unreadCount: data.message.recipient.id === userId ? 1 : 0,
                updatedAt: data.message.createdAt
              });
            }
            
            return {
              ...existingThreads,
              threads: updatedThreads
            };
          },
          unreadMessageCount(existingCount = 0) {
            if (data.message.recipient.id === userId && !data.message.isRead) {
              return existingCount + 1;
            }
            return existingCount;
          }
        }
      });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusherClient.disconnect();
    };
  }, [userId, selectedUserId, client]);

  return pusher;
};
