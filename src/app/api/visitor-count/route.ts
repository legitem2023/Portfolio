import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, PrivacySetting } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ip = request.ip || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || 'direct'
    
    // Generate a unique session ID (simplified)
    const sessionId = generateSessionId(ip, userAgent)
    
    // Record the visit
    const visit = await prisma.visitor.create({
      data: {
        sessionId,
        ip: ip === 'unknown' ? null : ip.substring(0, 50),
        page: body.page || '/',
        referer: referer.substring(0, 500),
        userAgent: userAgent.substring(0, 500),
        country: body.country || 'Unknown',
        city: body.city || 'Unknown'
      }
    })
    
    // Get counts
    const totalVisits = await prisma.visitor.count()
    const uniqueVisitors = await prisma.visitor.groupBy({
      by: ['sessionId'],
      _count: true
    })
    
    // Get today's visits
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
      visitId: visit.id,
      counts: {
        totalVisits,
        uniqueVisitors: uniqueVisitors.length,
        visitsToday
      }
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
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const visitsToday = await prisma.visitor.count({
      where: {
        timestamp: {
          gte: today
        }
      }
    })
    
    // Get unique visitors (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const recentVisitors = await prisma.visitor.groupBy({
      by: ['sessionId'],
      where: {
        timestamp: {
          gte: yesterday
        }
      },
      _count: true
    })
    
    // Get top pages
    const topPages = await prisma.visitor.groupBy({
      by: ['page'],
      _count: {
        page: true
      },
      orderBy: {
        _count: {
          page: 'desc'
        }
      },
      take: 5
    })
    
    return NextResponse.json({
      success: true,
      stats: {
        totalVisits,
        visitsToday,
        uniqueVisitors24h: recentVisitors.length,
        topPages: topPages.map(item => ({
          page: item.page,
          visits: item._count.page
        }))
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}

function generateSessionId(ip: string, userAgent: string): string {
  // Create a simple session ID based on IP and user agent
  const hash = Buffer.from(`${ip}-${userAgent}-${Date.now()}`)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 32)
  
  return `session_${hash}`
}
