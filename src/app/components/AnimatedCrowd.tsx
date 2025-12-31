"use client";
import React, { useEffect, useState } from "react";
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

// Check if it's December
function useIsDecember() {
  const [isDecember, setIsDecember] = useState(false);
  
  useEffect(() => {
    const checkMonth = () => {
      const now = new Date();
      const currentMonth = now.getMonth(); // 0 = January, 11 = December
      setIsDecember(currentMonth === 11); // December is month 11
    };
    
    checkMonth();
    // Check at the start of each hour to catch month changes
    const interval = setInterval(checkMonth, 3600000);
    
    return () => clearInterval(interval);
  }, []);
  
  return isDecember;
}

// Fireworks Particle Component - DOUBLE SIZE
function FireworkParticle({ 
  x, 
  y, 
  color,
  size 
}: { 
  x: number; 
  y: number; 
  color: string;
  size: number;
}) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size * 2}px`, // DOUBLE SIZE
        height: `${size * 2}px`, // DOUBLE SIZE
        background: color,
        boxShadow: `0 0 ${size * 4}px ${size * 2}px ${color}40`, // DOUBLE SIZE
        animation: `particleExplode 1.5s ease-out forwards`,
        opacity: 0,
      }}
    />
  );
}

// Firework Burst Component - INFINITE LOOP
function FireworkBurst({ 
  id,
  isDecember 
}: { 
  id: number;
  isDecember: boolean;
}) {
  const [isExploding, setIsExploding] = useState(false);
  const [particles, setParticles] = useState<Array<{
    x: number;
    y: number;
    color: string;
    size: number;
  }>>([]);

  const colors = [
    '#FF5252', // Red
    '#FF4081', // Pink
    '#E040FB', // Purple
    '#7C4DFF', // Deep Purple
    '#536DFE', // Indigo
    '#448AFF', // Blue
    '#40C4FF', // Light Blue
    '#18FFFF', // Cyan
    '#64FFDA', // Teal
    '#69F0AE', // Green
    '#B2FF59', // Light Green
    '#EEFF41', // Yellow
    '#FFFF00', // Yellow
    '#FFD740', // Amber
    '#FFAB40', // Orange
    '#FF6E40', // Deep Orange
  ];

  useEffect(() => {
    if (!isDecember) return;

    const createExplosion = () => {
      setIsExploding(true);
      
      // Create particles with DOUBLE SIZE
      const particleCount = 30 + Math.floor(Math.random() * 20);
      const newParticles = [];
      const centerX = 50 + (Math.random() * 20 - 10);
      const centerY = 30 + (Math.random() * 10);
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        const distance = speed * 40;
        
        newParticles.push({
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: (2 + Math.random() * 3) * 2, // DOUBLE SIZE
        });
      }
      
      setParticles(newParticles);
      
      // Reset and create next explosion - INFINITE LOOP
      setTimeout(() => {
        setIsExploding(false);
        setParticles([]);
        
        // Schedule next explosion with random delay
        const nextDelay = 500 + Math.random() * 3000; // Shorter delay for more frequent fireworks
        setTimeout(createExplosion, nextDelay);
      }, 2000);
    };

    // Initial explosion with random delay
    const initialDelay = Math.random() * 3000;
    const timer = setTimeout(createExplosion, initialDelay);

    return () => clearTimeout(timer);
  }, [isDecember]);

  if (!isDecember || !isExploding) return null;

  return (
    <>
      <div
        className="absolute rounded-full"
        style={{
          left: `${50 + (Math.random() * 20 - 10)}%`,
          top: '30%',
          width: '16px', // DOUBLE SIZE from 8px
          height: '16px', // DOUBLE SIZE from 8px
          background: colors[Math.floor(Math.random() * colors.length)],
          animation: `fireworkRise 1s ease-out forwards`,
          opacity: 0,
        }}
      />
      {particles.map((particle, index) => (
        <FireworkParticle key={index} {...particle} />
      ))}
    </>
  );
}

// Animated Fireworks Display
function FireworksDisplay({ isDecember }: { isDecember: boolean }) {
  if (!isDecember) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 15 }).map((_, i) => (
        <FireworkBurst key={i} id={i} isDecember={isDecember} />
      ))}
    </div>
  );
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
      <path fill={currentColors.accent1} d="M59 56c0 .5-.5 0-1 1H26c-.5 0-1-.5-1-1v-2c0-.5.5-1 1-1h32c.5 0 1 .5 1 1z"></path>
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
  const isDecember = useIsDecember(); // Check if it's December
  
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
      {/* FIREWORKS DISPLAY - Only show in December */}
      <FireworksDisplay isDecember={isDecember} />

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
        buildingTone={isDayTime ? "from-gray-500 to-gray-600" : "from-indigo-900 to-black-950"}
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
        buildingTone={isDayTime ? "from-gray-300 to-gray-400" : "from-indigo-900 to-indigo-950"}
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
            <TreeAndStoreRow isDayTime={isDayTime} />
            <TreeAndStoreRow isDayTime={isDayTime} />
            <TreeAndStoreRow isDayTime={isDayTime} />
          </div>
        </div>
      </div>

      {/* Ground - Changes color based on time of day */}
      <div className={clsx(
        "absolute bottom-0 left-0 right-0 h-6",
        isDayTime 
          ? "bg-gradient-to-b from-zinc-600 to-zinc-700"
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
        
        /* Fireworks animations */
        @keyframes fireworkRise {
          0% {
            transform: translateY(100%) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
        }
        
        @keyframes particleExplode {
          0% {
            transform: translate(0, 0) scale(0);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx, 0), var(--ty, 0)) scale(1);
            opacity: 0;
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

function Tree({ isDayTime }: { isDayTime: boolean }) {
  return (
    <div className="relative w-8 h-8">
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-6 bg-amber-950"></div>
      <div 
        className={clsx(
          "absolute bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full",
          isDayTime 
            ? "bg-gradient-to-l from-lime-400 to-lime-600" 
            : "bg-gradient-to-l from-lime-600 to-lime-950"
        )}
      ></div>
    </div>
  );
}

function TreeAndStoreRow({ isDayTime }: { isDayTime: boolean }) {
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
        return <Tree key={i} isDayTime={isDayTime} />;
      })}
    </div>
  );
}

export default React.memo(AnimatedCrowd);
