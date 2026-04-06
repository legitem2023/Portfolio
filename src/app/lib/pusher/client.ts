// src/app/lib/pusher/client.ts

import Pusher from 'pusher';

let pusherClient: Pusher | null = null;

export const getPusherClient = () => {
  if (!pusherClient && typeof window !== 'undefined') {
    pusherClient = new Pusher({
      key: "89df54e492d888d001ed",
      cluster: "ap1"
    });
  }
  return pusherClient;
}
