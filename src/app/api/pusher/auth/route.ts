import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import { decryptToken } from '../../../../../utils/decryptToken';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    // Get user from session/cookie
    const response = await fetch('/api/protected', { credentials: 'include' });
    const data = await response.json();
    const token = data?.user;
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "QeTh7m3zP0sVrYkLmXw93BtN6uFhLpAz";
    const payload = await decryptToken(token, secret.toString());
    
    const body = await req.json();
    const { socket_id, channel_name } = body;
    
    // Authorize private channel access
    const authResponse = pusher.authorizeChannel(socket_id, channel_name, {
      user_id: payload.userId,
      user_info: {
        name: payload.name
      }
    });
    
    return NextResponse.json(authResponse);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
