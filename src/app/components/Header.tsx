// components/Header.tsx
"use client";
import React from 'react';
import Image from 'next/image';

const Header: React.FC = () => {
  return (
    <header className="relative bg-[url(`/Circuit.svg`)] bg-fill overflow-hidden">
      {/* Circuit Board Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        {/* Base PCB with green substrate */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-green-800/10"></div>
        
        {/* Circuit traces */}
        <div className="absolute top-1/4 w-full h-[2px] bg-green-400/60 animate-trace-flow"></div>
        <div className="absolute top-1/3 w-full h-[1px] bg-green-500/50 animate-trace-flow-slow"></div>
        <div className="absolute top-1/2 w-full h-[1px] bg-green-400/40 animate-trace-flow-medium"></div>
        <div className="absolute top-2/3 w-full h-[2px] bg-green-500/70 animate-trace-flow"></div>
        <div className="absolute top-3/4 w-full h-[1px] bg-green-400/60 animate-trace-flow-slow"></div>
        
        {/* Vertical traces */}
        <div className="absolute left-1/4 h-full w-[1px] bg-green-500/60 animate-trace-flow-vertical"></div>
        <div className="absolute left-1/2 h-full w-[2px] bg-green-400/70 animate-trace-flow-vertical-medium"></div>
        <div className="absolute left-3/4 h-full w-[1px] bg-green-500/50 animate-trace-flow-vertical-slow"></div>
        
        {/* Circuit nodes/connections */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-green-500/80 animate-node-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 rounded-full bg-green-400/70 animate-node-pulse-slow"></div>
        <div className="absolute top-1/3 left-1/2 w-3 h-3 rounded-full bg-green-500/80 animate-node-pulse"></div>
        <div className="absolute top-2/3 left-1/2 w-2 h-2 rounded-full bg-green-400/70 animate-node-pulse-medium"></div>
        <div className="absolute top-1/4 left-3/4 w-2 h-2 rounded-full bg-green-500/60 animate-node-pulse-slow"></div>
        <div className="absolute top-3/4 left-3/4 w-3 h-3 rounded-full bg-green-400/80 animate-node-pulse"></div>
        
        {/* IC components */}
        <div className="absolute top-2/5 left-1/5 w-16 h-8 bg-gray-700/50 border border-green-600/40 rounded-sm animate-chip-glow"></div>
        <div className="absolute top-3/5 left-3/5 w-12 h-6 bg-gray-700/50 border border-green-600/40 rounded-sm animate-chip-glow-slow"></div>
        
        {/* Subtle grid pattern for PCB */}
        <div className="absolute inset-0 opacity-10 bg-grid-green-500/30" style={{backgroundSize: '20px 20px'}}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center p-8">
        <div className="inline-block">
          <Image
            src="/Dlogo.svg"
            alt="Logo"
            height={80}
            width={160}
            className="h-20 w-40 mx-auto"
          />
        </div>
      </div>

      {/* Custom styles for animation */}
      <style jsx>{`
        @keyframes trace-flow {
          0% { opacity: 0.3; box-shadow: 0 0 5px rgba(72, 187, 120, 0); }
          50% { opacity: 0.8; box-shadow: 0 0 10px rgba(72, 187, 120, 0.5); }
          100% { opacity: 0.3; box-shadow: 0 0 5px rgba(72, 187, 120, 0); }
        }
        @keyframes trace-flow-slow {
          0% { opacity: 0.2; }
          50% { opacity: 0.5; }
          100% { opacity: 0.2; }
        }
        @keyframes trace-flow-medium {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
        @keyframes trace-flow-vertical {
          0% { opacity: 0.3; box-shadow: 0 0 5px rgba(72, 187, 120, 0); }
          50% { opacity: 0.8; box-shadow: 0 0 10px rgba(72, 187, 120, 0.5); }
          100% { opacity: 0.3; box-shadow: 0 0 5px rgba(72, 187, 120, 0); }
        }
        @keyframes trace-flow-vertical-medium {
          0% { opacity: 0.2; }
          50% { opacity: 0.6; }
          100% { opacity: 0.2; }
        }
        @keyframes trace-flow-vertical-slow {
          0% { opacity: 0.1; }
          50% { opacity: 0.4; }
          100% { opacity: 0.1; }
        }
        @keyframes node-pulse {
          0% { opacity: 0.3; transform: scale(0.95); box-shadow: 0 0 5px rgba(72, 187, 120, 0); }
          50% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 15px rgba(72, 187, 120, 0.8); }
          100% { opacity: 0.3; transform: scale(0.95); box-shadow: 0 0 5px rgba(72, 187, 120, 0); }
        }
        @keyframes node-pulse-medium {
          0% { opacity: 0.2; transform: scale(0.9); }
          50% { opacity: 0.8; transform: scale(1.05); }
          100% { opacity: 0.2; transform: scale(0.9); }
        }
        @keyframes node-pulse-slow {
          0% { opacity: 0.1; transform: scale(0.85); }
          50% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0.1; transform: scale(0.85); }
        }
        @keyframes chip-glow {
          0% { box-shadow: inset 0 0 5px rgba(72, 187, 120, 0.2), 0 0 5px rgba(72, 187, 120, 0); }
          50% { box-shadow: inset 0 0 10px rgba(72, 187, 120, 0.4), 0 0 10px rgba(72, 187, 120, 0.3); }
          100% { box-shadow: inset 0 0 5px rgba(72, 187, 120, 0.2), 0 0 5px rgba(72, 187, 120, 0); }
        }
        @keyframes chip-glow-slow {
          0% { box-shadow: inset 0 0 5px rgba(72, 187, 120, 0.1), 0 0 5px rgba(72, 187, 120, 0); }
          50% { box-shadow: inset 0 0 8px rgba(72, 187, 120, 0.3), 0 0 8px rgba(72, 187, 120, 0.2); }
          100% { box-shadow: inset 0 0 5px rgba(72, 187, 120, 0.1), 0 0 5px rgba(72, 187, 120, 0); }
        }
        .animate-trace-flow {
          animation: trace-flow 4s ease-in-out infinite;
        }
        .animate-trace-flow-slow {
          animation: trace-flow-slow 6s ease-in-out infinite;
        }
        .animate-trace-flow-medium {
          animation: trace-flow-medium 5s ease-in-out infinite;
        }
        .animate-trace-flow-vertical {
          animation: trace-flow-vertical 4s ease-in-out infinite;
        }
        .animate-trace-flow-vertical-medium {
          animation: trace-flow-vertical-medium 5s ease-in-out infinite;
        }
        .animate-trace-flow-vertical-slow {
          animation: trace-flow-vertical-slow 7s ease-in-out infinite;
        }
        .animate-node-pulse {
          animation: node-pulse 3s ease-in-out infinite;
        }
        .animate-node-pulse-medium {
          animation: node-pulse-medium 4s ease-in-out infinite;
        }
        .animate-node-pulse-slow {
          animation: node-pulse-slow 5s ease-in-out infinite;
        }
        .animate-chip-glow {
          animation: chip-glow 4s ease-in-out infinite;
        }
        .animate-chip-glow-slow {
          animation: chip-glow-slow 6s ease-in-out infinite;
        }
        .bg-grid-green-500\/30 {
          background-image: linear-gradient(to right, rgba(34, 197, 94, 0.3) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(34, 197, 94, 0.3) 1px, transparent 1px);
        }
      `}</style>
    </header>
  );
};

export default Header;
