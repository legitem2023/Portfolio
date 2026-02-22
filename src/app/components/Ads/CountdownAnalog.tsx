'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CylinderDigitProps {
  value: number;
  prevValue: number;
  position: 'tens' | 'ones';
  color: string;
}

const CylinderDigit: React.FC<CylinderDigitProps> = ({ value, prevValue, position, color }) => {
  const [isRotating, setIsRotating] = useState(false);
  const [rotationDirection, setRotationDirection] = useState<'up' | 'down'>('down');
  
  // Get the specific digit based on position
  const currentDigit = position === 'tens' ? Math.floor(value / 10) : value % 10;
  const prevDigit = position === 'tens' ? Math.floor(prevValue / 10) : prevValue % 10;
  
  useEffect(() => {
    if (prevDigit !== currentDigit) {
      // Determine rotation direction (like a mechanical cylinder)
      if (currentDigit > prevDigit || (prevDigit === 9 && currentDigit === 0)) {
        setRotationDirection('down'); // Rotates down
      } else {
        setRotationDirection('up'); // Rotates up
      }
      
      setIsRotating(true);
      const timer = setTimeout(() => {
        setIsRotating(false);
      }, 400);
      
      return () => clearTimeout(timer);
    }
  }, [currentDigit, prevDigit]);

  // Color classes mapping with metallic effects
  const colorClasses = {
    cyan: 'text-cyan-100 drop-shadow-[0_0_8px_cyan]',
    orange: 'text-orange-100 drop-shadow-[0_0_8px_orange]',
    yellow: 'text-yellow-100 drop-shadow-[0_0_8px_yellow]',
    pink: 'text-pink-100 drop-shadow-[0_0_8px_fuchsia]'
  };

  // Metallic gradient overlays for each color
  const metalGradients = {
    cyan: 'from-cyan-500/20 via-cyan-300/10 to-cyan-500/20',
    orange: 'from-orange-500/20 via-orange-300/10 to-orange-500/20',
    yellow: 'from-yellow-500/20 via-yellow-300/10 to-yellow-500/20',
    pink: 'from-pink-500/20 via-pink-300/10 to-pink-500/20'
  };

  return (
    <div className="relative w-8 md:w-12 lg:w-16 h-16 md:h-20 lg:h-24 perspective-cylinder">
      {/* Cylinder container */}
      <div 
        className="relative w-full h-full rounded-full overflow-hidden"
        style={{
          background: `linear-gradient(180deg, 
            rgba(0,0,0,0.8) 0%, 
            rgba(40,40,40,0.9) 20%, 
            rgba(20,20,20,0.9) 50%, 
            rgba(40,40,40,0.9) 80%, 
            rgba(0,0,0,0.8) 100%)`,
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 5px 15px rgba(0,0,0,0.5)',
          borderLeft: '2px solid rgba(255,255,255,0.1)',
          borderRight: '2px solid rgba(0,0,0,0.5)'
        }}
      >
        {/* Reflective surface */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 80%, transparent 100%)'
        }}></div>
        
        {/* Digit container with 3D rotation */}
        <div 
          className={`absolute inset-0 flex items-center justify-center digit-cylinder ${isRotating ? `rotate-${rotationDirection}` : ''}`}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden'
          }}
        >
          {/* Current digit face */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
            <span className={`text-2xl md:text-4xl lg:text-5xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
              {currentDigit}
            </span>
          </div>
          
          {/* Previous digit face (for rotation) */}
          {isRotating && (
            <div 
              className="absolute inset-0 flex items-center justify-center rotating-face"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: rotationDirection === 'down' ? 'rotateX(-90deg)' : 'rotateX(90deg)'
              }}
            >
              <span className={`text-2xl md:text-4xl lg:text-5xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
                {prevDigit}
              </span>
            </div>
          )}
        </div>

        {/* Cylinder end caps (top and bottom shadows) */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        {/* Reflective highlights */}
        <div className={`absolute inset-0 bg-gradient-to-b ${metalGradients[color as keyof typeof metalGradients]} opacity-30`}></div>
        
        {/* Edge lighting */}
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/20"></div>
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-black/40"></div>
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
    <div className="relative w-full bg-transparent font-mono p-4" style={{ aspectRatio: '5 / 1' }}>
      <style jsx>{`
        @keyframes rotateDown {
          0% {
            transform: rotateX(0deg);
          }
          100% {
            transform: rotateX(90deg);
          }
        }
        
        @keyframes rotateUp {
          0% {
            transform: rotateX(0deg);
          }
          100% {
            transform: rotateX(-90deg);
          }
        }
        
        .digit-cylinder {
          transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
          transform-style: preserve-3d;
        }
        
        .digit-cylinder.rotate-down {
          animation: rotateDown 0.4s ease-in-out forwards;
        }
        
        .digit-cylinder.rotate-up {
          animation: rotateUp 0.4s ease-in-out forwards;
        }
        
        .rotating-face {
          transform-origin: center;
          transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
        }
        
        .perspective-cylinder {
          perspective: 800px;
          perspective-origin: 50% 50%;
        }
        
        /* Cylinder curvature effect */
        .cylinder-curvature {
          background: radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.3) 100%);
        }
      `}</style>

      <div className="absolute inset-0 flex items-center justify-center px-2 md:px-4 gap-2 md:gap-4">
        {/* Days */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-xs md:text-sm text-cyan-300/80 mb-1">DAYS</span>
          <div className="flex gap-1 justify-center">
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

        {/* Hours */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-xs md:text-sm text-orange-300/80 mb-1">HOURS</span>
          <div className="flex gap-1 justify-center">
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
        </div>

        {/* Minutes */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-xs md:text-sm text-yellow-300/80 mb-1">MINS</span>
          <div className="flex gap-1 justify-center">
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
        </div>

        {/* Seconds */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-xs md:text-sm text-pink-300/80 mb-1">SECS</span>
          <div className="flex gap-1 justify-center">
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
        </div>
      </div>

      {/* Background lighting effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 70%)'
      }}></div>
      
      {/* Reflective floor effect */}
      <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none" style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)',
        filter: 'blur(4px)'
      }}></div>
    </div>
  );
};

export default CountdownAnalog;
