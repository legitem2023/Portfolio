// components/VisitorCounter.tsx
'use client';

import { useEffect, useState } from 'react';

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Record the visit
    const recordVisit = async () => {
      try {
        const response = await fetch('/api/visitor-count', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Send minimal data
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            page: window.location.pathname
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setCount(data.totalVisits);
        }
      } catch (error) {
        console.error('Error recording visit:', error);
      } finally {
        setLoading(false);
      }
    };

    recordVisit();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Counting...
        </span>
      ) : (
        <span>👁️ {count?.toLocaleString()} visitors</span>
      )}
    </div>
  );
}
