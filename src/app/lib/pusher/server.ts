// lib/pusher/server.ts
import Pusher from 'pusher';

export const pusherServer = new Pusher({
  appId: "2137516",
  key: "89df54e492d888d001ed",
  secret: "a684061715e3e3710b74",
  cluster: "ap1",
  useTLS: true
});
