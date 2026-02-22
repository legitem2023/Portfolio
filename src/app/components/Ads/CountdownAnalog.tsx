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
    const targetDate = new Date(2026, 6, 27, 0, 0, 0);

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

  useEffect(() => {
    prevTimeRef.current = timeLeft;
  }, [timeLeft]);

  const formatDays = (num: number): string => num.toString().padStart(3, '0');
  const formatTime = (num: number): string => num.toString().padStart(2, '0');

  return (
    <div className="relative w-full bg-transparent font-serif" style={{ aspectRatio: '5 / 1' }}>
      <div className="absolute inset-0 flex items-center justify-between px-2 md:px-4 gap-1 md:gap-2">
        {/* Days */}
        <div className="flex-1 h-5/6 bg-amber-50/10 backdrop-blur-sm border border-amber-700/30 rounded-lg shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #8b7a5a 0%, #c9b587 50%, #8b7a5a 100%)' }}>
          <span className="text-xs md:text-sm text-amber-200 absolute top-1 left-2 z-20 font-bold tracking-wider">DAYS</span>
          <div className="flex gap-1 md:gap-2">
            <BookFlipDigit digit={formatDays(timeLeft.days)[0]} prevDigit={formatDays(prevTimeRef.current.days)[0]} color="amber" />
            <BookFlipDigit digit={formatDays(timeLeft.days)[1]} prevDigit={formatDays(prevTimeRef.current.days)[1]} color="amber" />
            <BookFlipDigit digit={formatDays(timeLeft.days)[2]} prevDigit={formatDays(prevTimeRef.current.days)[2]} color="amber" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-900 via-amber-600 to-amber-900"></div>
        </div>

        {/* Hours */}
        <div className="flex-1 h-5/6 bg-amber-50/10 backdrop-blur-sm border border-amber-700/30 rounded-lg shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #8b7a5a 0%, #c9b587 50%, #8b7a5a 100%)' }}>
          <span className="text-xs md:text-sm text-amber-200 absolute top-1 left-2 z-20 font-bold tracking-wider">HOURS</span>
          <div className="flex gap-1 md:gap-2">
            <BookFlipDigit digit={formatTime(timeLeft.hours)[0]} prevDigit={formatTime(prevTimeRef.current.hours)[0]} color="amber" />
            <BookFlipDigit digit={formatTime(timeLeft.hours)[1]} prevDigit={formatTime(prevTimeRef.current.hours)[1]} color="amber" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-900 via-amber-600 to-amber-900"></div>
        </div>

        {/* Minutes */}
        <div className="flex-1 h-5/6 bg-amber-50/10 backdrop-blur-sm border border-amber-700/30 rounded-lg shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #8b7a5a 0%, #c9b587 50%, #8b7a5a 100%)' }}>
          <span className="text-xs md:text-sm text-amber-200 absolute top-1 left-2 z-20 font-bold tracking-wider">MINS</span>
          <div className="flex gap-1 md:gap-2">
            <BookFlipDigit digit={formatTime(timeLeft.minutes)[0]} prevDigit={formatTime(prevTimeRef.current.minutes)[0]} color="amber" />
            <BookFlipDigit digit={formatTime(timeLeft.minutes)[1]} prevDigit={formatTime(prevTimeRef.current.minutes)[1]} color="amber" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-900 via-amber-600 to-amber-900"></div>
        </div>

        {/* Seconds */}
        <div className="flex-1 h-5/6 bg-amber-50/10 backdrop-blur-sm border border-amber-700/30 rounded-lg shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #8b7a5a 0%, #c9b587 50%, #8b7a5a 100%)' }}>
          <span className="text-xs md:text-sm text-amber-200 absolute top-1 left-2 z-20 font-bold tracking-wider">SECS</span>
          <div className="flex gap-1 md:gap-2">
            <BookFlipDigit digit={formatTime(timeLeft.seconds)[0]} prevDigit={formatTime(prevTimeRef.current.seconds)[0]} color="amber" />
            <BookFlipDigit digit={formatTime(timeLeft.seconds)[1]} prevDigit={formatTime(prevTimeRef.current.seconds)[1]} color="amber" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-900 via-amber-600 to-amber-900"></div>
        </div>
      </div>

      {/* Book binding effect - vertical lines between units */}
      <div className="absolute top-2 bottom-2 left-[25%] w-[2px] bg-gradient-to-b from-amber-800/50 via-amber-600/30 to-amber-800/50"></div>
      <div className="absolute top-2 bottom-2 left-[50%] w-[2px] bg-gradient-to-b from-amber-800/50 via-amber-600/30 to-amber-800/50"></div>
      <div className="absolute top-2 bottom-2 left-[75%] w-[2px] bg-gradient-to-b from-amber-800/50 via-amber-600/30 to-amber-800/50"></div>
    </div>
  );
};

interface BookFlipDigitProps {
  digit: string;
  prevDigit: string;
  color: string;
}

const BookFlipDigit: React.FC<BookFlipDigitProps> = ({ digit, prevDigit, color }) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [showTop, setShowTop] = useState(true);
  
  useEffect(() => {
    if (digit !== prevDigit) {
      setIsFlipping(true);
      
      // First half of flip - top page turns
      setTimeout(() => {
        setShowTop(false);
      }, 150);
      
      // Reset after flip completes
      setTimeout(() => {
        setIsFlipping(false);
        setShowTop(true);
      }, 300);
    }
  }, [digit, prevDigit]);

  return (
    <div className="relative w-8 md:w-12 h-16 md:h-20 book-page perspective">
      <style jsx>{`
        @keyframes flipPageTop {
          0% {
            transform: rotateX(0deg);
            transform-origin: top;
            opacity: 1;
          }
          100% {
            transform: rotateX(-180deg);
            transform-origin: top;
            opacity: 0;
          }
        }
        
        @keyframes flipPageBottom {
          0% {
            transform: rotateX(180deg);
            transform-origin: bottom;
            opacity: 0;
          }
          100% {
            transform: rotateX(0deg);
            transform-origin: bottom;
            opacity: 1;
          }
        }

        .flip-top {
          animation: flipPageTop 0.3s ease-in forwards;
          backface-visibility: hidden;
          transform-style: preserve-3d;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .flip-bottom {
          animation: flipPageBottom 0.3s ease-out forwards;
          backface-visibility: hidden;
          transform-style: preserve-3d;
          box-shadow: 0 -2px 5px rgba(0,0,0,0.2);
        }

        .perspective {
          perspective: 800px;
        }

        .book-page {
          background: linear-gradient(145deg, #f5e6d3 0%, #fff4e6 50%, #f5e6d3 100%);
          border-radius: 2px;
          box-shadow: 
            inset 0 0 0 1px rgba(255,255,255,0.5),
            inset 2px 0 5px rgba(0,0,0,0.1),
            inset -2px 0 5px rgba(0,0,0,0.1),
            0 2px 5px rgba(0,0,0,0.2);
        }

        .page-curl {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 10px;
          height: 10px;
          background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%);
          pointer-events: none;
        }

        .binding-shadow {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to right, rgba(0,0,0,0.2), transparent);
        }
      `}</style>

      {/* Book page base */}
      <div className="absolute inset-0 book-page">
        {/* Page texture */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0px, #000 2px, transparent 2px, transparent 8px)'
        }}></div>
        
        {/* Binding shadow */}
        <div className="binding-shadow"></div>
        
        {/* Page curl */}
        <div className="page-curl"></div>
      </div>

      {/* Current digit (shows when not flipping or after flip completes) */}
      {(!isFlipping || !showTop) && (
        <div className="absolute inset-0 flex items-center justify-center text-2xl md:text-4xl font-bold text-amber-900 z-10" style={{ textShadow: '1px 1px 0 rgba(255,255,255,0.5)' }}>
          {digit}
        </div>
      )}

      {/* Flipping animation */}
      {isFlipping && (
        <>
          {/* Top page flipping (shows old number) */}
          {showTop && (
            <div className="absolute inset-0 flex items-start justify-center pt-4 flip-top z-20">
              <div className="book-page absolute inset-0">
                <div className="binding-shadow"></div>
              </div>
              <span className="text-2xl md:text-4xl font-bold text-amber-900 relative z-10" style={{ textShadow: '1px 1px 0 rgba(255,255,255,0.5)' }}>
                {prevDigit}
              </span>
            </div>
          )}
          
          {/* Bottom page flipping (shows new number) */}
          {!showTop && (
            <div className="absolute inset-0 flex items-end justify-center pb-4 flip-bottom z-20">
              <div className="book-page absolute inset-0">
                <div className="binding-shadow"></div>
              </div>
              <span className="text-2xl md:text-4xl font-bold text-amber-900 relative z-10" style={{ textShadow: '1px 1px 0 rgba(255,255,255,0.5)' }}>
                {digit}
              </span>
            </div>
          )}
        </>
      )}

      {/* Page edge effect */}
      <div className="absolute right-0 top-1 bottom-1 w-[2px] bg-gradient-to-b from-amber-300 via-amber-500 to-amber-300 opacity-50"></div>
    </div>
  );
};

export default CountdownAnalog;
