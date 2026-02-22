'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface FlipUnitProps {
  value: number;
  unit: string;
  color: 'cyan' | 'orange' | 'yellow' | 'pink';
}

const FlipUnit: React.FC<FlipUnitProps> = ({ value, unit, color }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevValueRef = useRef(value);
  
  // Color configurations
  const colorConfig = {
    cyan: {
      text: 'text-cyan-100',
      label: 'text-cyan-300/80',
      glow: 'drop-shadow-[0_0_8px_cyan]',
      shadow: 'shadow-[inset_0_0_10px_rgba(0,255,255,0.3),0_0_15px_rgba(0,255,255,0.2)]',
      gradient: 'via-cyan-400',
      border: 'border-cyan-500/30'
    },
    orange: {
      text: 'text-orange-100',
      label: 'text-orange-300/80',
      glow: 'drop-shadow-[0_0_8px_orange]',
      shadow: 'shadow-[inset_0_0_10px_rgba(255,165,0,0.3),0_0_15px_rgba(255,165,0,0.2)]',
      gradient: 'via-orange-400',
      border: 'border-orange-500/30'
    },
    yellow: {
      text: 'text-yellow-100',
      label: 'text-yellow-300/80',
      glow: 'drop-shadow-[0_0_8px_yellow]',
      shadow: 'shadow-[inset_0_0_10px_rgba(255,255,0,0.3),0_0_15px_rgba(255,255,0,0.2)]',
      gradient: 'via-yellow-400',
      border: 'border-yellow-500/30'
    },
    pink: {
      text: 'text-pink-100',
      label: 'text-pink-300/80',
      glow: 'drop-shadow-[0_0_8px_fuchsia]',
      shadow: 'shadow-[inset_0_0_10px_rgba(255,0,255,0.3),0_0_15px_rgba(255,0,255,0.2)]',
      gradient: 'via-pink-400',
      border: 'border-pink-500/30'
    }
  };

  const colors = colorConfig[color];

  // Format number with leading zero
  const format = (num: number): string => num.toString().padStart(2, '0');
  const formattedValue = format(value);
  const formattedDisplayValue = format(displayValue);

  // Handle flip animation when value changes
  useEffect(() => {
    if (prevValueRef.current !== value) {
      setIsFlipping(true);
      
      // Update display value after flip starts
      const timeout1 = setTimeout(() => {
        setDisplayValue(value);
      }, 150);
      
      // End flip animation
      const timeout2 = setTimeout(() => {
        setIsFlipping(false);
      }, 300);
      
      prevValueRef.current = value;
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
      };
    }
  }, [value]);

  return (
    <div className={`flex-1 h-5/6 bg-black/30 backdrop-blur-sm border ${colors.border} rounded-lg ${colors.shadow} flex flex-col items-center justify-center relative overflow-hidden`}>
      <span className={`text-xs md:text-sm ${colors.label} absolute top-0.5 left-1 z-10`}>{unit}</span>
      
      {/* Flip container */}
      <div className="relative w-full h-full flex items-center justify-center perspective">
        {/* Top half - current value */}
        <div className="absolute inset-0 flex items-start justify-center pt-3 overflow-hidden">
          <div className={`text-2xl md:text-4xl lg:text-5xl font-bold ${colors.text} ${colors.glow}`}>
            {formattedDisplayValue}
          </div>
        </div>
        
        {/* Bottom half - current value */}
        <div className="absolute inset-0 flex items-end justify-center pb-3 overflow-hidden">
          <div className={`text-2xl md:text-4xl lg:text-5xl font-bold ${colors.text} ${colors.glow}`}>
            {formattedDisplayValue}
          </div>
        </div>
        
        {/* Flipping overlay */}
        {isFlipping && (
          <>
            {/* Top half flipping down */}
            <div className="absolute inset-0 origin-bottom animate-flip-down z-20">
              <div className="h-1/2 bg-black/90 backdrop-blur-sm rounded-t-lg overflow-hidden border-b-2 border-white/20">
                <div className="flex items-start justify-center pt-3 h-full">
                  <div className={`text-2xl md:text-4xl lg:text-5xl font-bold ${colors.text} ${colors.glow}`}>
                    {format(prevValueRef.current)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom half flipping up */}
            <div className="absolute inset-0 origin-top animate-flip-up z-20">
              <div className="h-1/2 mt-auto bg-black/90 backdrop-blur-sm rounded-b-lg overflow-hidden border-t-2 border-white/20">
                <div className="flex items-end justify-center pb-3 h-full">
                  <div className={`text-2xl md:text-4xl lg:text-5xl font-bold ${colors.text} ${colors.glow}`}>
                    {formattedValue}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent ${colors.gradient} to-transparent`}></div>
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

  return (
    <div className="relative w-full bg-transparent font-mono" style={{ aspectRatio: '5 / 1' }}>
      {/* Add animation keyframes to global styles or component */}
      <style jsx>{`
        @keyframes flipDown {
          0% { transform: rotateX(0deg); }
          100% { transform: rotateX(-90deg); }
        }
        @keyframes flipUp {
          0% { transform: rotateX(90deg); }
          100% { transform: rotateX(0deg); }
        }
        .animate-flip-down {
          animation: flipDown 0.3s ease-in forwards;
          transform-origin: bottom;
          backface-visibility: hidden;
        }
        .animate-flip-up {
          animation: flipUp 0.3s ease-out forwards;
          transform-origin: top;
          backface-visibility: hidden;
        }
        .perspective {
          perspective: 400px;
        }
      `}</style>

      <div className="absolute inset-0 flex items-center justify-between px-2 md:px-4 gap-1 md:gap-2">
        <FlipUnit value={timeLeft.days} unit="D" color="cyan" />
        <FlipUnit value={timeLeft.hours} unit="H" color="orange" />
        <FlipUnit value={timeLeft.minutes} unit="M" color="yellow" />
        <FlipUnit value={timeLeft.seconds} unit="S" color="pink" />
      </div>

      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
    </div>
  );
};

export default CountdownAnalog;
