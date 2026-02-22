'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

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
    // Fix: Create target date using UTC or specify explicitly
    const targetDate = new Date(2026, 6, 27, 0, 0, 0); // Month is 0-indexed: 6 = July

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

  // Format numbers with leading zero - FIXED for 3-digit days
  const formatDays = (num: number): string => num.toString().padStart(3, '0');
  const formatTime = (num: number): string => num.toString().padStart(2, '0');

  return (
    <div className="relative w-full bg-transparent font-mono" style={{ aspectRatio: '5 / 1' }}>
      <div className="absolute inset-0 flex items-center justify-between px-2 md:px-4 gap-1 md:gap-2">
        {/* Days - NOW WITH 3 DIGITS */}
        <div className="flex-1 h-5/6 bg-cyan-950/30 backdrop-blur-sm border border-cyan-500/50 rounded-xl shadow-[0_0_15px_rgba(0,255,255,0.3)] flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs md:text-sm text-cyan-300 absolute top-1 left-2 z-20">D</span>
          <div className="flex gap-1">
            <DigitCylinder 
              currentDigit={formatDays(timeLeft.days)[0]} 
              prevDigit={formatDays(prevTimeRef.current.days)[0]} 
              isAnimating={formatDays(timeLeft.days)[0] !== formatDays(prevTimeRef.current.days)[0]}
              color="text-cyan-100"
            />
            <DigitCylinder 
              currentDigit={formatDays(timeLeft.days)[1]} 
              prevDigit={formatDays(prevTimeRef.current.days)[1]} 
              isAnimating={formatDays(timeLeft.days)[1] !== formatDays(prevTimeRef.current.days)[1]}
              color="text-cyan-100"
            />
            <DigitCylinder 
              currentDigit={formatDays(timeLeft.days)[2]} 
              prevDigit={formatDays(prevTimeRef.current.days)[2]} 
              isAnimating={formatDays(timeLeft.days)[2] !== formatDays(prevTimeRef.current.days)[2]}
              color="text-cyan-100"
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 opacity-50"></div>
        </div>

        {/* Hours */}
        <div className="flex-1 h-5/6 bg-orange-950/30 backdrop-blur-sm border border-orange-500/50 rounded-xl shadow-[0_0_15px_rgba(255,165,0,0.3)] flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs md:text-sm text-orange-300 absolute top-1 left-2 z-20">H</span>
          <div className="flex gap-1">
            <DigitCylinder 
              currentDigit={formatTime(timeLeft.hours)[0]} 
              prevDigit={formatTime(prevTimeRef.current.hours)[0]} 
              isAnimating={formatTime(timeLeft.hours)[0] !== formatTime(prevTimeRef.current.hours)[0]}
              color="text-orange-100"
            />
            <DigitCylinder 
              currentDigit={formatTime(timeLeft.hours)[1]} 
              prevDigit={formatTime(prevTimeRef.current.hours)[1]} 
              isAnimating={formatTime(timeLeft.hours)[1] !== formatTime(prevTimeRef.current.hours)[1]}
              color="text-orange-100"
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 opacity-50"></div>
        </div>

        {/* Minutes */}
        <div className="flex-1 h-5/6 bg-yellow-950/30 backdrop-blur-sm border border-yellow-500/50 rounded-xl shadow-[0_0_15px_rgba(255,255,0,0.3)] flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs md:text-sm text-yellow-300 absolute top-1 left-2 z-20">M</span>
          <div className="flex gap-1">
            <DigitCylinder 
              currentDigit={formatTime(timeLeft.minutes)[0]} 
              prevDigit={formatTime(prevTimeRef.current.minutes)[0]} 
              isAnimating={formatTime(timeLeft.minutes)[0] !== formatTime(prevTimeRef.current.minutes)[0]}
              color="text-yellow-100"
            />
            <DigitCylinder 
              currentDigit={formatTime(timeLeft.minutes)[1]} 
              prevDigit={formatTime(prevTimeRef.current.minutes)[1]} 
              isAnimating={formatTime(timeLeft.minutes)[1] !== formatTime(prevTimeRef.current.minutes)[1]}
              color="text-yellow-100"
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 opacity-50"></div>
        </div>

        {/* Seconds */}
        <div className="flex-1 h-5/6 bg-pink-950/30 backdrop-blur-sm border border-pink-500/50 rounded-xl shadow-[0_0_15px_rgba(255,0,255,0.3)] flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs md:text-sm text-pink-300 absolute top-1 left-2 z-20">S</span>
          <div className="flex gap-1">
            <DigitCylinder 
              currentDigit={formatTime(timeLeft.seconds)[0]} 
              prevDigit={formatTime(prevTimeRef.current.seconds)[0]} 
              isAnimating={formatTime(timeLeft.seconds)[0] !== formatTime(prevTimeRef.current.seconds)[0]}
              color="text-pink-100"
            />
            <DigitCylinder 
              currentDigit={formatTime(timeLeft.seconds)[1]} 
              prevDigit={formatTime(prevTimeRef.current.seconds)[1]} 
              isAnimating={formatTime(timeLeft.seconds)[1] !== formatTime(prevTimeRef.current.seconds)[1]}
              color="text-pink-100"
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-pink-600 opacity-50"></div>
        </div>
      </div>
    </div>
  );
};

interface DigitCylinderProps {
  currentDigit: string;
  prevDigit: string;
  isAnimating: boolean;
  color: string;
}

const DigitCylinder: React.FC<DigitCylinderProps> = ({ currentDigit, prevDigit, isAnimating, color }) => {
  return (
    <div className="relative w-6 md:w-10 h-14 md:h-18 overflow-visible perspective-cylinder">
      <style jsx>{`
        @keyframes rotateVerticalDown {
          0% {
            transform: rotateX(0deg);
            opacity: 1;
          }
          50% {
            transform: rotateX(90deg);
            opacity: 0.3;
          }
          100% {
            transform: rotateX(180deg);
            opacity: 0;
          }
        }
        
        @keyframes rotateVerticalUp {
          0% {
            transform: rotateX(-180deg);
            opacity: 0;
          }
          50% {
            transform: rotateX(-90deg);
            opacity: 0.3;
          }
          100% {
            transform: rotateX(0deg);
            opacity: 1;
          }
        }

        .old-digit {
          animation: rotateVerticalDown 0.4s ease-in forwards;
          transform-origin: center;
          backface-visibility: hidden;
        }

        .new-digit {
          animation: rotateVerticalUp 0.4s ease-out forwards;
          transform-origin: center;
          backface-visibility: hidden;
        }

        .perspective-cylinder {
          perspective: 1000px;
          perspective-origin: 50% 50%;
        }

        .horizontal-cylinder {
          background: linear-gradient(
            180deg,
            rgba(0,0,0,0.4) 0%,
            rgba(255,255,255,0.1) 20%,
            rgba(255,255,255,0.2) 50%,
            rgba(255,255,255,0.1) 80%,
            rgba(0,0,0,0.4) 100%
          );
          
          box-shadow: 
            inset 0 -5px 10px rgba(0,0,0,0.5),
            inset 0 5px 10px rgba(255,255,255,0.1),
            0 0 20px rgba(0,0,0,0.3);
        }

        .cylinder-end {
          background: radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, transparent 70%);
        }
      `}</style>

      {/* Horizontal cylinder background */}
      <div className="absolute inset-0 horizontal-cylinder rounded-full"></div>
      
      {/* Cylinder ends (left and right caps) */}
      <div className="absolute left-0 top-0 bottom-0 w-1 cylinder-end"></div>
      <div className="absolute right-0 top-0 bottom-0 w-1 cylinder-end"></div>

      {/* Center reflective line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/10 transform -translate-x-1/2"></div>

      {/* Current digit (visible when not animating) */}
      {!isAnimating && (
        <div className={`absolute inset-0 flex items-center justify-center text-xl md:text-3xl font-bold ${color} z-10`}>
          {currentDigit}
        </div>
      )}

      {/* Animation when digit changes */}
      {isAnimating && (
        <>
          {/* Old digit rotating down and out */}
          <div className={`absolute inset-0 flex items-center justify-center text-xl md:text-3xl font-bold ${color} old-digit z-20`}>
            {prevDigit}
          </div>
          
          {/* New digit rotating up and in */}
          <div className={`absolute inset-0 flex items-center justify-center text-xl md:text-3xl font-bold ${color} new-digit z-10`}>
            {currentDigit}
          </div>
        </>
      )}

      {/* Highlight overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.15) 0%, transparent 70%)',
        mixBlendMode: 'overlay'
      }}></div>
    </div>
  );
};

export default CountdownAnalog;
