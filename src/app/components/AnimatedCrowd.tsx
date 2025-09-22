"use client";
import React from "react";
import clsx from "clsx";
import type { SVGProps } from 'react';

// Motorcycle component (unchanged)
function EmojioneMotorcycle(props: SVGProps<SVGSVGElement>) {
  return (<svg xmlns="http://www.w3.org/2000/svg" width={64} height={64} viewBox="0 0 64 64" {...props}><path fill="#231f20" d="m31.4 31.4l-.5-6.3l-3.4.3l.5 5.5l-9.4 4.4l3.8 3s2.7-1.1 2.5-2l5.7-3.1c.7-.3 1-1.1.8-1.8"></path><path fill="#959595" d="M57 35.2L40.8 45.4l.9 1.2l16.9-8.1c0-1.2-.5-2.5-1.6-3.3"></path><g fill="#1a1a1a"><path d="m40.1 44.7l4.8-2.3s2.2 1.9-.2 4.1zm-28.7-1.5c-5.2 0-9.4 4.2-9.4 9.4S6.2 62 11.4 62s9.4-4.2 9.4-9.4s-4.2-9.4-9.4-9.4m0 16c-3.6 0-6.6-2.9-6.6-6.6c0-3.6 2.9-6.6 6.6-6.6c3.6 0 6.6 2.9 6.6 6.6c-.1 3.7-3 6.6-6.6 6.6"></path><path d="m18.4 52.2l-4.3-.3l3.6-2.4l-.5-.8l-3.8 1.9l1.8-3.9l-.7-.4l-2.4 3.5l-.3-4.2h-.9l-.3 4.2l-2.3-3.5l-.8.5l1.8 3.8l-3.8-1.8l-.4.7l3.5 2.4l-4.3.3v.9l4.3.3l-3.5 2.3l.4.8l3.8-1.8l-1.8 3.8l.8.4l2.3-3.5l.4 4.3h.8l.3-4.3l2.4 3.5l.8-.4l-1.9-3.8l3.8 1.8l.5-.8l-3.5-2.3l4.2-.3z"></path></g><path fill="#959595" d="M11.4 47.9c-2.6 0-4.7 2.1-4.7 4.7s2.1 4.7 4.7 4.7s4.7-2.1 4.7-4.7s-2.1-4.7-4.7-4.7m0 7.5c-1.6 0-2.8-1.3-2.8-2.8s1.3-2.8 2.8-2.8c1.6 0 2.8 1.3 2.8 2.8s-1.3 2.8-2.8 2.8"></path><path fill="#94989b" d="M35.8 42.1v6.3l16.4 6.9l1.8-5z"></path><path fill="#1a1a1a" d="M52.6 43.2c-5.2 0-9.4 4.2-9.4 9.4s4.2 9.4 9.4 9.4s9.4-4.2 9.4-9.4s-4.2-9.4-9.4-9.4m0 16c-3.6 0-6.6-2.9-6.6-6.6c0-3.6 2.9-6.6 6.6-6.6c3.6 0 6.6 2.9 6.6 6.6s-3 6.6-6.6 6.6"></path><path fill="#94989b" d="M13.9 35.7v2.8l14.6 2.1c-5.1-4.9-14.6-4.9-14.6-4.9"></path><path fill="#1a1a1a" d="M28.4 40.3L50.8 33l.9 5.3l-19.6 9.6z"></path><path fill="#007c17" d="m27.7 40.8l.2-2.7c0-.5.5-.9 1-1.1c1.5-.5 5.9-2.2 5.9-2.2l2.8 3.5z"></path><path fill="#1a1a1a" d="m11.4 53.3l8.3-11.9l-2.5-1.9l-6.4 13.1z"></path><path fill="#00ef5c" d="M19.4 46.2c-1.9-2.4-4.8-3.9-8-3.9c-2.5 0-4.8.9-6.5 2.3z"></path><path fill="#1a1a1a" d="m59.7 52.2l-4.3-.3l3.5-2.4l-.4-.8l-3.9 1.9l1.9-3.9l-.8-.4l-2.3 3.5l-.3-4.2h-.9l-.3 4.2l-2.4-3.5l-.8.5l1.9 3.8l-3.9-1.8l-.4.7l3.6 2.4l-4.3.3v.9l4.2.3l-3.5 2.3l.5.8l3.8-1.8l-1.9 3.8l.8.4l2.4-3.5l.3 4.3h.9l.3-4.3l2.4 3.5l.7-.4l-1.8-3.8l3.8 1.8l.4-.8l-3.5-2.3l4.3-.3z"></path><path fill="#959595" d="M52.6 47.9c-2.6 0-4.7 2.1-4.7 4.7s2.1 4.7 4.7 4.7s4.7-2.1 4.7-4.7s-2.1-4.7-4.7-4.7m0 7.5c-1.6 0-2.8-1.3-2.8-2.8s1.3-2.8 2.8-2.8s2.8 1.3 2.8 2.8s-1.2 2.8-2.8 2.8"></path><path fill="#007c17" d="M44.9 38.4c-1.7.8-1.6 2.4-1.6 2.4s5.2-.3 11.8-3.9c3.2-1.8 3.2-5.6 3.2-5.6c-11.4-.2-8.1 4.4-13.4 7.1m-3.1 9.3c-5.1 0-5.5-4.5-10.3-6.3c-6-2.3-14.8-3.3-16.4-3.3c-1.7 0-.4-1.9 0-2.4c3.4-4 7.8-3.3 7.8-3.3l-1.4-1.3c-4.2 0-7.9 2.1-10.1 5.3c-.9 1.3-2.3 3.1-1.5 3.6c2 1.4 8.1 5.4 8.1 5.4s2.4 1.6 2.8 2.4c.9 1.6 1 8 1 8c0 .7.5 1.4 1.4 1.3l18.4-2.5c-.5-1.3-.8-3.6.2-6.9"></path><path fill="#c5c5c5" d="M11.4 39h2.5l-.8 2s-3.6-2-1.7-2"></path><path fill="#666c70" d="M30.1 48c-1.9-.5-3.8.6-4.3 2.5l8.2 2.1c.9.2 1.9-.3 2.1-1.2l.4-1.7z"></path><path fill="#231f20" d="m48 28.4l-13.8 5.8l-3.5 13.9l5.8 1.5l3.4-11.2s5.6-2.4 7.1-3.6c1.3-1.1 2.9-3.6 1-6.4"></path><path fill="#1a1a1a" d="M48 28.4s-8.2-8.7-16.2-8.5l-6.1 4.8l.5 5.5l-4.8 2.6l1.6 2.9l5.8-3.1c.7-.4.9-1 .9-1.9c-.1-.7-.2-2.8-.2-2.8l6.6 5.8z"></path><path fill="#666c70" d="m22.5 34.2l-.6-1.5c-.2-.5-.9-.8-1.4-.5l-.7.3c-.5.1-.8.5-.8.9c-1 .5-2.1 1.4-1.3 3.2c.1.3.8 1.9 2.8 1.1c2.9-1.3 2.9-1.3 2-3.5"></path><path fill="#007c17" d="M37.3 13.5c0 6.3-1.8 6.1-11.5 11.5c-3.2 1.8-7.7 1.8-9.8-5.6c-.7-2.4-1.6-3.2-1.6-5.8C14.4 7.1 19.5 2 25.9 2c6.3 0 11.4 5.1 11.4 11.5"></path><path fill="#1a1a1a" d="M28.5 13.2c.7 1.9-7.5 6.6-12.5 8.4c-1.2.5-3.7-6.3-2.5-6.7c5-1.9 14.3-3.6 15-1.7"></path><circle cx={28.2} cy={12.9} r={2} fill="#94989b"></circle></svg>);
}

const AnimatedCrowd = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={clsx(
        "relative w-[100%] overflow-hidden aspect-[3/1] sm:aspect-[9/1] fixed l-0 r-0 m-auto",
        "bg-gradient-to-b from-sky-300 via-sky-200 to-indigo-100",
        className
      )}
    >
      
      {/* STAR FIELD */}
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

      {/* GLOWING MOON */}
      <div className="absolute top-6 right-6 w-12 h-12">
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-amber-50 to-amber-100"></div>
        <div
          className="absolute inset-0 rounded-full bg-zinc-200/30 animate-ping"
          style={{ animationDuration: "5s" }}
        ></div>
        <div className="absolute inset-0 rounded-full shadow-[0_0_25px_10px_rgba(255,255,200,0.4)]"></div>
      </div>

      {/* FAR skyline - 3 copies for seamless looping */}
      <ParallaxStrip
        className="bottom-2 opacity-100"
        speedClass="animate-[scrollX_70s_linear_infinite] will-change-transform transform-gpu"
        buildingTone="from-zinc-500 to-zinc-600"
        heights={[30, 40, 35, 45]}
        detailLevel="far"
      />

      {/* MID skyline - 3 copies for seamless looping */}
      <ParallaxStrip
        className="bottom-2 opacity-100"
        speedClass="animate-[scrollX_45s_linear_infinite] will-change-transform transform-gpu"
        buildingTone="from-blue-600 to-blue-700"
        heights={[50, 60, 55, 65]}
        detailLevel="mid"
      />

      {/* NEAR skyline - 3 copies for seamless looping */}
      <ParallaxStrip
        className="bottom-2 opacity-100"
        speedClass="animate-[scrollX_25s_linear_infinite] will-change-transform transform-gpu"
        buildingTone="from-blue-700 to-blue-800"
        heights={[60, 75, 65, 90]}
        hasAntennas
        detailLevel="near"
      />

      {/* Moving Trees - Fixed spacing and infinite scrolling */}
      <div className="absolute bottom-4 left-0 right-0 h-8">
        <div
          className={clsx(
            "absolute left-0 top-0 w-[300%]",
            "animate-[scrollX_15s_linear_infinite] will-change-transform transform-gpu"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex w-full">
            <TreeRow />
            <TreeRow />
            <TreeRow />
          </div>
        </div>
      </div>

      {/* Motorcycle - Animated to overtake the truck */}
      <div 
        className="absolute animate-overtake z-20"
        style={{ 
          bottom: '0.7rem',
          animation: 'overtake 8s infinite linear'
        }}
      >
        <EmojioneMotorcycle className="h-14 w-14 transform scale-x-[-1]" />
      </div>

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-zinc-700 to-zinc-900" />

      {/* Content overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto px-6 py-3 text-white">
          {children}
        </div>
      </div>

      {/* Keyframes */}
      <style jsx global>{`
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
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-l from-lime-700 to-lime-900"></div>
    </div>
  );
}

function TreeRow() {
  return (
    <div className="flex w-1/3 items-end justify-around">
      {Array.from({ length: 8 }).map((_, i) => (
        <Tree key={i} />
      ))}
    </div>
  );
}

export default React.memo(AnimatedCrowd);
