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

const SlidingDigit: React.FC<DigitProps> = ({ value, prevValue, position, color }) => {
  const [isSliding, setIsSliding] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down'>('down');
  
  // Get the specific digit based on position
  const currentDigit = position === 'tens' ? Math.floor(value / 10) : value % 10;
  const prevDigit = position === 'tens' ? Math.floor(prevValue / 10) : prevValue % 10;
  
  useEffect(() => {
    if (prevDigit !== currentDigit) {
      // Determine slide direction
      if (currentDigit > prevDigit || (prevDigit === 9 && currentDigit === 0)) {
        setSlideDirection('down'); // Slide from top
      } else {
        setSlideDirection('up'); // Slide from bottom
      }
      
      setIsSliding(true);
      const timer = setTimeout(() => {
        setIsSliding(false);
      }, 200);
      
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
    <div className="relative w-8 md:w-12 lg:w-16 h-12 md:h-16 lg:h-20 overflow-hidden">
      {/* Static digit (always visible) */}
      <div className={`absolute inset-0 flex items-center justify-center text-2xl md:text-4xl lg:text-5xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
        {currentDigit}
      </div>
      
      {/* Sliding animation */}
      {isSliding && (
        <div className={`absolute inset-0 flex items-center justify-center sliding-digit ${slideDirection}`}>
          <div className={`text-2xl md:text-4xl lg:text-5xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
            {prevDigit}
          </div>
        </div>
      )}
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

  // Format numbers with leading zero
  const format = (num: number): string => num.toString().padStart(2, '0');

  return (
    <div className="relative w-full bg-transparent font-mono" style={{ aspectRatio: '5 / 1' }}>
      <style jsx>{`
        @keyframes slideFromTop {
          0% {
            transform: translateY(-100%);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideFromBottom {
          0% {
            transform: translateY(100%);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .sliding-digit {
          animation: slideFromTop 0.2s ease-out forwards;
          z-index: 10;
        }
        
        .sliding-digit.up {
          animation: slideFromBottom 0.2s ease-out forwards;
        }
      `}</style>

      <div className="absolute inset-0 flex items-center justify-between px-2 md:px-4 gap-1 md:gap-2">
        {/* Days */}
        <div className="flex-1 h-5/6 bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-lg shadow-[inset_0_0_10px_rgba(0,255,255,0.3),0_0_15px_rgba(0,255,255,0.2)] flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs md:text-sm text-cyan-300/80 absolute top-0.5 left-1 z-20">D</span>
          <div className="flex gap-1">
            <SlidingDigit 
              value={timeLeft.days} 
              prevValue={prevTimeRef.current.days} 
              position="tens" 
              color="cyan" 
            />
            <SlidingDigit 
              value={timeLeft.days} 
              prevValue={prevTimeRef.current.days} 
              position="ones" 
              color="cyan" 
            />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
        </div>

        {/* Hours */}
        <div className="flex-1 h-5/6 bg-black/40 backdrop-blur-sm border border-orange-500/30 rounded-lg shadow-[inset_0_0_10px_rgba(255,165,0,0.3),0_0_15px_rgba(255,165,0,0.2)] flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs md:text-sm text-orange-300/80 absolute top-0.5 left-1 z-20">H</span>
          <div className="flex gap-1">
            <SlidingDigit 
              value={timeLeft.hours} 
              prevValue={prevTimeRef.current.hours} 
              position="tens" 
              color="orange" 
            />
            <SlidingDigit 
              value={timeLeft.hours} 
              prevValue={prevTimeRef.current.hours} 
              position="ones" 
              color="orange" 
            />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
        </div>

        {/* Minutes */}
        <div className="flex-1 h-5/6 bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-lg shadow-[inset_0_0_10px_rgba(255,255,0,0.3),0_0_15px_rgba(255,255,0,0.2)] flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs md:text-sm text-yellow-300/80 absolute top-0.5 left-1 z-20">M</span>
          <div className="flex gap-1">
            <SlidingDigit 
              value={timeLeft.minutes} 
              prevValue={prevTimeRef.current.minutes} 
              position="tens" 
              color="yellow" 
            />
            <SlidingDigit 
              value={timeLeft.minutes} 
              prevValue={prevTimeRef.current.minutes} 
              position="ones" 
              color="yellow" 
            />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
        </div>

        {/* Seconds */}
        <div className="flex-1 h-5/6 bg-black/40 backdrop-blur-sm border border-pink-500/30 rounded-lg shadow-[inset_0_0_10px_rgba(255,0,255,0.3),0_0_15px_rgba(255,0,255,0.2)] flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs md:text-sm text-pink-300/80 absolute top-0.5 left-1 z-20">S</span>
          <div className="flex gap-1">
            <SlidingDigit 
              value={timeLeft.seconds} 
              prevValue={prevTimeRef.current.seconds} 
              position="tens" 
              color="pink" 
            />
            <SlidingDigit 
              value={timeLeft.seconds} 
              prevValue={prevTimeRef.current.seconds} 
              position="ones" 
              color="pink" 
            />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-pink-400 to-transparent"></div>
        </div>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ 
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', 
        backgroundSize: '20px 20px' 
      }}></div>
    </div>
  );
};

export default CountdownAnalog;
