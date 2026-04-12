import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import { getToken } from 'next-auth/jwt';

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
    
    console.log('Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.error('No token found');
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }
    
    const body = await req.json();
    const { socket_id, channel_name } = body;
    
    console.log('Channel:', channel_name);
    console.log('Socket ID:', socket_id);
    
    // Extract userId from channel name
    const userId = channel_name.replace('private-user-', '');
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
    }
    
    // Authorize the private channel
    const authResponse = pusher.authorizeChannel(socket_id, channel_name);
    
    console.log('Auth response sent successfully');
    return NextResponse.json(authResponse);
    
  } catch (error) {
    console.error('Pusher auth error details:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) }, 
      { status: 500 }
    );
  }
}
