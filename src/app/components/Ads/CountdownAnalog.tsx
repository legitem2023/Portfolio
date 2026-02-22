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

  const [prevSeconds, setPrevSeconds] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

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

        // Trigger flip animation when seconds change
        if (seconds !== prevSeconds) {
          setIsFlipping(true);
          setTimeout(() => setIsFlipping(false), 200);
        }

        setTimeLeft({ days, hours, minutes, seconds });
        setPrevSeconds(seconds);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [prevSeconds]);

  // Format numbers with leading zero
  const format = (num: number): string => num.toString().padStart(2, '0');

  return (
    <div className="relative w-full bg-transparent font-mono" style={{ aspectRatio: '5 / 1' }}>
      <style jsx>{`
        @keyframes flip {
          0% {
            transform: rotateX(0deg);
            opacity: 1;
          }
          50% {
            transform: rotateX(90deg);
            opacity: 0.5;
            background: rgba(0, 255, 255, 0.1);
          }
          100% {
            transform: rotateX(0deg);
            opacity: 1;
          }
        }
        .flip-animation {
          animation: flip 0.2s ease-in-out;
          transform-style: preserve-3d;
        }
      `}</style>

      <div className="absolute inset-0 flex items-center justify-between px-2 md:px-4 gap-1 md:gap-2">
        {/* Days */}
        <div className="flex-1 h-5/6 bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-lg shadow-[inset_0_0_10px_rgba(0,255,255,0.3),0_0_15px_rgba(0,255,255,0.2)] flex flex-col items-center justify-center relative overflow-hidden group">
          <span className="text-xs md:text-sm text-cyan-300/80 absolute top-0.5 left-1 z-10">D</span>
          <span className={`text-2xl md:text-4xl lg:text-5xl font-bold text-cyan-100 drop-shadow-[0_0_8px_cyan] ${isFlipping ? 'flip-animation' : ''}`}>
            {format(timeLeft.days)}
          </span>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Hours */}
        <div className="flex-1 h-5/6 bg-black/40 backdrop-blur-sm border border-orange-500/30 rounded-lg shadow-[inset_0_0_10px_rgba(255,165,0,0.3),0_0_15px_rgba(255,165,0,0.2)] flex flex-col items-center justify-center relative overflow-hidden group">
          <span className="text-xs md:text-sm text-orange-300/80 absolute top-0.5 left-1 z-10">H</span>
          <span className={`text-2xl md:text-4xl lg:text-5xl font-bold text-orange-100 drop-shadow-[0_0_8px_orange] ${isFlipping ? 'flip-animation' : ''}`}>
            {format(timeLeft.hours)}
          </span>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Minutes */}
        <div className="flex-1 h-5/6 bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded-lg shadow-[inset_0_0_10px_rgba(255,255,0,0.3),0_0_15px_rgba(255,255,0,0.2)] flex flex-col items-center justify-center relative overflow-hidden group">
          <span className="text-xs md:text-sm text-yellow-300/80 absolute top-0.5 left-1 z-10">M</span>
          <span className={`text-2xl md:text-4xl lg:text-5xl font-bold text-yellow-100 drop-shadow-[0_0_8px_yellow] ${isFlipping ? 'flip-animation' : ''}`}>
            {format(timeLeft.minutes)}
          </span>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Seconds */}
        <div className="flex-1 h-5/6 bg-black/40 backdrop-blur-sm border border-pink-500/30 rounded-lg shadow-[inset_0_0_10px_rgba(255,0,255,0.3),0_0_15px_rgba(255,0,255,0.2)] flex flex-col items-center justify-center relative overflow-hidden group">
          <span className="text-xs md:text-sm text-pink-300/80 absolute top-0.5 left-1 z-10">S</span>
          <span className={`text-2xl md:text-4xl lg:text-5xl font-bold text-pink-100 drop-shadow-[0_0_8px_fuchsia] ${isFlipping ? 'flip-animation' : ''}`}>
            {format(timeLeft.seconds)}
          </span>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-pink-400 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ 
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', 
        backgroundSize: '20px 20px' 
      }}></div>
      
      {/* Center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl pointer-events-none"></div>
    </div>
  );
};

export default CountdownAnalog;
