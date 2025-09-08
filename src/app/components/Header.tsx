// components/Header.tsx
import React from 'react';
import Image from 'next/image';

const Header: React.FC = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
      {/* Animated Circuit Board Background */}
      <div className="absolute inset-0 z-0 opacity-30">
        {/* Horizontal circuit lines */}
        <div className="absolute top-1/4 w-full h-[1px] bg-green-500 animate-pulse-circuit"></div>
        <div className="absolute top-2/4 w-full h-[1px] bg-blue-500 animate-pulse-circuit"></div>
        <div className="absolute top-3/4 w-full h-[1px] bg-purple-500 animate-pulse-circuit"></div>
        
        {/* Vertical circuit lines */}
        <div className="absolute left-1/4 h-full w-[1px] bg-green-500 animate-pulse-circuit"></div>
        <div className="absolute left-2/4 h-full w-[1px] bg-blue-500 animate-pulse-circuit"></div>
        <div className="absolute left-3/4 h-full w-[1px] bg-purple-500 animate-pulse-circuit"></div>
        
        {/* Circuit nodes */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-green-500 animate-ping"></div>
        <div className="absolute top-2/4 left-2/4 w-4 h-4 rounded-full bg-blue-500 animate-ping"></div>
        <div className="absolute top-3/4 left-3/4 w-4 h-4 rounded-full bg-purple-500 animate-ping"></div>
        
        {/* Diagonal connections */}
        <div className="absolute top-1/3 left-1/4 w-40 h-[1px] bg-green-500 rotate-45 animate-pulse-circuit"></div>
        <div className="absolute top-2/3 left-2/4 w-40 h-[1px] bg-blue-500 -rotate-45 animate-pulse-circuit"></div>
      </div>

      {/* Content */}
      <div className="text-center p-4 z-10">
        <Image
          src="/Dlogo.svg"
          alt="Logo"
          height={80}
          width={160}
          className="h-20 w-40 mx-auto"
        />
        <h1 className="text-4xl font-bold text-white mt-6">Welcome to Our Platform</h1>
        <p className="text-xl text-gray-300 mt-4">Next-generation technology solutions</p>
      </div>

      {/* Custom styles for animation */}
      <style jsx>{`
        @keyframes pulse-circuit {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        .animate-pulse-circuit {
          animation: pulse-circuit 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Header;
