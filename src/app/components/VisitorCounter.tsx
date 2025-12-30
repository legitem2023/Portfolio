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
        await fetch('/api/visit', {
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
        const statsResponse = await fetch('/api/visit')
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
        const response = await fetch('/api/visit')
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
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Website Analytics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total Visits</p>
          <p className="text-2xl font-bold text-blue-700">
            {stats?.totalVisits.toLocaleString() || '0'}
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Visits Today</p>
          <p className="text-2xl font-bold text-green-700">
            {stats?.visitsToday.toLocaleString() || '0'}
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">Unique Visitors (24h)</p>
          <p className="text-2xl font-bold text-purple-700">
            {stats?.uniqueVisitors24h.toLocaleString() || '0'}
          </p>
        </div>
      </div>
      
      {stats?.topPages && stats.topPages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Top Pages</h4>
          <div className="space-y-2">
            {stats.topPages.map((page, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 truncate max-w-[200px]">
                  {page.page === '/' ? 'Homepage' : page.page}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {page.visits} visits
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        Auto-updates every 30 seconds
      </p>
    </div>
  )
}
