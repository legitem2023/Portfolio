'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    $: any;
    jQuery: any;
    FlipClock: any;
  }
}

const CountdownAnalog = () => {
  const flipClockRef = useRef<HTMLDivElement>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    // Calculate time difference until July 27, 2026
    const calculateTimeLeft = () => {
      const targetDate = new Date('2026-07-27T00:00:00');
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      // Convert to seconds and ensure it's not negative
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    // Load jQuery and FlipClock scripts dynamically
    const loadScripts = async () => {
      // Check if jQuery and FlipClock are already loaded
      if (typeof window.$ === 'undefined' || typeof window.FlipClock === 'undefined') {
        try {
          // Load jQuery
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });

          // Load FlipClock CSS
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/flipclock/0.7.8/flipclock.min.css';
          document.head.appendChild(link);

          // Load FlipClock JS
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/flipclock/0.7.8/flipclock.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        } catch (error) {
          console.error('Failed to load scripts:', error);
        }
      }

      // Initialize FlipClock functionality
      initFlipClock();
    };

    const initFlipClock = () => {
      const $ = window.$;
      
      const agDetectmob = () => {
        // Use the calculated time difference
        $('.js-flipclock').FlipClock(timeLeft, {
          clockFace: 'DailyCounter',
          countdown: true,
          callbacks: {
            stop: function() {
              console.log('Countdown finished!');
            }
          }
        });

        return true;
      };

      const agChangeResize = () => {
        const agFlipClock = $('.js-flipclock');

        // Determine viewport wider than 480 pixels
        if (window.innerWidth > 480) {
          agFlipClock.removeClass('js-ag-show');
        } else {
          agFlipClock.addClass('js-ag-show');
        }
      };

      // Add custom styles for js-ag-show class
      const style = document.createElement('style');
      style.textContent = `
        .js-ag-show.flip-clock-wrapper ul li a div div.inn {
          color: #ccc612 !important;
          text-shadow: 0 1px 2px #1508f0 !important;
          background-color: #252ed3 !important;
        }
        .js-ag-show .flip-clock-dot {
          background-color: #252ed3 !important;
        }
      `;
      document.head.appendChild(style);

      agDetectmob();
      agChangeResize();

      $(window).resize(function () {
        agChangeResize();
      });
    };

    if (timeLeft > 0) {
      loadScripts();
    }

    // Cleanup
    return () => {
      if (window.$) {
        $(window).off('resize');
      }
    };
  }, [timeLeft]);

  // Update time left every minute to keep it accurate
  useEffect(() => {
    const timer = setInterval(() => {
      const targetDate = new Date('2026-07-27T00:00:00');
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      const newTimeLeft = Math.max(0, Math.floor(difference / 1000));
      
      setTimeLeft(newTimeLeft);

      // Update FlipClock if it exists
      if (window.$ && window.$('.js-flipclock').data('flipclock')) {
        const clock = window.$('.js-flipclock').data('flipclock');
        if (clock) {
          clock.setTime(newTimeLeft);
        }
      }
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // If the date has passed, show a message
  if (timeLeft === 0) {
    return (
      <div className="py-12">
        <div className="max-w-[1142px] mx-auto px-4 text-center">
          <div className="text-2xl font-bold text-[#252ed3]">
            The countdown has ended!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-[1142px] mx-auto px-4">
        <div className="js-flipclock" ref={flipClockRef}></div>
      </div>
    </div>
  );
};

export default CountdownAnalog;
