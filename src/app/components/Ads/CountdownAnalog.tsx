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

  // Format numbers with leading zero
  const format = (num: number): string => num.toString().padStart(2, '0');

  return (
    <div className="relative w-full bg-transparent font-mono" style={{ aspectRatio: '5 / 1' }}>
      <div className="absolute inset-0 flex items-center justify-between px-2 md:px-4 gap-1 md:gap-2">
        {/* Days */}
        <DigitBlock 
          value={format(timeLeft.days)} 
          prevValue={format(prevTimeRef.current.days)}
          label="D" 
          color="cyan" 
        />

        {/* Hours */}
        <DigitBlock 
          value={format(timeLeft.hours)} 
          prevValue={format(prevTimeRef.current.hours)}
          label="H" 
          color="orange" 
        />

        {/* Minutes */}
        <DigitBlock 
          value={format(timeLeft.minutes)} 
          prevValue={format(prevTimeRef.current.minutes)}
          label="M" 
          color="yellow" 
        />

        {/* Seconds */}
        <DigitBlock 
          value={format(timeLeft.seconds)} 
          prevValue={format(prevTimeRef.current.seconds)}
          label="S" 
          color="pink" 
        />
      </div>
    </div>
  );
};

interface DigitBlockProps {
  value: string;
  prevValue: string;
  label: string;
  color: 'cyan' | 'orange' | 'yellow' | 'pink';
}

const DigitBlock: React.FC<DigitBlockProps> = ({ value, prevValue, label, color }) => {
  const [animatingDigits, setAnimatingDigits] = useState<{tens: boolean, ones: boolean}>({tens: false, ones: false});
  
  // Color configurations
  const colors = {
    cyan: {
      bg: 'bg-cyan-950/30',
      border: 'border-cyan-500/50',
      text: 'text-cyan-100',
      label: 'text-cyan-300',
      shadow: 'shadow-[0_0_15px_rgba(0,255,255,0.3)]',
      gradient: 'from-cyan-400 to-cyan-600'
    },
    orange: {
      bg: 'bg-orange-950/30',
      border: 'border-orange-500/50',
      text: 'text-orange-100',
      label: 'text-orange-300',
      shadow: 'shadow-[0_0_15px_rgba(255,165,0,0.3)]',
      gradient: 'from-orange-400 to-orange-600'
    },
    yellow: {
      bg: 'bg-yellow-950/30',
      border: 'border-yellow-500/50',
      text: 'text-yellow-100',
      label: 'text-yellow-300',
      shadow: 'shadow-[0_0_15px_rgba(255,255,0,0.3)]',
      gradient: 'from-yellow-400 to-yellow-600'
    },
    pink: {
      bg: 'bg-pink-950/30',
      border: 'border-pink-500/50',
      text: 'text-pink-100',
      label: 'text-pink-300',
      shadow: 'shadow-[0_0_15px_rgba(255,0,255,0.3)]',
      gradient: 'from-pink-400 to-pink-600'
    }
  };

  const c = colors[color];

  // Check if digits changed and trigger animation
  useEffect(() => {
    if (value[0] !== prevValue[0]) {
      setAnimatingDigits(prev => ({...prev, tens: true}));
      setTimeout(() => setAnimatingDigits(prev => ({...prev, tens: false})), 400);
    }
    if (value[1] !== prevValue[1]) {
      setAnimatingDigits(prev => ({...prev, ones: true}));
      setTimeout(() => setAnimatingDigits(prev => ({...prev, ones: false})), 400);
    }
  }, [value, prevValue]);

  return (
    <div className={`flex-1 h-5/6 ${c.bg} backdrop-blur-sm border ${c.border} rounded-xl ${c.shadow} flex flex-col items-center justify-center relative overflow-hidden`}>
      <span className={`text-xs md:text-sm ${c.label} absolute top-1 left-2 z-20`}>{label}</span>
      
      <div className="flex gap-1">
        {/* Tens digit */}
        <DigitCylinder 
          currentDigit={value[0]} 
          prevDigit={prevValue[0]} 
          isAnimating={animatingDigits.tens}
          color={c.text}
        />

        {/* Ones digit */}
        <DigitCylinder 
          currentDigit={value[1]} 
          prevDigit={prevValue[1]} 
          isAnimating={animatingDigits.ones}
          color={c.text}
        />
      </div>

      {/* Bottom glow */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${c.gradient} opacity-50`}></div>
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
    <div className="relative w-8 md:w-12 h-16 md:h-20 overflow-visible perspective-cylinder">
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
          border-radius: 50% / 30%;
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
        <div className={`absolute inset-0 flex items-center justify-center text-2xl md:text-4xl font-bold ${color} z-10`}>
          {currentDigit}
        </div>
      )}

      {/* Animation when digit changes */}
      {isAnimating && (
        <>
          {/* Old digit rotating down and out */}
          <div className={`absolute inset-0 flex items-center justify-center text-2xl md:text-4xl font-bold ${color} old-digit z-20`}>
            {prevDigit}
          </div>
          
          {/* New digit rotating up and in */}
          <div className={`absolute inset-0 flex items-center justify-center text-2xl md:text-4xl font-bold ${color} new-digit z-10`}>
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
