'use client'

import { useEffect, useState } from 'react'

export default function VisitorBadge() {
  const [totalVisits, setTotalVisits] = useState<number | null>(null)

  useEffect(() => {
    // Record visit
    const sessionId = localStorage.getItem('visitor_session') || 
                     `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    if (!localStorage.getItem('visitor_session')) {
      localStorage.setItem('visitor_session', sessionId)
      
      // Record the visit
      fetch('/api/visitor-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: window.location.pathname })
      })
    }

    // Get total visits
    fetch('/api/visitor-count')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTotalVisits(data.stats.totalVisits)
        }
      })
      .catch(() => setTotalVisits(0))
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-sm">
        {totalVisits !== null 
          ? `${totalVisits.toLocaleString()} views` 
          : 'Loading...'}
      </span>
    </div>
  )
}
