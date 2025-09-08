// components/Header.tsx
"use client";
import React from 'react';
import Image from 'next/image';

const Header: React.FC = () => {
  return (
    <header className="relative overflow-hidden">


      {/* Content */}
      <div className="relative z-10 text-center p-4">
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
    </header>
  );
};

export default Header;
