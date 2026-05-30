// app/api/push/beams-auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import PusherPushNotifications from 'pusher-push-notifications-server';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const beamsClient = new PusherPushNotifications({
    instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
    secretKey: process.env.PUSHER_BEAMS_SECRET_KEY!,
  });
  
  const beamsToken = await beamsClient.generateToken(userId);
  
  return NextResponse.json(beamsToken);
}
