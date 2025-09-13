// components/VisitorCounter.js
import { useState, useEffect } from 'react';

const VisitorCounter = () => {
  const [totalVisitors, setTotalVisitors] = useState(1248);
  const [activeUsers, setActiveUsers] = useState(37);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(25, Math.min(50, prev + change));
      });
      
      if (Math.random() > 0.7) {
        setTotalVisitors(prev => prev + 1);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="visitor-counter">
      <div className="counter-item">
        <div className="counter-content">
          <div className="counter-value">{totalVisitors.toLocaleString()}</div>
          <div className="counter-label">Total Visitors</div>
        </div>
      </div>
      
      <div className="divider"></div>
      
      <div className="counter-item">
        <div className="counter-content">
          <div className="counter-value">{activeUsers}</div>
          <div className="counter-label">Active Now</div>
        </div>
      </div>

      <style jsx>{`
        .visitor-counter {
          width: 100%;
          max-width: 320px;
          background: white;
          border-radius: 6px;
          height: 80px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          padding: 0 28px;
          justify-content: center;
          border: 1px solid #eaeaea;
        }
        
        .counter-item {
          text-align: center;
          padding: 0 24px;
        }
        
        .counter-value {
          font-size: 22px;
          font-weight: 600;
          color: #666;
          margin-bottom: 4px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
        }
        
        .counter-label {
          font-size: 12px;
          font-weight: 500;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .divider {
          width: 1px;
          height: 40px;
          background: #eaeaea;
        }
      `}</style>
    </div>
  );
};

export default VisitorCounter;
