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
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.error('Pusher auth failed: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Pusher auth request for user:', session.user?.userId || session.user?.email);
    
    // Get the request body - Pusher sends it as URL-encoded form data
    const contentType = req.headers.get('content-type') || '';
    let socket_id: string;
    let channel_name: string;
    
    if (contentType.includes('application/json')) {
      // Handle JSON format (if sent as JSON)
      const body = await req.json();
      socket_id = body.socket_id;
      channel_name = body.channel_name;
    } else {
      // Handle URL-encoded form data (what Pusher sends)
      const formData = await req.formData();
      socket_id = formData.get('socket_id') as string;
      channel_name = formData.get('channel_name') as string;
    }
    
    if (!socket_id || !channel_name) {
      console.error('Missing socket_id or channel_name');
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }
    
    console.log('Authorizing channel:', { socket_id, channel_name, userId: session.user?.userId });
    
    // For private channels, include user authentication
    const authResponse = pusher.authorizeChannel(socket_id, channel_name, {
      user_id: session.user?.userId || session.user?.email,
      user_info: {
        id: session.user?.userId,
        email: session.user?.email,
      }
    });
    
    console.log('Pusher auth successful for channel:', channel_name);
    
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
