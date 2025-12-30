'use client'

import { useEffect, useState } from 'react'

interface VisitorStats {
  totalVisits: number
  visitsToday: number
  uniqueVisitors24h: number
  topPages: Array<{ page: string; visits: number }>
}

export default function VisitorCounter() {
  const [stats, setStats] = useState<VisitorStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Generate session ID for this visitor
    const sessionId = localStorage.getItem('visitor_session') || 
                     `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    if (!localStorage.getItem('visitor_session')) {
      localStorage.setItem('visitor_session', sessionId)
    }

    // Record this visit
    const recordVisit = async () => {
      try {
        // Get location from IP (optional - can remove if you don't want location)
        const locationResponse = await fetch('https://ipapi.co/json/').catch(() => null)
        const locationData = locationResponse ? await locationResponse.json() : {}
        
        // Record the visit
        await fetch('/api/visitor-count', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: window.location.pathname,
            country: locationData.country_name || 'Unknown',
            city: locationData.city || 'Unknown'
          })
        })

        // Get updated stats
        const statsResponse = await fetch('/api/visitor-count')
        const statsData = await statsResponse.json()
        
        if (statsData.success) {
          setStats(statsData.stats)
        }
      } catch (error) {
        console.error('Error tracking visit:', error)
      } finally {
        setLoading(false)
      }
    }

    recordVisit()

    // Update stats every 30 seconds (optional)
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/visitor-count')
        const data = await response.json()
        if (data.success) {
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Error updating stats:', error)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-2">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2">
      <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-2 text-center">📊 Analytics</h3>
      
      <div className="flex flex-row justify-between items-center gap-1 sm:gap-2 mb-2">
        <div className="bg-blue-50 p-2 rounded-lg flex-1 min-w-0">
          <p className="text-[10px] xs:text-xs sm:text-sm text-blue-600 font-medium truncate">Total</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-blue-700 truncate">
            {stats?.totalVisits.toLocaleString() || '0'}
          </p>
        </div>
        
        <div className="bg-green-50 p-2 rounded-lg flex-1 min-w-0">
          <p className="text-[10px] xs:text-xs sm:text-sm text-green-600 font-medium truncate">Today</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-green-700 truncate">
            {stats?.visitsToday.toLocaleString() || '0'}
          </p>
        </div>
        
        <div className="bg-purple-50 p-2 rounded-lg flex-1 min-w-0">
          <p className="text-[10px] xs:text-xs sm:text-sm text-purple-600 font-medium truncate">24h Unique</p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-purple-700 truncate">
            {stats?.uniqueVisitors24h.toLocaleString() || '0'}
          </p>
        </div>
      </div>
      
      {stats?.topPages && stats.topPages.length > 0 && (
        <div className="mt-2">
          <h4 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-700 mb-1 truncate">Top Pages</h4>
          <div className="space-y-1 max-h-16 sm:max-h-20 overflow-y-auto">
            {stats.topPages.slice(0, 3).map((page, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-[10px] xs:text-xs text-gray-600 truncate max-w-[100px] sm:max-w-[140px] md:max-w-[160px]">
                  {page.page === '/' ? 'Home' : page.page.split('/').pop() || page.page}
                </span>
                <span className="text-[10px] xs:text-xs font-medium text-gray-900">
                  {page.visits}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-[10px] xs:text-xs text-gray-500 mt-2 text-center truncate">
        Updates every 30s
      </p>
    </div>
  )
}
