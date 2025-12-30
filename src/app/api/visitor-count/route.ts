// app/api/visitor-count/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Import PrismaClient properly
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Get the request body (optional)
    const body = await request.json().catch(() => ({}))
    
    const ip = request.ip || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || 'direct'
    const page = body.page || '/'
    
    // Generate a session ID
    const sessionId = generateSessionId(ip, userAgent)
    
    // Check if this session visited in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const existingVisit = await prisma.visitor.findFirst({
      where: {
        sessionId: sessionId,
        timestamp: {
          gte: oneDayAgo
        }
      }
    })
    
    let isNewSession = false
    
    if (!existingVisit) {
      // Record the visit for new sessions (once per 24 hours per session)
      await prisma.visitor.create({
        data: {
          sessionId,
          ip: ip === 'unknown' ? null : ip.substring(0, 50),
          page: page,
          referer: referer.substring(0, 200),
          userAgent: userAgent.substring(0, 200),
          country: body.country || 'Unknown',
          city: body.city || 'Unknown'
        }
      })
      isNewSession = true
    }
    
    // Get updated counts
    const totalVisits = await prisma.visitor.count()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const visitsToday = await prisma.visitor.count({
      where: {
        timestamp: {
          gte: today
        }
      }
    })
    
    // Get unique visitors in last 24 hours
    const uniqueVisitors24h = await prisma.visitor.groupBy({
      by: ['sessionId'],
      where: {
        timestamp: {
          gte: oneDayAgo
        }
      },
      _count: true
    })
    
    return NextResponse.json({
      success: true,
      isNewSession,
      counts: {
        totalVisits,
        visitsToday,
        uniqueVisitors24h: uniqueVisitors24h.length
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Error recording visit:', error)
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to record visit',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Simple count query
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
    
    // Unique visitors in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const uniqueVisitors24h = await prisma.visitor.groupBy({
      by: ['sessionId'],
      where: {
        timestamp: {
          gte: oneDayAgo
        }
      },
      _count: true
    })
    
    return NextResponse.json({
      success: true,
      counts: {
        totalVisits,
        visitsToday,
        uniqueVisitors24h: uniqueVisitors24h.length
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Error getting visitor count:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get visitor count',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

function generateSessionId(ip: string, userAgent: string): string {
  // Create a stable session ID that doesn't change with Date.now()
  const data = `${ip}-${userAgent}`
  
  // Simple hash function for consistency
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return `sess_${Math.abs(hash)}`
}
