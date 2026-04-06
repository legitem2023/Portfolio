// lib/pusher/client.ts
import Pusher from 'pusher';

let pusherClient: Pusher | null = null;

export const getPusherClient = () => {
  if (!pusherClient && typeof window !== 'undefined') {
    pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return pusherClient;
};
