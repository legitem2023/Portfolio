import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import { getToken } from 'next-auth/jwt';
import { cookies } from 'next/headers';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    // Get the NextAuth token
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!token || !token.serverToken) {
      console.error('No valid session token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { socket_id, channel_name } = body;
    
    // Extract userId from channel name (private-user-{userId})
    const userId = channel_name.replace('private-user-', '');
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
    }
    
    console.log(`Authorizing channel ${channel_name} for user ${userId}`);
    
    // Authorize the private channel
    const authResponse = pusher.authorizeChannel(socket_id, channel_name, {
      user_id: userId,
      user_info: {
        name: token.email || userId,
        provider: token.provider || 'unknown'
      }
    });
    
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
