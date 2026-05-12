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
    // Get the session using your auth options
    const session = await getServerSession(authOptions);
    
    console.log('🔐 [Pusher Auth] Session check:', {
      hasSession: !!session,
      userId: session?.user?.id || session?.user?.email,
      hasServerToken: !!session?.serverToken,
      provider: session?.provider
    });
    
    if (!session || !session.user) {
      console.error('❌ [Pusher Auth] Unauthorized - No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the request body - Pusher sends it as URL-encoded form data
    const contentType = req.headers.get('content-type') || '';
    let socket_id: string;
    let channel_name: string;
    
    console.log('📡 [Pusher Auth] Request content-type:', contentType);
    
    if (contentType.includes('application/json')) {
      // Handle JSON format (if sent as JSON)
      const body = await req.json();
      socket_id = body.socket_id;
      channel_name = body.channel_name;
      console.log('📦 [Pusher Auth] Parsed as JSON');
    } else {
      // Handle URL-encoded form data (what Pusher sends)
      const formData = await req.formData();
      socket_id = formData.get('socket_id') as string;
      channel_name = formData.get('channel_name') as string;
      console.log('📦 [Pusher Auth] Parsed as form data');
    }
    
    if (!socket_id || !channel_name) {
      console.error('❌ [Pusher Auth] Missing required fields:', { socket_id, channel_name });
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }
    
    // Validate that the channel belongs to the authenticated user
    // Channel format: private-user-{userId}
    const expectedUserId = channel_name.replace('private-user-', '');
    const sessionUserId = session.user?.id || session.user?.email;
    
    console.log('🔍 [Pusher Auth] Channel validation:', {
      channel: channel_name,
      expectedUserId,
      sessionUserId,
      matches: expectedUserId === sessionUserId
    });
    
    // Security check: Ensure user can only subscribe to their own private channel
    if (expectedUserId !== sessionUserId) {
      console.error('❌ [Pusher Auth] User attempted to subscribe to unauthorized channel', {
        channelUserId: expectedUserId,
        sessionUserId
      });
      return NextResponse.json(
        { error: 'Unauthorized channel access' },
        { status: 403 }
      );
    }
    
    // Get user ID from session
    const userId = session.user?.id || session.user?.email || 'unknown';
    
    console.log('✅ [Pusher Auth] Authorizing channel for user:', userId);
    
    // Authorize the channel with user data
    const authResponse = pusher.authorizeChannel(socket_id, channel_name, {
      user_id: userId,
      user_info: {
        id: session.user?.id,
        email: session.user?.email,
        name: session.user?.name,
        provider: session.provider,
      }
    });
    
    console.log('✅ [Pusher Auth] Authorization successful', {
      channel: channel_name,
      userId
    });
    
    return NextResponse.json(authResponse);
    
  } catch (error) {
    console.error('❌ [Pusher Auth] Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
