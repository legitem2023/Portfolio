import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Optional: Protect the endpoint with authentication
    const session = await getServerSession(authOptions);
    
    // Uncomment this if you want to require authentication
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { title, body, userId, url, interest } = await req.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Check if Beams credentials are configured
    const instanceId = process.env.NEXT_PUBLIC_BEAMS_INSTANCE_ID;
    const secretKey = process.env.PUSHER_BEAMS_SECRET_KEY;

    if (!instanceId || !secretKey) {
      console.error('Beams credentials missing');
      return NextResponse.json(
        { error: 'Push notification service not configured' },
        { status: 500 }
      );
    }

    // Prepare the payload for Pusher Beams
    const publishPayload: any = {
      web: {
        notification: {
          title: title,
          body: body,
          icon: 'https://yourdomain.com/icon-192.png',
          deep_link: url || 'https://yourdomain.com',
        },
      },
    };

    // Send to specific user or interest
    if (userId) {
      publishPayload.users = [userId];
    } else if (interest) {
      publishPayload.interests = [interest];
    } else {
      publishPayload.interests = ['all-users']; // Default interest
    }

    // Call Pusher Beams API
    const response = await fetch(
      `https://${instanceId}.pushnotifications.pusher.com/publish_api/v1/instances/${instanceId}/publishes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`,
        },
        body: JSON.stringify(publishPayload),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Beams API error:', responseData);
      return NextResponse.json(
        { error: 'Failed to send notification', details: responseData },
        { status: response.status }
      );
    }

    console.log('Notification sent successfully:', responseData);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification sent successfully',
      data: responseData 
    });
    
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Handle GET requests to test the endpoint
export async function GET() {
  return NextResponse.json({ 
    message: 'Push notification API endpoint', 
    method: 'POST required with title and body',
    example: {
      title: 'Hello!',
      body: 'This is a test notification',
      userId: 'optional-user-id',
      interest: 'optional-interest',
      url: 'optional-deep-link'
    }
  });
       }
