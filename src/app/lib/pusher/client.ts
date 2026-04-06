// lib/pusher/client.ts
import Pusher from 'pusher';

let pusherClient: Pusher | null = null;

export const getPusherClient = () => {
  if (!pusherClient && typeof window !== 'undefined') {
    pusherClient = new Pusher({
      appId: "2137516",
      key: "89df54e492d888d001ed",
      secret: "a684061715e3e3710b74",      
      cluster: "ap1",
    });
  }
  return pusherClient;
};
