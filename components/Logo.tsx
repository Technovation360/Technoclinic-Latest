import React from 'react';

export const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = "" }) => {
  return (
    <div className={`position-relative d-flex align-items-center justify-content-center overflow-hidden rounded-4 shadow-sm ${className}`} 
         style={{ 
           width: size, 
           height: size, 
           background: 'linear-gradient(135deg, #0dcaf0 0%, #0d6efd 100%)' 
         }}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '75%', height: '75%' }}>
        <rect x="10" y="25" width="12" height="50" rx="6" fill="white" fillOpacity="0.95" />
        <rect x="28" y="25" width="12" height="50" rx="6" fill="white" fillOpacity="0.8" />
        <path d="M28 25 L65 65" stroke="white" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.85" />
        <path d="M82 65 V20 M68 35 L82 20 L96 35" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="1" />
      </svg>
    </div>
  );
};

export default Logo;