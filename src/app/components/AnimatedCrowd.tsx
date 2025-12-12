"use client";
import React, { useEffect, useState } from "react"; // Added useEffect and useState imports
import clsx from "clsx";
import type { SVGProps } from 'react';

// Added function to check current time for day/night mode
function useTimeOfDay() {
  const [isDayTime, setIsDayTime] = useState(true);
  
  useEffect(() => {
    const updateTimeOfDay = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Day mode: 6 AM to 5:59 PM (6:00 to 17:59)
      // Night mode: 6 PM to 5:59 AM (18:00 to 5:59)
      const isDay = currentHour >= 6 && currentHour < 18;
      setIsDayTime(isDay);
    };
    
    // Initial update
    updateTimeOfDay();
    
    // Update every minute to catch hour changes
    const interval = setInterval(updateTimeOfDay, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return isDayTime;
}

// Motorcycle component (unchanged)
function EmojioneMotorcycle(props: SVGProps<SVGSVGElement>) {
  return (<svg xmlns="http://www.w3.org/2000/svg" width={64} height={64} viewBox="0 0 64 64" {...props}><path fill="#231f20" d="m31.4 31.4l-.5-6.3l-3.4.3l.5 5.5l-9.4 4.4l3.8 3s2.7-1.1 2.5-2l5.7-3.1c.7-.3 1-1.1.8-1.8"></path><path fill="#959595" d="M57 35.2L40.8 45.4l.9 1.2l16.9-8.1c0-1.2-.5-2.5-1.6-3.3"></path><g fill="#1a1a1a"><path d="m40.1 44.7l4.8-2.3s2.2 1.9-.2 4.1zm-28.7-1.5c-5.2 0-9.4 4.2-9.4 9.4S6.2 62 11.4 62s9.4-4.2 9.4-9.4s-4.2-9.4-9.4-9.4m0 16c-3.6 0-6.6-2.9-6.6-6.6c0-3.6 2.9-6.6 6.6-6.6c3.6 0 6.6 2.9 6.6 6.6c-.1 3.7-3 6.6-6.6 6.6"></path><path d="m18.4 52.2l-4.3-.3l3.6-2.4l-.5-.8l-3.8 1.9l1.8-3.9l-.7-.4l-2.4 3.5l-.3-4.2h-.9l-.3 4.2l-2.3-3.5l-.8.5l1.8 3.8l-3.8-1.8l-.4.7l3.5 2.4l-4.3.3v.9l4.3.3l-3.5 2.3l.4.8l3.8-1.8l-1.8 3.8l.8.4l2.3-3.5l.4 4.3h.8l.3-4.3l2.4 3.5l.8-.4l-1.9-3.8l3.8 1.8l.5-.8l-3.5-2.3l4.2-.3z"></path></g><path fill="#959595" d="M11.4 47.9c-2.6 0-4.7 2.1-4.7 4.7s2.1 4.7 4.7 4.7s4.7-2.1 4.7-4.7s-2.1-4.7-4.7-4.7m0 7.5c-1.6 0-2.8-1.3-2.8-2.8s1.3-2.8 2.8-2.8c1.6 0 2.8 1.3 2.8 2.8s-1.3 2.8-2.8 2.8"></path><path fill="#94989b" d="M35.8 42.1v6.3l16.4 6.9l1.8-5z"></path><path fill="#1a1a1a" d="M52.6 43.2c-5.2 0-9.4 4.2-9.4 9.4s4.2 9.4 9.4 9.4s9.4-4.2 9.4-9.4s-4.2-9.4-9.4-9.4m0 16c-3.6 0-6.6-2.9-6.6-6.6c0-3.6 2.9-6.6 6.6-6.6c3.6 0 6.6 2.9 6.6 6.6s-3 6.6-6.6 6.6"></path><path fill="#94989b" d="M13.9 35.7v2.8l14.6 2.1c-5.1-4.9-14.6-4.9-14.6-4.9"></path><path fill="#1a1a1a" d="M28.4 40.3L50.8 33l.9 5.3l-19.6 9.6z"></path><path fill="#007c17" d="m27.7 40.8l.2-2.7c0-.5.5-.9 1-1.1c1.5-.5 5.9-2.2 5.9-2.2l2.8 3.5z"></path><path fill="#1a1a1a" d="m11.4 53.3l8.3-11.9l-2.5-1.9l-6.4 13.1z"></path><path fill="#00ef5c" d="M19.4 46.2c-1.9-2.4-4.8-3.9-8-3.9c-2.5 0-4.8.9-6.5 2.3z"></path><path fill="#1a1a1a" d="m59.7 52.2l-4.3-.3l3.5-2.4l-.4-.8l-3.9 1.9l1.9-3.9l-.8-.4l-2.3 3.5l-.3-4.2h-.9l-.3 4.2l-2.4-3.5l-.8.5l1.9 3.8l-3.9-1.8l-.4.7l3.6 2.4l-4.3.3v.9l4.2.3l-3.5 2.3l.5.8l3.8-1.8l-1.9 3.8l.8.4l2.4-3.5l.3 4.3h.9l.3-4.3l2.4 3.5l.7-.4l-1.8-3.8l3.8 1.8l.4-.8l-3.5-2.3l4.3-.3z"></path><path fill="#959595" d="M52.6 47.9c-2.6 0-4.7 2.1-4.7 4.7s2.1 4.7 4.7 4.7s4.7-2.1 4.7-4.7s-2.1-4.7-4.7-4.7m0 7.5c-1.6 0-2.8-1.3-2.8-2.8s1.3-2.8 2.8-2.8s2.8 1.3 2.8 2.8s-1.2 2.8-2.8 2.8"></path><path fill="#007c17" d="M44.9 38.4c-1.7.8-1.6 2.4-1.6 2.4s5.2-.3 11.8-3.9c3.2-1.8 3.2-5.6 3.2-5.6c-11.4-.2-8.1 4.4-13.4 7.1m-3.1 9.3c-5.1 0-5.5-4.5-10.3-6.3c-6-2.3-14.8-3.3-16.4-3.3c-1.7 0-.4-1.9 0-2.4c3.4-4 7.8-3.3 7.8-3.3l-1.4-1.3c-4.2 0-7.9 2.1-10.1 5.3c-.9 1.3-2.3 3.1-1.5 3.6c2 1.4 8.1 5.4 8.1 5.4s2.4 1.6 2.8 2.4c.9 1.6 1 8 1 8c0 .7.5 1.4 1.4 1.3l18.4-2.5c-.5-1.3-.8-3.6.2-6.9"></path><path fill="#c5c5c5" d="M11.4 39h2.5l-.8 2s-3.6-2-1.7-2"></path><path fill="#666c70" d="M30.1 48c-1.9-.5-3.8.6-4.3 2.5l8.2 2.1c.9.2 1.9-.3 2.1-1.2l.4-1.7z"></path><path fill="#231f20" d="m48 28.4l-13.8 5.8l-3.5 13.9l5.8 1.5l3.4-11.2s5.6-2.4 7.1-3.6c1.3-1.1 2.9-3.6 1-6.4"></path><path fill="#1a1a1a" d="M48 28.4s-8.2-8.7-16.2-8.5l-6.1 4.8l.5 5.5l-4.8 2.6l1.6 2.9l5.8-3.1c.7-.4.9-1 .9-1.9c-.1-.7-.2-2.8-.2-2.8l6.6 5.8z"></path><path fill="#666c70" d="m22.5 34.2l-.6-1.5c-.2-.5-.9-.8-1.4-.5l-.7.3c-.5.1-.8.5-.8.9c-1 .5-2.1 1.4-1.3 3.2c.1.3.8 1.9 2.8 1.1c2.9-1.3 2.9-1.3 2-3.5"></path><path fill="#007c17" d="M37.3 13.5c0 6.3-1.8 6.1-11.5 11.5c-3.2 1.8-7.7 1.8-9.8-5.6c-.7-2.4-1.6-3.2-1.6-5.8C14.4 7.1 19.5 2 25.9 2c6.3 0 11.4 5.1 11.4 11.5"></path><path fill="#1a1a1a" d="M28.5 13.2c.7 1.9-7.5 6.6-12.5 8.4c-1.2.5-3.7-6.3-2.5-6.7c5-1.9 14.3-3.6 15-1.7"></path><circle cx={28.2} cy={12.9} r={2} fill="#94989b"></circle></svg>);
}

// Department Store component with color variations
function EmojioneDepartmentStore({ colorVariant, ...props }: SVGProps<SVGSVGElement> & { colorVariant?: number }) {
  // Default colors (original)
  const colors = {
    main: "#340f45",
    accent1: "#9e68bc", 
    accent2: "#3f085b",
    accent3: "#ce23d3",
    accent4: "#5e20b8",
    accent5: "#ec44f1",
    light: "#d6eef0",
    details: "#9e68bc"
  };

  // Color variations
  const colorVariants = [
    colors, // original
    { // Blue theme
      main: "#0f2f45",
      accent1: "#6896bc",
      accent2: "#083b5b",
      accent3: "#238ed3",
      accent4: "#205cb8",
      accent5: "#4494f1",
      light: "#e6f0fa",
      details: "#6896bc"
    },
    { // Green theme
      main: "#0f4520",
      accent1: "#68bc7a",
      accent2: "#085b1f",
      accent3: "#23d352",
      accent4: "#20b845",
      accent5: "#44f166",
      light: "#e6fae9",
      details: "#68bc7a"
    },
    { // Red theme
      main: "#450f0f",
      accent1: "#bc6868",
      accent2: "#5b0808",
      accent3: "#d32323",
      accent4: "#b82020",
      accent5: "#f14444",
      light: "#fae6e6",
      details: "#bc6868"
    },
    { // Orange theme
      main: "#45290f",
      accent1: "#bc8a68",
      accent2: "#5b3508",
      accent3: "#d37823",
      accent4: "#b86520",
      accent5: "#f19c44",
      light: "#faefe6",
      details: "#bc8a68"
    },
    { // Teal theme
      main: "#0f4545",
      accent1: "#68bcbc",
      accent2: "#085b5b",
      accent3: "#23d3d3",
      accent4: "#20b8b8",
      accent5: "#44f1f1",
      light: "#e6fafa",
      details: "#68bcbc"
    }
  ];

  const variant = colorVariant !== undefined ? colorVariant : Math.floor(Math.random() * colorVariants.length);
  const currentColors = colorVariants[variant];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={64} height={64} viewBox="0 0 64 64" {...props}>
      <path fill="#d0d0d0" d="M0 60h64v4H0z"></path>
      <path fill={currentColors.main} d="M2 32h60v28H2z"></path>
      <path fill={currentColors.light} d="M6 42h14v18H6z"></path>
      <path fill={currentColors.accent1} d="M2 27h60v6H2z"></path>
      <path fill={currentColors.accent2} d="M0 27c0 2.2 1.8 4 4 4s4-1.8 4-4z"></path>
      <path fill={currentColors.accent3} d="M8 27c0 2.2 1.8 4 4 4s4-1.8 4-4z"></path>
      <path fill={currentColors.accent2} d="M16 27c0 2.2 1.8 4 4 4s4-1.8 4-4z"></path>
      <path fill={currentColors.accent4} d="M16 18h8v9h-8z"></path>
      <path fill={currentColors.accent3} d="M24 27c0 2.2 1.8 4 4 4s4-1.8 4-4z"></path>
      <path fill={currentColors.accent5} d="M24 18h8v9h-8z"></path>
      <path fill={currentColors.accent4} d="M0 18h8v9H0z"></path>
      <path fill={currentColors.accent5} d="M8 18h8v9H8z"></path>
      <path fill={currentColors.accent4} d="M48 18h8v9h-8z"></path>
      <path fill={currentColors.accent5} d="M56 18h8v9h-8z"></path>
      <path fill={currentColors.accent2} d="M32 27c0 2.2 1.8 4 4 4s4-1.8 4-4z"></path>
      <path fill={currentColors.accent4} d="M32 18h8v9h-8z"></path>
      <path fill={currentColors.accent3} d="M40 27c0 2.2 1.8 4 4 4s4-1.8 4-4z"></path>
      <path fill={currentColors.accent5} d="M40 18h8v9h-8z"></path>
      <path fill={currentColors.accent2} d="M48 27c0 2.2 1.8 4 4 4s4-1.8 4-4z"></path>
      <path fill={currentColors.accent3} d="M56 27c0 2.2 1.8 4 4 4s4-1.8 4-4z"></path>
      <path fill="#fff" d="M13 33c-5 0-9 4-9 9h18c0-5-4-9-9-9"></path>
      <path fill={currentColors.main} d="M6.3 40h13.4c-.9-2.9-3.5-5-6.7-5s-5.8 2.1-6.7 5"></path>
      <path fill="#fff" d="M6 42h2v18H6zm12 0h2v18h-2z"></path>
      <path fill="#b4d7ee" d="M8 42h10v2H8z"></path>
      <path fill="#fff" d="M27 33h30v20H27z"></path>
      <path fill={currentColors.accent1} d="M59 56c0 .5-.5 1-1 1H26c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1h32c.5 0 1 .5 1 1z"></path>
      <path fill={currentColors.light} d="M29 35h26v16H29z"></path>
      <path fill="#b4d7ee" d="M29 35h26v2H29z"></path>
      <path fill={currentColors.main} d="M16 47c-.6 0-1 .6-1 1.3v2c0 .7.4 1.7.8 2.1l.4.4c.4.4.8.2.8-.5v-3.9c0-.8-.5-1.4-1-1.4"></path>
      <path fill={currentColors.accent1} d="M64 18H0V2C0 .9.9 0 2 0h60c1.1 0 2 .9 2 2z"></path>
      <path fill="#e8e8e8" d="M3 2c-.5 0-1 .5-1 1v12c0 .6.5 1 1 1h58c.5 0 1-.4 1-1V3c0-.5-.5-1-1-1z"></path>
      <g fill={currentColors.details}>
        <path d="M17.5 5.1c-2.3-1-4.9-1.5-7.4-.8c-2.4.7-2.7 3.6-.7 5c1.9 1.2 4.3.2 6.3 1.2c.8.4.2 1.1-.3 1.3c-.7.2-1.3.2-1.9.2c-1.3 0-2.9-.2-4-.9s-2.1 1-1 1.7c1.9 1.2 4.9 1.4 7 .9c2.2-.5 3.4-3.1 1.5-4.7c-1.6-1.4-4.1-.8-6.1-1.3c-.6-.1-1.4-.6-.8-1.3c.6-.5 1.9-.4 2.5-.4c1.3 0 2.9.4 3.9.9c1.2.5 2.2-1.3 1-1.8M50 13V5l-1 1c.8 0 6.1-.2 4.9 1.4c-.8 1-3.7.6-4.9.6c-1.3 0-1.3 2 0 2c2.2 0 6.7.4 7-2.7c.3-3.8-4.5-3.3-7-3.3c-.5 0-1 .5-1 1v8c0 1.3 2 1.3 2 0M22 5v8c0 1.3 2 1.3 2 0V5c0-1.3-2-1.3-2 0m8 0v8c0 1.3 2 1.3 2 0V5c0-1.3-2-1.3-2 0"></path>
        <path d="M23 10h8c1.3 0 1.3-2 0-2h-8c-1.3 0-1.3 2 0 2"></path>
      </g>
      <circle cx={40} cy={9} r={4} fill="none" stroke={currentColors.details} strokeMiterlimit={10} strokeWidth={2}></circle>
      <g fill={currentColors.details}>
        <circle cx={5} cy={9} r={1}></circle>
        <circle cx={59} cy={9} r={1}></circle>
      </g>
    </svg>
  );
}

const AnimatedCrowd = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  const isDayTime = useTimeOfDay(); // Use the custom hook
  
  return (
    <div
      className={clsx(
        "z-10 absolute inset-x-0 top-0 mx-auto w-[100%] overflow-hidden aspect-[4/1] sm:aspect-[9/1]",
        isDayTime 
          ? "bg-gradient-to-b from-sky-400 via-blue-300 to-amber-100" // Day gradient (6 AM - 5:59 PM)
          : "bg-gradient-to-b from-blue-950 via-indigo-600 to-violet-300", // Night gradient (6 PM - 5:59 AM)
        className
      )}
    >
      {/* STAR FIELD - Only show at night (6 PM to 5:59 AM) */}
      {!isDayTime && (
        <div className="absolute inset-0">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: "1px",
                height: "1px",
                opacity: Math.random() * 0.8 + 0.2,
                animation: `twinkle ${2 + Math.random() * 3}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {/* SUN/MOON - Changes based on time of day */}
      <div className={clsx(
        "absolute top-6 right-6 w-12 h-12",
        isDayTime 
          ? "bg-gradient-to-b from-amber-400 to-orange-300 rounded-full shadow-[0_0_30px_15px_rgba(255,200,50,0.6)]"
          : "bg-gradient-to-b from-amber-50 to-amber-100 rounded-full"
      )}>
        {!isDayTime && (
          <>
            <div
              className="absolute inset-0 rounded-full bg-zinc-200/30 animate-ping"
              style={{ animationDuration: "5s" }}
            ></div>
            <div className="absolute inset-0 rounded-full shadow-[0_0_25px_10px_rgba(255,255,200,0.4)]"></div>
          </>
        )}
      </div>

      {/* CLOUDS - Only show during day (6 AM to 5:59 PM) */}
      {isDayTime && (
        <div className="absolute inset-0 opacity-40">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-4 rounded-full bg-white/80"
              style={{
                left: `${10 + i * 20}%`,
                width: `${40 + Math.random() * 30}px`,
                height: `${20 + Math.random() * 15}px`,
                animation: `float ${15 + Math.random() * 10}s infinite linear`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      )}

      {/* FAR skyline - 3 copies for seamless looping */}
      <ParallaxStrip
        className="bottom-2 opacity-100"
        speedClass="animate-[scrollX_70s_linear_infinite] will-change-transform transform-gpu"
        buildingTone={isDayTime ? "from-gray-600 to-gray-300" : "from-indigo-900 to-black-950"}
        heights={[20, 30, 45, 55]}
        detailLevel="far"
      />

      {/* MID skyline - 3 copies for seamless looping */}
      <ParallaxStrip
        className="bottom-2 opacity-100"
        speedClass="animate-[scrollX_45s_linear_infinite] will-change-transform transform-gpu"
        buildingTone={isDayTime ? "from-gray-400 to-gray-500" : "from-purple-900 to-purple-950"}
        heights={[30, 50, 65, 75]}
        detailLevel="mid"
      />

      {/* NEAR skyline - 3 copies for seamless looping */}
      <ParallaxStrip
        className="bottom-2 opacity-100"
        speedClass="animate-[scrollX_25s_linear_infinite] will-change-transform transform-gpu"
        buildingTone={isDayTime ? "from-gray-200 to-gray-800" : "from-indigo-900 to-indigo-950"}
        heights={[40, 65, 55, 70]}
        hasAntennas
        detailLevel="near"
      />

      {/* Moving Trees with Department Stores - Fixed spacing and infinite scrolling */}
      <div className="absolute bottom-4 left-0 right-0 h-10">
        <div
          className={clsx(
            "absolute left-0 top-0 w-[300%]",
            "animate-[scrollX_15s_linear_infinite] will-change-transform transform-gpu"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex w-full">
            <TreeAndStoreRow />
            <TreeAndStoreRow />
            <TreeAndStoreRow />
          </div>
        </div>
      </div>

      {/* Motorcycle - Animated to overtake the truck */}
      <div 
        className="absolute animate-overtake z-10"
        style={{ 
          bottom: '0.7rem',
          animation: 'overtake 8s infinite linear'
        }}
      >
        <EmojioneMotorcycle className="h-14 w-14 transform scale-x-[-1] z-10" />
      </div>

      {/* Ground - Changes color based on time of day */}
      <div className={clsx(
        "absolute bottom-0 left-0 right-0 h-6",
        isDayTime 
          ? "bg-gradient-to-b from-zinc-600 to-amber-700"
          : "bg-gradient-to-b from-zinc-800 to-zinc-900"
      )} />

      {/* Content overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto px-6 py-3 text-white">
          {children}
        </div>
      </div>

      {/* Keyframes */}
      <style jsx global>{`
        .z20{
          z-index:20;
        }
        @keyframes scrollX {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-66.666%);
          }
        }
        
        @keyframes twinkle {
          from {
            opacity: 0.2;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes wheel-roll {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        /* Motorcycle overtake animation */
        @keyframes overtake {
          0% {
            left: 20%;
          }
          30% {
            left: 45%;
          }
          50% {
            left: 80%;
          }
          80% {
            left: 45%;
          }
          100% {
            left: 20%;
          }
        }
        
        /* Cloud floating animation for day time */
        @keyframes float {
          0% {
            transform: translateX(-100px);
          }
          100% {
            transform: translateX(calc(100vw + 100px));
          }
        }
      `}</style>
    </div>
  );
};

// DeliveryTruck component (unchanged)
function DeliveryTruck({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <div className="relative">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={64}
        height={64}
        viewBox="0 0 64 64"
        className={clsx(className, "transform scale-x-[-1]")}
        {...props}
      >
        <path fill="#b2c1c0" d="M62 50.8c0-1-.8-1.9-1.9-1.9H3.9c-1 0-1.9.8-1.9 1.9v1.9c0 1 .8 1.9 1.9 1.9h56.2c1 0 1.9-.8 1.9-1.9z"></path>
        <g className="truck-wheel">
          <ellipse cx={12.3} cy={55.5} fill="#1a1a1a" rx={6.6} ry={6.5}></ellipse>
          <ellipse cx={12.3} cy={55.5} fill="#b2c1c0" rx={3.8} ry={3.7}></ellipse>
        </g>
        <g className="truck-wheel">
          <ellipse cx={50.8} cy={55.5} fill="#1a1a1a" rx={6.6} ry={6.5}></ellipse>
          <ellipse cx={50.8} cy={55.5} fill="#b2c1c0" rx={3.8} ry={3.7}></ellipse>
        </g>
        <path fill="#606262" d="M54.5 19H28.2c-3.1 0-5.6 2.5-5.6 5.6v24.3h37.5V24.6c0-3.1-2.5-5.6-5.6-5.6"></path>
        <path fill="#e3e3e3" d="M15.1 26.5c-4.5 0-5.6 0-5.6 7.5c0 5.6-5.6 5.6-5.6 11.2v3.7h18.8V26.5z"></path>
        <path fill="#ffce31" d="M5.8 43.3h1.9V47H5.8z"></path>
        <path fill="#cbc9c9" d="M12.8 39.6c-1.1 0-1.7.8-1.3 1.8l1.6 4c.4 1 1.6 1.7 2.7 1.7h3c1.1 0 2-.8 2-1.9v-3.7c0-1-.9-1.9-2-1.9z"></path>
        <g fill="#1a1a1a">
          <path d="M20.8 28.3h-7.5s-1.9.2-1.9 2.8v4.5s0 2.1 1.9 2.1h7.5z"></path>
          <circle cx={12.3} cy={51.7} r={0.9}></circle>
          <circle cx={9.1} cy={53.6} r={0.9}></circle>
          <path d="M8.6 56.5c.4-.3 1-.1 1.3.3s.1 1-.3 1.3s-1 .1-1.3-.3c-.3-.5-.2-1 .3-1.3"></path>
          <circle cx={12.3} cy={59.2} r={0.9}></circle>
          <circle cx={15.6} cy={57.3} r={0.9}></circle>
          <circle cx={15.6} cy={53.6} r={0.9}></circle>
        </g>
        <circle cx={12.3} cy={55.5} r={1.9} fill="#606262"></circle>
        <g fill="#1a1a1a">
          <circle cx={50.8} cy={51.7} r={0.9}></circle>
          <circle cx={47.5} cy={53.6} r={0.9}></circle>
          <path d="M47 56.5c.4-.3 1-.1 1.3.3s.1 1-.3 1.3s-1 .1-1.3-.3c-.3-.5-.1-1 .3-1.3"></path>
          <circle cx={50.8} cy={59.2} r={0.9}></circle>
          <circle cx={54} cy={57.3} r={0.9}></circle>
          <circle cx={54} cy={53.6} r={0.9}></circle>
        </g>
        <circle cx={50.8} cy={55.5} r={1.9} fill="#606262"></circle>
        <path fill="#fff" d="M28.4 32.7c-.5-.4-1.2-.6-2.2-.6c-.6 0-1.2 0-1.6.1v5.4c.3 0 .8.1 1.4.1c1.1 0 1.9-.3 2.5-.8c.5-.5.9-1.2.9-2.2c-.2-.9-.5-1.5-1-2m-2.3 4.2h-.6V33c.1 0 .4-.1.7-.1c1.3 0 2 .7 2 1.9c0 1.4-.8 2.1-2.1 2.1m7.1-1.7h-2.1v1.6h2.3v.8h-3.3v-5.5h3.2v.9h-2.2v1.4h2.1zm2.1 1.6v-4.7h-1v5.5h3.3v-.8zm3-4.7h1v5.5h-1zm5.4 0l-.8 2.5c-.2.7-.4 1.3-.6 2c-.1-.7-.3-1.3-.5-2l-.8-2.5h-1l1.8 5.5H43l1.9-5.5zm2.7 4.7v-1.6h2.1v-.8h-2.1V33h2.2v-.9h-3.2v5.5h3.3v-.8zm6.7-.7c-.1-.5-.4-.9-.8-1.1c.5-.2 1-.7 1-1.4c0-.5-.2-.8-.5-1.1c-.4-.3-.9-.4-1.7-.4c-.6 0-1.1 0-1.5.1v5.4h1v-2.3h.5c.6 0 .8.2 1 1c.2 7.3.1 1.1.4 1.3h1c-.1-.2-.2-.8-.4-1.5m-1.9-1.5h-.6v-1.7h.6c.7 0 1.1.3 1.1.9c0 .5-.4.8-1.1.8m5.9-2.5l-.7 1.4c-.2.4-.3.7-.5 1.1c-.1-.4-.3-.7-.5-1.1l-.7-1.4h-1.1l1.7 3.2v2.3h1v-2.3l1.8-3.2z"></path>
        <path fill="#1a1a1a" d="M27.3 30.2v-5.6c0-.5.4-.9.9-.9h26.2c.5 0 .9.4.9.9v5.6h1.9v-5.6c0-1.5-1.3-2.8-2.8-2.8H28.2c-1.6 0-2.8 1.3-2.8 2.8v5.6zm28.1 9.4v3.7c0 .5-.4.9-.9.9H28.2c-.5 0-.9-.4-.9-.9v-3.7h-1.9v3.7c0 1.5 1.3 2.8 2.8 2.8h26.2c1.6 0 2.8-1.3 2.8-2.8v-3.7z"></path>
        <g fill="#b2c1c0">
          <circle cx={29.2} cy={25.5} r={0.9}></circle>
          <circle cx={53.6} cy={25.5} r={0.9}></circle>
          <circle cx={29.2} cy={42.4} r={0.9}></circle>
          <circle cx={53.6} cy={42.4} r={0.9}></circle>
        </g>
        <path fill="#606262" d="M37.6 55.5c0 1-.8 1.9-1.9 1.9h-7.5c-1 0-1.9-.8-1.9-1.9v-1.9c0-1 .8-1.9 1.9-1.9h7.5c1 0 1.9.8 1.9 1.9z"></path>
        <path fill="#b2c1c0" d="M28.5 52.7c-.6 0-1.2.4-1.2.9s.5.9 1.2.9h7c.6 0 1.2-.4 1.2-.9s-.5-.9-1.2-.9z"></path>
      </svg>
       <style jsx>{`
        .knots {
          animation: wheel-roll 1.5s linear infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}

function ParallaxStrip({
  className,
  speedClass,
  buildingTone,
  heights,
  hasAntennas = false,
  detailLevel,
}: {
  className?: string;
  speedClass: string;
  buildingTone: string;
  heights: number[];
  hasAntennas?: boolean;
  detailLevel: "far" | "mid" | "near";
}) {
  return (
    <div className={clsx("absolute left-0 right-0", className)}>
      <div className={clsx("flex w-[300%]", speedClass)}>
        <BuildingsRow
          buildingTone={buildingTone}
          heights={heights}
          hasAntennas={hasAntennas}
          detailLevel={detailLevel}
        />
        <BuildingsRow
          buildingTone={buildingTone}
          heights={heights}
          hasAntennas={hasAntennas}
          detailLevel={detailLevel}
        />
        <BuildingsRow
          buildingTone={buildingTone}
          heights={heights}
          hasAntennas={hasAntennas}
          detailLevel={detailLevel}
        />
      </div>
    </div>
  );
}

function BuildingsRow({
  buildingTone,
  heights,
  hasAntennas,
  detailLevel,
}: {
  buildingTone: string;
  heights: number[];
  hasAntennas?: boolean;
  detailLevel: "far" | "mid" | "near";
}) {
  return (
    <div className="flex w-1/3 items-end gap-6 px-4">
      {heights.map((h, i) => (
        <div key={`${h}-${i}`} className="relative flex items-end">
          <div
            className={clsx(
              "relative w-10 rounded-t-sm bg-gradient-to-b shadow-md overflow-hidden",
              buildingTone
            )}
            style={{ height: `${h}px` }}
          >
            <div className="absolute inset-0 grid grid-cols-3 gap-1 p-1">
              {Array.from({ length: Math.floor(h / 12) * 3 }).map((_, w) => (
                <div
                  key={w}
                  className={clsx(
                    "h-1.5 w-1.5",
                    Math.random() > 0.6
                      ? "bg-sky-300 opacity-100 shadow-[0_0_2px_rgba(255,255,200,0.9)]"
                      : "bg-sky-900"
                  )}
                />
              ))}
            </div>
          </div>

          {hasAntennas && i % 2 === 0 && (
            <div className="absolute -top-4 left-1/2 h-4 w-[2px] -translate-x-1/2 bg-green-300/70">
              <div className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-green-200/90" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Tree() {
  return (
    <div className="relative w-8 h-8">
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-6 bg-amber-950"></div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-l from-lime-600 to-lime-950"></div>
    </div>
  );
}

function TreeAndStoreRow() {
  return (
    <div className="flex w-1/3 items-end justify-around">
      {Array.from({ length: 8 }).map((_, i) => {
        // Every 3rd item is a department store, others are trees
        if (i % 3 === 0) {
          return (
            <div key={i} className="relative flex items-end">
              <EmojioneDepartmentStore className="h-10 w-10" />
            </div>
          );
        }
        return <Tree key={i} />;
      })}
    </div>
  );
}

export default React.memo(AnimatedCrowd);
