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
        {/* Tens digit with horizontal cylindrical animation */}
        <DigitCylinder 
          currentDigit={value[0]} 
          prevDigit={prevValue[0]} 
          isAnimating={animatingDigits.tens}
          color={c.text}
          position="left"
        />

        {/* Ones digit with horizontal cylindrical animation */}
        <DigitCylinder 
          currentDigit={value[1]} 
          prevDigit={prevValue[1]} 
          isAnimating={animatingDigits.ones}
          color={c.text}
          position="right"
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
  position: 'left' | 'right';
}

const DigitCylinder: React.FC<DigitCylinderProps> = ({ currentDigit, prevDigit, isAnimating, color, position }) => {
  return (
    <div className="relative w-8 md:w-12 h-16 md:h-20 overflow-hidden perspective-cylinder">
      <style jsx>{`
        @keyframes rotateFromLeft {
          0% {
            transform: rotateY(0deg);
            opacity: 1;
            left: 0;
          }
          50% {
            transform: rotateY(90deg);
            opacity: 0.5;
            left: -50%;
          }
          100% {
            transform: rotateY(0deg);
            opacity: 1;
            left: 0;
          }
        }
        
        @keyframes rotateFromRight {
          0% {
            transform: rotateY(0deg);
            opacity: 1;
            right: 0;
          }
          50% {
            transform: rotateY(-90deg);
            opacity: 0.5;
            right: -50%;
          }
          100% {
            transform: rotateY(0deg);
            opacity: 1;
            right: 0;
          }
        }

        @keyframes slideFromLeft {
          0% {
            transform: translateX(-100%) rotateY(30deg);
            opacity: 0;
            filter: blur(2px);
          }
          100% {
            transform: translateX(0) rotateY(0deg);
            opacity: 1;
            filter: blur(0);
          }
        }

        @keyframes slideFromRight {
          0% {
            transform: translateX(100%) rotateY(-30deg);
            opacity: 0;
            filter: blur(2px);
          }
          100% {
            transform: translateX(0) rotateY(0deg);
            opacity: 1;
            filter: blur(0);
          }
        }

        .cylinder-left {
          animation: rotateFromLeft 0.4s ease-in-out forwards;
          transform-style: preserve-3d;
        }

        .cylinder-right {
          animation: rotateFromRight 0.4s ease-in-out forwards;
          transform-style: preserve-3d;
        }

        .new-digit-left {
          animation: slideFromLeft 0.3s ease-out forwards;
        }

        .new-digit-right {
          animation: slideFromRight 0.3s ease-out forwards;
        }

        .perspective-cylinder {
          perspective: 800px;
          perspective-origin: 50% 50%;
        }

        .cylinder-shape {
          background: linear-gradient(
            90deg,
            rgba(0,0,0,0.3) 0%,
            rgba(255,255,255,0.1) 30%,
            rgba(255,255,255,0.2) 50%,
            rgba(255,255,255,0.1) 70%,
            rgba(0,0,0,0.3) 100%
          );
          border-radius: 30% / 50%;
        }
      `}</style>

      {/* Cylinder background effect */}
      <div className="absolute inset-0 cylinder-shape pointer-events-none"></div>

      {/* Current digit (base layer) */}
      <div className={`absolute inset-0 flex items-center justify-center text-2xl md:text-4xl font-bold ${color}`}>
        {currentDigit}
      </div>

      {/* Animation when digit changes */}
      {isAnimating && (
        <>
          {/* Old digit rotating out */}
          <div className={`absolute inset-0 flex items-center justify-center text-2xl md:text-4xl font-bold ${color} ${position === 'left' ? 'cylinder-left' : 'cylinder-right'}`}>
            {prevDigit}
          </div>
          
          {/* New digit sliding in from side */}
          <div className={`absolute inset-0 flex items-center justify-center text-2xl md:text-4xl font-bold ${color} ${position === 'left' ? 'new-digit-left' : 'new-digit-right'}`}>
            {currentDigit}
          </div>
        </>
      )}

      {/* Reflective overlay for cylinder effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 70%)',
        mixBlendMode: 'overlay'
      }}></div>
    </div>
  );
};

export default CountdownAnalog;
