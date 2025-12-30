// app/api/visitor-count/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store (use a database in production)
let visitorCount = 0;
const uniqueVisitors = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               'unknown';
    
    // Generate a simple visitor ID (ip + user-agent hash)
    const userAgent = request.headers.get('user-agent') || '';
    const visitorId = Buffer.from(`${ip}-${userAgent}`).toString('base64').slice(0, 32);
    
    // Check if this is a unique visitor (in last 24 hours)
    const isUnique = !uniqueVisitors.has(visitorId);
    
    if (isUnique) {
      visitorCount++;
      uniqueVisitors.add(visitorId);
      
      // Clean old entries (simplified - in production use Redis with TTL)
      if (uniqueVisitors.size > 10000) {
        // Simple cleanup - remove first 1000 entries
        const entries = Array.from(uniqueVisitors);
        uniqueVisitors.clear();
        entries.slice(1000).forEach(entry => uniqueVisitors.add(entry));
      }
    }
    
    // Get page info if sent
    const body = await request.json().catch(() => ({}));
    const { page = 'unknown' } = body;
    
    console.log(`📊 Visitor #${visitorCount} on ${page} - ${isUnique ? 'New' : 'Returning'}`);
    
    return NextResponse.json({
      success: true,
      totalVisits: visitorCount,
      isUnique,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error recording visit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record visit' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    totalVisits: visitorCount,
    uniqueVisitors: uniqueVisitors.size,
    timestamp: new Date().toISOString()
  });
    }
