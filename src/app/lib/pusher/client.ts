// src/app/lib/pusher/client.ts
import PusherClient from 'pusher';

let pusherClient: PusherClient | null = null;

export const getPusherClient = () => {
  if (!pusherClient && typeof window !== 'undefined') {
    pusherClient = new PusherClient({
      appKey: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return pusherClient;
}
