// components/AnimatedCrowd.js
import React from 'react';

const AnimatedCrowd = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-300 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-800 mb-8">Animated Crowd</h1>
      
      <div className="relative w-full max-w-6xl h-96 border-b-4 border-green-700 overflow-hidden">
        {/* Far Layer - Small, Slow Moving */}
        <div className="absolute bottom-0 w-full h-1/3 opacity-80">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 animate-walk-slow"
              style={{
                left: `${(i * 15) - 10}%`,
                animationDelay: `${i * 0.7}s`,
              }}
            >
              <div className="w-4 h-8 bg-blue-500 rounded-t-full"></div>
              <div className="w-6 h-2 bg-blue-600 rounded-full -mt-1 mx-auto"></div>
            </div>
          ))}
        </div>

        {/* Middle Layer - Medium Size, Medium Speed */}
        <div className="absolute bottom-0 w-full h-1/3 opacity-90">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 animate-walk-medium"
              style={{
                left: `${(i * 20) - 10}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <div className="w-6 h-12 bg-green-500 rounded-t-full"></div>
              <div className="w-8 h-3 bg-green-600 rounded-full -mt-1 mx-auto"></div>
            </div>
          ))}
        </div>

        {/* Front Layer - Large, Fast Moving */}
        <div className="absolute bottom-0 w-full h-1/3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 animate-walk-fast"
              style={{
                left: `${(i * 25) - 10}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            >
              <div className="w-8 h-16 bg-red-500 rounded-t-full"></div>
              <div className="w-10 h-4 bg-red-600 rounded-full -mt-1 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center max-w-2xl">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4">Crowd Animation</h2>
        <p className="text-blue-700 mb-6">
          This component demonstrates a 3-layer crowd animation using Tailwind CSS. The animation uses
          different speeds for each layer to create a parallax effect, with the front layer moving fastest
          and the far layer moving slowest.
        </p>
        <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Technical Details</h3>
          <ul className="text-blue-700 text-left list-disc list-inside">
            <li>Built with Next.js and Tailwind CSS</li>
            <li>Uses CSS keyframes for smooth animation</li>
            <li>Responsive design that works on all screen sizes</li>
            <li>Pure CSS solution - no JavaScript required for animation</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        @keyframes walk {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(calc(100vw + 100px)); }
        }
        .animate-walk-slow {
          animation: walk 40s linear infinite;
        }
        .animate-walk-medium {
          animation: walk 30s linear infinite;
        }
        .animate-walk-fast {
          animation: walk 20s linear infinite;
        }
        @media (max-width: 768px) {
          .animate-walk-slow {
            animation-duration: 30s;
          }
          .animate-walk-medium {
            animation-duration: 20s;
          }
          .animate-walk-fast {
            animation-duration: 15s;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedCrowd;
