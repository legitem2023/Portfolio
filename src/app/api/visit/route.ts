// app/api/visit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || 'direct'
    
    // Generate a unique session ID
    const sessionId = generateSessionId(ip, userAgent)
    
    // Check if we already have a session in this browser
    const existingSession = await prisma.visitor.findFirst({
      where: {
        sessionId: sessionId,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })
    
    if (!existingSession) {
      // Record the visit
      await prisma.visitor.create({
        data: {
          sessionId,
          ip: ip === 'unknown' ? null : ip.substring(0, 50),
          page: '/', // Default page
          referer: referer.substring(0, 500),
          userAgent: userAgent.substring(0, 500),
          country: 'Unknown',
          city: 'Unknown'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Visit recorded'
    })
    
  } catch (error) {
    console.error('Error recording visit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record visit' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const totalVisits = await prisma.visitor.count()
    
    // Today's visits
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const visitsToday = await prisma.visitor.count({
      where: {
        timestamp: {
          gte: today
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      totalVisits,
      visitsToday
    })
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}

function generateSessionId(ip: string, userAgent: string): string {
  // Simple hash function
  let hash = 0
  const str = `${ip}-${userAgent}`
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return `sess_${Math.abs(hash)}_${Date.now().toString(36)}`
}
