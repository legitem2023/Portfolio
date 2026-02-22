'use client';

import React, { useState, useEffect } from 'react';

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
        // If the target date has passed, set all to zero
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Initial update
    updateCountdown();

    // Set up interval to update every second
    const intervalId = setInterval(updateCountdown, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Helper to format numbers with leading zero
  const format = (num: number): string => num.toString().padStart(2, '0');

  return (
    <div className="relative w-full bg-transparent font-mono" style={{ aspectRatio: '5 / 1' }}>
      {/* Main container with mechanical, transparent aesthetic */}
      <div className="absolute inset-0 flex items-center justify-between px-2 md:px-4 gap-1 md:gap-2">
        {/* Days */}
        <div className="flex-1 h-5/6 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg shadow-[inset_0_0_10px_rgba(0,255,255,0.3),0_0_15px_rgba(0,255,255,0.2)] flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs md:text-sm text-cyan-300/80 absolute top-0.5 left-1">D</span>
          <span className="text-2xl md:text-4xl lg:text-5xl font-bold text-cyan-100 drop-shadow-[0_0_8px_cyan]">{format(timeLeft.days)}</span>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
        </div>

        {/* Hours */}
        <div className="flex-1 h-5/6 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg shadow-[inset_0_0_10px_rgba(255,165,0,0.3),0_0_15px_rgba(255,165,0,0.2)] flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs md:text-sm text-orange-300/80 absolute top-0.5 left-1">H</span>
          <span className="text-2xl md:text-4xl lg:text-5xl font-bold text-orange-100 drop-shadow-[0_0_8px_orange]">{format(timeLeft.hours)}</span>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
        </div>

        {/* Minutes */}
        <div className="flex-1 h-5/6 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg shadow-[inset_0_0_10px_rgba(255,255,0,0.3),0_0_15px_rgba(255,255,0,0.2)] flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs md:text-sm text-yellow-300/80 absolute top-0.5 left-1">M</span>
          <span className="text-2xl md:text-4xl lg:text-5xl font-bold text-yellow-100 drop-shadow-[0_0_8px_yellow]">{format(timeLeft.minutes)}</span>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
        </div>

        {/* Seconds */}
        <div className="flex-1 h-5/6 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg shadow-[inset_0_0_10px_rgba(255,0,255,0.3),0_0_15px_rgba(255,0,255,0.2)] flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs md:text-sm text-pink-300/80 absolute top-0.5 left-1">S</span>
          <span className="text-2xl md:text-4xl lg:text-5xl font-bold text-pink-100 drop-shadow-[0_0_8px_fuchsia]">{format(timeLeft.seconds)}</span>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-pink-400 to-transparent"></div>
        </div>
      </div>

      {/* Optional: a faint grid overlay to enhance mechanical/technical look */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
    </div>
  );
};

export default CountdownAnalog;
