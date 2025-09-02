import React from "react";

interface LuxuryTabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const LuxuryTab: React.FC<LuxuryTabProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-6 py-3 rounded-full font-semibold text-sm md:text-base transition-all duration-300
        ${
          isActive
            ? "text-black bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30"
            : "text-white hover:text-yellow-200 hover:bg-white/5"
        }
        transform ${isActive ? "scale-105" : "scale-100"}
        overflow-hidden group
      `}
    >
      {isActive && (
        <span className="absolute inset-0 bg-white/20 animate-pulse"></span>
      )}
      <span className="relative z-10">{label}</span>

      {/* Hover effect */}
      <span
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                    -translate-x-full group-hover:translate-x-full transition-transform duration-700"
      ></span>
    </button>
  );
};

export default LuxuryTab;
