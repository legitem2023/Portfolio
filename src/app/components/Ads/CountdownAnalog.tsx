'use client';

import React, { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Reusable FlipCard component for each digit
const FlipCard: React.FC<{ value: string; label: string; color: string }> = ({ value, label, color }) => {
  // Determine gradient colors based on the passed color
  const gradientFrom = `from-${color}-400/30`;
  const gradientVia = `via-${color}-400/80`;
  const gradientTo = `to-${color}-400/30`;
  const borderGlow = `border-${color}-400/50`;
  const textGlow = `text-${color}-200`;
  const shadowColor = color === 'cyan' ? 'rgba(34,211,238,0.5)' :
                      color === 'orange' ? 'rgba(251,146,60,0.5)' :
                      color === 'yellow' ? 'rgba(250,204,21,0.5)' :
                      'rgba(232,121,249,0.5)'; // fuchsia/pink

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Label at top */}
      <span className={`absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-mono text-${color}-300/70 tracking-widest`}>
        {label}
      </span>

      {/* Flip card container with mechanical look */}
      <div className={`relative w-full h-full bg-black/40 backdrop-blur-sm rounded-lg border ${borderGlow} shadow-[inset_0_0_15px_${shadowColor},0_0_20px_${shadowColor}] overflow-hidden`}>
        {/* Top half (static) - shows the top part of the digit */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent border-b border-white/10 flex items-end justify-center pb-1">
          <span className={`text-3xl md:text-5xl font-bold ${textGlow} drop-shadow-[0_0_8px_${color}]`}>
            {value}
          </span>
        </div>

        {/* Bottom half (static) - shows the bottom part of the digit, slightly dimmed to simulate flip */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent flex items-start justify-center pt-1">
          <span className={`text-3xl md:text-5xl font-bold ${textGlow} drop-shadow-[0_0_8px_${color}] opacity-70`}>
            {value}
          </span>
        </div>

        {/* The "flipping" line in the middle - mechanical detail */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent transform -translate-y-1/2 z-10"></div>
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

  // Helper to format numbers with leading zero (as two-digit strings)
  const format = (num: number): string => num.toString().padStart(2, '0');

  // Split each time unit into two separate digits for the flip book
  const daysStr = format(timeLeft.days);
  const hoursStr = format(timeLeft.hours);
  const minutesStr = format(timeLeft.minutes);
  const secondsStr = format(timeLeft.seconds);

  return (
    <div className="relative w-full bg-transparent font-mono" style={{ aspectRatio: '5 / 1' }}>
      {/* Main container: horizontal split for each digit */}
      <div className="absolute inset-0 flex items-center justify-between px-2 gap-2 md:gap-4">
        {/* Days section - two flip cards */}
        <div className="flex-1 h-4/5 flex gap-1">
          <FlipCard value={daysStr[0]} label="D" color="cyan" />
          <FlipCard value={daysStr[1]} label=" " color="cyan" />
        </div>

        {/* Hours section - two flip cards */}
        <div className="flex-1 h-4/5 flex gap-1">
          <FlipCard value={hoursStr[0]} label="H" color="orange" />
          <FlipCard value={hoursStr[1]} label=" " color="orange" />
        </div>

        {/* Minutes section - two flip cards */}
        <div className="flex-1 h-4/5 flex gap-1">
          <FlipCard value={minutesStr[0]} label="M" color="yellow" />
          <FlipCard value={minutesStr[1]} label=" " color="yellow" />
        </div>

        {/* Seconds section - two flip cards */}
        <div className="flex-1 h-4/5 flex gap-1">
          <FlipCard value={secondsStr[0]} label="S" color="fuchsia" />
          <FlipCard value={secondsStr[1]} label=" " color="fuchsia" />
        </div>
      </div>

      {/* Mechanical grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
    </div>
  );
};

export default CountdownAnalog;
