// src/app/lib/pusher/client.ts
import PusherClient from 'pusher-js';

let pusherClient: PusherClient | null = null;

export const getPusherClient = () => {
  if (!pusherClient && typeof window !== 'undefined') {
    // ✅ Use two arguments: key string first, then options object
    pusherClient = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      }
    );
  }
  return pusherClient;
}
