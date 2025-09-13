// components/VisitorCounter.js
import { useState, useEffect } from 'react';

const VisitorCounter = () => {
  const [totalVisitors, setTotalVisitors] = useState(1248);
  const [activeUsers, setActiveUsers] = useState(37);

  // Simulate changing visitor counts
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate small changes in active users
      setActiveUsers(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(25, Math.min(50, prev + change));
      });
      
      // Occasionally increase total visitors
      if (Math.random() > 0.7) {
        setTotalVisitors(prev => prev + 1);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="visitor-counter">
      {/* Sparkle effects */}
      <div className="sparkle" style={{ top: '15px', left: '30px' }}>✦</div>
      <div className="sparkle" style={{ top: '45px', right: '40px', animationDelay: '1s' }}>✦</div>
      <div className="sparkle" style={{ top: '25px', right: '100px', animationDelay: '2s' }}>✦</div>
      <div className="sparkle" style={{ bottom: '15px', left: '100px', animationDelay: '3s' }}>✦</div>
      
      {/* Total Visitors */}
      <div className="counter-item">
        <div className="icon">👁️</div>
        <div className="counter-content">
          <div className="counter-value">{totalVisitors.toLocaleString()}</div>
          <div className="counter-label">Total Visitors</div>
        </div>
      </div>
      
      <div className="divider"></div>
      
      {/* Active Users */}
      <div className="counter-item">
        <div className="pulse-dot"></div>
        <div className="counter-content">
          <div className="counter-value">{activeUsers}</div>
          <div className="counter-label">Active Now</div>
        </div>
      </div>

      <style jsx>{`
        .visitor-counter {
          width: 100%;
          max-width: calc(100% - 2rem);
          margin: 0 1rem;
          background: rgba(200, 200, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          height: 70px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15),
                      inset 0 0 0 1px rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          padding: 0 24px;
          position: relative;
          overflow: hidden;
        }
        
        .visitor-counter::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
                      transparent, 
                      rgba(255, 255, 255, 0.6), 
                      transparent);
        }
        
        .counter-item {
          display: flex;
          align-items: center;
          margin-right: 32px;
        }
        
        .icon {
          margin-right: 12px;
          font-size: 24px;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 0 10px rgba(125, 125, 255, 0.7);
        }
        
        .counter-content {
          display: flex;
          flex-direction: column;
        }
        
        .counter-value {
          font-size: 20px;
          font-weight: 700;
          color: white;
          line-height: 1;
          margin-bottom: 4px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        .counter-label {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .divider {
          width: 1px;
          height: 40px;
          background: linear-gradient(transparent, rgba(255, 255, 255, 0.5), transparent);
          margin: 0 16px;
        }
        
        .pulse-dot {
          width: 10px;
          height: 10px;
          background: #4ade80;
          border-radius: 50%;
          margin-right: 8px;
          position: relative;
          box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
          animation: pulse 2s infinite;
        }
        
        .sparkle {
          position: absolute;
          font-size: 8px;
          color: white;
          opacity: 0;
          animation: sparkle 4s linear infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(74, 222, 128, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
          }
        }
        
        @keyframes sparkle {
          0% {
            opacity: 0;
            transform: translateY(0) rotate(0deg);
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-30px) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default VisitorCounter;
