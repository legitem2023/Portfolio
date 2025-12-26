import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  // Optional: Add a security check for the CRON_SECRET if you set one
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Return a simple success response
  return Response.json({ 
    status: 'Warm', 
    timestamp: new Date().toISOString() 
  });
}
