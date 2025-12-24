
import React from 'react';

export const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[75%] h-[75%] drop-shadow-md">
        {/* Left vertical bars */}
        <rect x="10" y="25" width="12" height="50" rx="6" fill="white" fillOpacity="0.95" />
        <rect x="28" y="25" width="12" height="50" rx="6" fill="white" fillOpacity="0.8" />
        
        {/* Diagonal bar starting from top of second bar */}
        <path d="M28 25 L65 65" stroke="white" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.85" />
        
        {/* Separate Upward Arrow on the right */}
        <path d="M82 65 V20 M68 35 L82 20 L96 35" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="1" />
      </svg>
    </div>
  );
};

export default Logo;
