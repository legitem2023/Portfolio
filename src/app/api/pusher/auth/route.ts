import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";

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
      console.error('❌ [Pusher Auth] Unauthorized - No session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ [Pusher Auth] Session found for user:', session.user?.email);
    
    // Get socket_id and channel_name from Pusher (sent as form data)
    const formData = await req.formData();
    const socket_id = formData.get('socket_id') as string;
    const channel_name = formData.get('channel_name') as string;

    if (!socket_id || !channel_name) {
      console.error('❌ [Pusher Auth] Missing socket_id or channel_name');
      return NextResponse.json(
        { error: "Missing socket_id or channel_name" },
        { status: 400 }
      );
    }

    console.log('📡 [Pusher Auth] Authorizing:', { socket_id, channel_name });

    // Authorize the channel - Pusher expects this exact response format
    const authResponse = pusher.authorizeChannel(socket_id, channel_name);

    console.log('✅ [Pusher Auth] Authorized successfully');
    
    return NextResponse.json(authResponse);
    
  } catch (error) {
    console.error('❌ [Pusher Auth] Error:', error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
