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
  const { toUserId, callId } = await request.json();

  await pusher.trigger(`private-user-${toUserId}`, 'call-ended', { callId });

  return NextResponse.json({ success: true });
}
