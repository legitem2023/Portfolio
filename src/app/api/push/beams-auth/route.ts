// app/api/push/beams-auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "../../../../lib/auth";
import PushNotifications from '@pusher/push-notifications-server';
import { decryptToken } from '../../../../../utils/decryptToken';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Get the serverToken from session
    const serverToken = session?.serverToken;
    
    if (!serverToken) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }
    
    // Decrypt the token to get real userId
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";
    const decrypted = await decryptToken(serverToken, secret);
    const userId = decrypted.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 401 });
    }
    
    const beamsClient = new PushNotifications({
      instanceId: process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID!,
      secretKey: process.env.PUSHER_BEAMS_SECRET_KEY!,
    });
    
    // ✅ CORRECT METHOD: generateToken (not authenticateUser)
    const beamsToken = beamsClient.generateToken(userId, {
      interests: [`user-${userId}`, 'all-users']
    });
    
    return NextResponse.json(beamsToken);
  } catch (error) {
    console.error('Beams auth error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
