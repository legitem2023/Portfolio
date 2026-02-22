'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface DigitProps {
  value: number;
  prevValue: number;
  position: 'tens' | 'ones';
  color: string;
}

const CylinderDigit: React.FC<DigitProps> = ({ value, prevValue, position, color }) => {
  const [isSliding, setIsSliding] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  
  // Get the specific digit based on position
  const currentDigit = position === 'tens' ? Math.floor(value / 10) : value % 10;
  const prevDigit = position === 'tens' ? Math.floor(prevValue / 10) : prevValue % 10;
  
  useEffect(() => {
    if (prevDigit !== currentDigit) {
      // Determine slide direction (like a cylindrical slot machine)
      if (currentDigit > prevDigit || (prevDigit === 9 && currentDigit === 0)) {
        setSlideDirection('right'); // Slides in from right
      } else {
        setSlideDirection('left'); // Slides in from left
      }
      
      setIsSliding(true);
      const timer = setTimeout(() => {
        setIsSliding(false);
      }, 250);
      
      return () => clearTimeout(timer);
    }
  }, [currentDigit, prevDigit]);

  // Color classes mapping
  const colorClasses = {
    cyan: 'text-cyan-100 drop-shadow-[0_0_8px_cyan]',
    orange: 'text-orange-100 drop-shadow-[0_0_8px_orange]',
    yellow: 'text-yellow-100 drop-shadow-[0_0_8px_yellow]',
    pink: 'text-pink-100 drop-shadow-[0_0_8px_fuchsia]'
  };

  return (
    <div className="relative w-8 md:w-12 lg:w-16 h-12 md:h-16 lg:h-20 overflow-hidden perspective-cylinder">
      {/* Main digit container with cylindrical effect */}
      <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
        {/* Current digit (always visible) */}
        <div className={`absolute inset-0 flex items-center justify-center text-2xl md:text-4xl lg:text-5xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
          {currentDigit}
        </div>
        
        {/* Sliding animation overlay */}
        {isSliding && (
          <>
            {/* Sliding digit */}
            <div className={`absolute inset-0 flex items-center justify-center cylinder-slide ${slideDirection}`}>
              <div className={`text-2xl md:text-4xl lg:text-5xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
                {prevDigit}
              </div>
            </div>
            
            {/* Cylindrical curve overlay for realism */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.2) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.2) 100%)',
              borderRadius: '30% / 50%'
            }}></div>
          </>
        )}
      </div>
    </div>
  );
};

const CountdownAnalog: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const prevTimeRef = useRef<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date('2026-07-27T00:00:00');

    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Update ref after render
  useEffect(() => {
    prevTimeRef.current = timeLeft;
  }, [timeLeft]);

  return (
    <div className="relative w-full bg-transparent font-mono" style={{ aspectRatio: '5 / 1' }}>
      <style jsx>{`
        @keyframes slideFromRight {
          0% {
            transform: translateX(100%) scaleX(0.8);
            opacity: 0.8;
            filter: blur(1px);
          }
          40% {
            transform: translateX(0) scaleX(1.02);
            opacity: 1;
            filter: blur(0);
          }
          60% {
            transform: translateX(0) scaleX(1.02);
          }
          100% {
            transform: translateX(0) scaleX(1);
          }
        }
        
        @keyframes slideFromLeft {
          0% {
            transform: translateX(-100%) scaleX(0.8);
            opacity: 0.8;
            filter: blur(1px);
          }
          40% {
            transform: translateX(0) scaleX(1.02);
            opacity: 1;
            filter: blur(0);
          }
          60% {
            transform: translateX(0) scaleX(1.02);
          }
          100% {
            transform: translateX(0) scaleX(1);
          }
        }
        
        .cylinder-slide {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          animation-duration: 0.25s;
          animation-timing-function: cubic-bezier(0.2, 0.9, 0.3, 1.1);
          animation-fill-mode: forwards;
        }
        
        .cylinder-slide.left {
          animation-name: slideFromLeft;
        }
        
        .cylinder-slide.right {
          animation-name: slideFromRight;
        }
        
        .perspective-cylinder {
          perspective: 400px;
          transform-style: preserve-3d;
        }
        
        /* Cylindrical shadow effect */
        .cylinder-shadow {
          background: radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.2) 100%);
        }
      `}</style>

      <div className="absolute inset-0 flex items-center justify-between px-2 md:px-4 gap-1 md:gap-2">
        {/* Days */}
        <div className="flex-1 h-5/6 bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-lg shadow-[inset_0_0_10px_rgba(0,255,255,0.3),0_0_15px_rgba(0,255,255,0.2)] flex flex-col items-center justify-center relative overflow-visible">
          <span className="text-xs md:text-sm text-cyan-300/80 absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 px-2 rounded-t-lg">DAYS</span>
          <div className="flex gap-1 relative" style={{ transformStyle: 'preserve-3d' }}>
            {/* Cylindrical container */}
            <div className="relative flex gap-1" style={{ transform: 'rotateY(2deg)' }}>
              <CylinderDigit 
                value={timeLeft.days} 
                prevValue={prevTimeRef.current.days} 
                position="tens" 
                color="cyan" 
              />
              <CylinderDigit 
                value={timeLeft.days} 
                prevValue={prevTimeRef.current.days} 
                position="ones" 
                color="cyan" 
              />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
        </div>

        {/* Hours */}
        <div className="flex-1 h-5/6 bg-black/40 backdrop-blur-sm border border-orange-500/30 rounded-lg shadow-[inset_0_0_10px_rgba(255,165,0,0.3),0_0_15px_rgba(255,165,0,0.2)] flex flex-col items-center justify-center relative overflow-visible">
          <span className="text-xs md:text-sm text-orange-300/80 absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 px-2 rounded-t-lg">HOURS</span>
          <div className="flex gap-1" style={{ transform: 'rotateY(-1deg)' }}>
            <CylinderDigit 
              value={timeLeft.hours} 
              prevValue={prevTimeRef.current.hours} 
              position="tens" 
              color="orange" 
            />
            <CylinderDigit 
              value={timeLeft.hours} 
              prevValue={prevTimeRef.current.hours} 
              position="ones" 
              color="orange" 
            />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
        </div>

        {/* Minutes */}
        <div className="flex-1 h-5/6 bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-lg shadow-[inset_0_0_10px_rgba(255,255,0,0.3),0_0_15px_rgba(255,255,0,0.2)] flex flex-col items-center justify-center relative overflow-visible">
          <span className="text-xs md:text-sm text-yellow-300/80 absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 px-2 rounded-t-lg">MINS</span>
          <div className="flex gap-1" style={{ transform: 'rotateY(1deg)' }}>
            <CylinderDigit 
              value={timeLeft.minutes} 
              prevValue={prevTimeRef.current.minutes} 
              position="tens" 
              color="yellow" 
            />
            <CylinderDigit 
              value={timeLeft.minutes} 
              prevValue={prevTimeRef.current.minutes} 
              position="ones" 
              color="yellow" 
            />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
        </div>

        {/* Seconds */}
        <div className="flex-1 h-5/6 bg-black/40 backdrop-blur-sm border border-pink-500/30 rounded-lg shadow-[inset_0_0_10px_rgba(255,0,255,0.3),0_0_15px_rgba(255,0,255,0.2)] flex flex-col items-center justify-center relative overflow-visible">
          <span className="text-xs md:text-sm text-pink-300/80 absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 px-2 rounded-t-lg">SECS</span>
          <div className="flex gap-1" style={{ transform: 'rotateY(-2deg)' }}>
            <CylinderDigit 
              value={timeLeft.seconds} 
              prevValue={prevTimeRef.current.seconds} 
              position="tens" 
              color="pink" 
            />
            <CylinderDigit 
              value={timeLeft.seconds} 
              prevValue={prevTimeRef.current.seconds} 
              position="ones" 
              color="pink" 
            />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-pink-400 to-transparent"></div>
        </div>
      </div>

      {/* Curved overlay for cylindrical effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.2) 100%)',
        mixBlendMode: 'multiply'
      }}></div>
      
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10" style={{ 
        backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px)', 
        backgroundSize: '10px 10px',
        transform: 'rotateY(1deg)'
      }}></div>
    </div>
  );
};

export default CountdownAnalog;
