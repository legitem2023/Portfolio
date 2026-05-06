import { NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(request: Request) {
  const { fromUserId, toUserId, callId, roomId } = await request.json();

  // Notify the recipient about incoming call
  await pusher.trigger(`private-user-${toUserId}`, 'incoming-call', {
    fromUserId,
    callId,
    roomId,
    timestamp: Date.now(),
  });

  return NextResponse.json({ success: true });
}
