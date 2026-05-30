// app/api/push/beams-auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "../../../../lib/auth";
import PushNotifications from '@pusher/push-notifications-server';  // ✅ Fixed import

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const beamsClient = new PushNotifications({
      instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
      secretKey: process.env.PUSHER_BEAMS_SECRET_KEY!,
    });
    
    const beamsToken = await beamsClient.authenticateUser(userId, {
      interests: [`user-${userId}`, 'all-users']
    });
    
    return NextResponse.json(beamsToken);
  } catch (error) {
    console.error('Beams auth error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
