import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import { decryptToken } from '../../../../../utils/decryptToken';
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
    // Get the token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('token')?.value;
    
    if (!token) {
      console.error('No auth token found in cookies');
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }
    
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";
    const payload = await decryptToken(token, secret.toString());
    
    if (!payload || !payload.userId) {
      console.error('Invalid token payload');
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }
    
    const body = await req.json();
    const { socket_id, channel_name } = body;
    
    console.log(`Authorizing channel: ${channel_name} for user: ${payload.userId}`);
    
    // Only authorize private channels
    if (!channel_name.startsWith('private-')) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
    }
    
    // Authorize private channel access
    const authResponse = pusher.authorizeChannel(socket_id, channel_name, {
      user_id: payload.userId,
      user_info: {
        name: payload.name || payload.userId,
        role: payload.role || 'rider'
      }
    });
    
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
