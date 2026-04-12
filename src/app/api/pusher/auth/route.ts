import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    // Get the session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { socket_id, channel_name } = body;
    
    // Extract user ID from channel name
    const userId = channel_name.replace('private-user-', '');
    
    // Authorize private channel access
    const authResponse = pusher.authorizeChannel(socket_id, channel_name, {
      user_id: userId,
      user_info: {
        name: session.user.email || userId,
      }
    });
    
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
