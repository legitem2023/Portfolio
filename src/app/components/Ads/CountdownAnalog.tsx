'use client';

import React, { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface DigitProps {
  value: number;
  prevValue: number;
  label: string;
  color: 'cyan' | 'amber' | 'lime' | 'rose';
}

const DigitTile: React.FC<DigitProps> = ({ value, prevValue, label, color }) => {
  const [flipping, setFlipping] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const [prevDisplayValue, setPrevDisplayValue] = useState(prevValue);

  // Color mappings
  const colorClasses = {
    cyan: {
      bg: 'bg-cyan-950/40',
      border: 'border-cyan-500/40',
      text: 'text-cyan-200',
      glow: '0, 255, 255',
      shadow: 'cyan-500',
      from: 'from-cyan-400/20',
      via: 'via-cyan-400/60',
      to: 'to-cyan-400/20',
    },
    amber: {
      bg: 'bg-amber-950/40',
      border: 'border-amber-500/40',
      text: 'text-amber-200',
      glow: '255, 193, 7',
      shadow: 'amber-500',
      from: 'from-amber-400/20',
      via: 'via-amber-400/60',
      to: 'to-amber-400/20',
    },
    lime: {
      bg: 'bg-lime-950/40',
      border: 'border-lime-500/40',
      text: 'text-lime-200',
      glow: '132, 255, 99',
      shadow: 'lime-500',
      from: 'from-lime-400/20',
      via: 'via-lime-400/60',
      to: 'to-lime-400/20',
    },
    rose: {
      bg: 'bg-rose-950/40',
      border: 'border-rose-500/40',
      text: 'text-rose-200',
      glow: '255, 107, 107',
      shadow: 'rose-500',
      from: 'from-rose-400/20',
      via: 'via-rose-400/60',
      to: 'to-rose-400/20',
    },
  };

  const c = colorClasses[color];

  // Trigger flip animation when value changes
  useEffect(() => {
    if (value !== displayValue) {
      setPrevDisplayValue(displayValue);
      setFlipping(true);
      
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setFlipping(false);
      }, 300); // Half of animation duration
      
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      {/* Label above digit */}
      <span className={`absolute -top-6 text-xs font-mono tracking-widest text-${color}-300/70`}>
        {label}
      </span>

      {/* Main tile with mechanical look */}
      <div className={`relative w-full h-full ${c.bg} backdrop-blur-md rounded-lg border ${c.border} shadow-[inset_0_0_20px_rgba(${c.glow},0.3),0_0_30px_rgba(${c.glow},0.2)] overflow-hidden`}>
        
        {/* Current value (top half) */}
        <div className={`absolute top-0 left-0 w-full h-1/2 flex items-end justify-center pb-1 border-b border-white/10 bg-gradient-to-b ${c.from} via-transparent to-transparent transition-all duration-700 ${flipping ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}`}>
          <span className={`text-3xl md:text-5xl font-bold ${c.text} drop-shadow-[0_0_8px_${c.shadow}]`}>
            {displayValue}
          </span>
        </div>

        {/* Current value (bottom half) */}
        <div className={`absolute bottom-0 left-0 w-full h-1/2 flex items-start justify-center pt-1 bg-gradient-to-t ${c.from} via-transparent to-transparent transition-all duration-700 ${flipping ? 'opacity-0 translate-y-full' : 'opacity-100 translate-y-0'}`}>
          <span className={`text-3xl md:text-5xl font-bold ${c.text} drop-shadow-[0_0_8px_${c.shadow}] opacity-70`}>
            {displayValue}
          </span>
        </div>

        {/* Previous value (top half - flipping down) */}
        <div className={`absolute top-0 left-0 w-full h-1/2 flex items-end justify-center pb-1 border-b border-white/10 bg-gradient-to-b ${c.from} via-transparent to-transparent transition-all duration-700 ${flipping ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}>
          <span className={`text-3xl md:text-5xl font-bold ${c.text} drop-shadow-[0_0_8px_${c.shadow}]`}>
            {prevDisplayValue}
          </span>
        </div>

        {/* Previous value (bottom half - flipping down) */}
        <div className={`absolute bottom-0 left-0 w-full h-1/2 flex items-start justify-center pt-1 bg-gradient-to-t ${c.from} via-transparent to-transparent transition-all duration-700 ${flipping ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}>
          <span className={`text-3xl md:text-5xl font-bold ${c.text} drop-shadow-[0_0_8px_${c.shadow}] opacity-70`}>
            {prevDisplayValue}
          </span>
        </div>

        {/* Horizontal split line (mechanical detail) */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent transform -translate-y-1/2 z-10"></div>
        
        {/* Vertical rivets/bolts (mechanical details) */}
        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white/30 shadow-[0_0_5px_white]"></div>
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white/30 shadow-[0_0_5px_white]"></div>
        <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-white/30 shadow-[0_0_5px_white]"></div>
        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-white/30 shadow-[0_0_5px_white]"></div>
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

  const [prevTimeLeft, setPrevTimeLeft] = useState<TimeLeft>({
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

        setPrevTimeLeft(timeLeft);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setPrevTimeLeft(timeLeft);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  // Split each time unit into two digits
  const daysDigits = {
    tens: Math.floor(timeLeft.days / 10),
    ones: timeLeft.days % 10,
  };
  const hoursDigits = {
    tens: Math.floor(timeLeft.hours / 10),
    ones: timeLeft.hours % 10,
  };
  const minutesDigits = {
    tens: Math.floor(timeLeft.minutes / 10),
    ones: timeLeft.minutes % 10,
  };
  const secondsDigits = {
    tens: Math.floor(timeLeft.seconds / 10),
    ones: timeLeft.seconds % 10,
  };

  const prevDaysDigits = {
    tens: Math.floor(prevTimeLeft.days / 10),
    ones: prevTimeLeft.days % 10,
  };
  const prevHoursDigits = {
    tens: Math.floor(prevTimeLeft.hours / 10),
    ones: prevTimeLeft.hours % 10,
  };
  const prevMinutesDigits = {
    tens: Math.floor(prevTimeLeft.minutes / 10),
    ones: prevTimeLeft.minutes % 10,
  };
  const prevSecondsDigits = {
    tens: Math.floor(prevTimeLeft.seconds / 10),
    ones: prevTimeLeft.seconds % 10,
  };

  return (
    <div className="relative w-full bg-transparent font-mono" style={{ aspectRatio: '5 / 1' }}>
      {/* Main container */}
      <div className="absolute inset-0 flex items-center justify-between px-1 gap-1 md:gap-2">
        {/* Days */}
        <div className="flex-1 h-4/5 flex gap-1">
          <DigitTile 
            value={daysDigits.tens} 
            prevValue={prevDaysDigits.tens} 
            label="D" 
            color="cyan" 
          />
          <DigitTile 
            value={daysDigits.ones} 
            prevValue={prevDaysDigits.ones} 
            label="" 
            color="cyan" 
          />
        </div>

        {/* Hours */}
        <div className="flex-1 h-4/5 flex gap-1">
          <DigitTile 
            value={hoursDigits.tens} 
            prevValue={prevHoursDigits.tens} 
            label="H" 
            color="amber" 
          />
          <DigitTile 
            value={hoursDigits.ones} 
            prevValue={prevHoursDigits.ones} 
            label="" 
            color="amber" 
          />
        </div>

        {/* Minutes */}
        <div className="flex-1 h-4/5 flex gap-1">
          <DigitTile 
            value={minutesDigits.tens} 
            prevValue={prevMinutesDigits.tens} 
            label="M" 
            color="lime" 
          />
          <DigitTile 
            value={minutesDigits.ones} 
            prevValue={prevMinutesDigits.ones} 
            label="" 
            color="lime" 
          />
        </div>

        {/* Seconds */}
        <div className="flex-1 h-4/5 flex gap-1">
          <DigitTile 
            value={secondsDigits.tens} 
            prevValue={prevSecondsDigits.tens} 
            label="S" 
            color="rose" 
          />
          <DigitTile 
            value={secondsDigits.ones} 
            prevValue={prevSecondsDigits.ones} 
            label="" 
            color="rose" 
          />
        </div>
      </div>

      {/* Mechanical details overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Fine grid lines */}
        <div className="w-full h-full" style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/10"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/10"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/10"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/10"></div>
      </div>
    </div>
  );
};

export default CountdownAnalog;
