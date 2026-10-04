import React from 'react';

/**
 * Professional, developer-grade geometric logo for AssetForge.
 * Designed to look like genuine cloud/industrial infrastructure (AWS / HashiCorp style),
 * completely devoid of generic AI sparkles or gradient spheres.
 */
export default function Logo({ size = 'md', inverted = false, showTag = true }) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl'
  };

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Precision Engineered Isometric Storage Mark */}
      <svg
        className={`${iconSizes[size] || iconSizes.md} shrink-0`}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="AssetForge Logo"
      >
        {/* Isometric Cube Base - Industrial Layered Storage */}
        {/* Top Face - AWS Signature Amber / Orange */}
        <path
          d="M18 3L32 10.5L18 18L4 10.5L18 3Z"
          fill="#EC7211"
        />
        {/* Left Face - Technical Dark Slate */}
        <path
          d="M4 10.5L18 18V33L4 25.5V10.5Z"
          fill="#1E293B"
        />
        {/* Right Face - Steel Slate */}
        <path
          d="M18 18L32 10.5V25.5L18 33V18Z"
          fill="#334155"
        />
        {/* Inner Precision Aperture Geometry (Image Storage & Processing) */}
        <path
          d="M18 9L25 12.75L18 16.5L11 12.75L18 9Z"
          fill="#FFFFFF"
          fillOpacity="0.9"
        />
        <path
          d="M18 19.5V28.5L27 23.5V14.5L18 19.5Z"
          fill="#FFFFFF"
          fillOpacity="0.2"
        />
        <path
          d="M18 19.5L9 14.5V23.5L18 28.5V19.5Z"
          fill="#FFFFFF"
          fillOpacity="0.4"
        />
        {/* Dynamic transformation focal beam */}
        <circle cx="18" cy="12.75" r="2" fill="#EC7211" />
      </svg>

      {/* Brand Text */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold tracking-tight ${textSizes[size] || textSizes.md} ${
              inverted ? 'text-white' : 'text-slate-900'
            }`}
          >
            Asset<span className="text-[#ec7211] font-extrabold">Forge</span>
          </span>
          {showTag && (
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold tracking-wider uppercase ${
                inverted
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              v2.0
            </span>
          )}
        </div>
        <span
          className={`text-[10px] font-medium tracking-wide uppercase ${
            inverted ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Image Infrastructure
        </span>
      </div>
    </div>
  );
}
