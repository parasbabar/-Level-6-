import React from 'react';

interface PrivEstateLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export const PrivEstateLogo: React.FC<PrivEstateLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showSubtitle = true,
  className = '',
}) => {
  const iconDimensions = {
    sm: { box: 28, radius: 8, stroke: 1.5, markSize: 'text-base', subSize: 'text-[9px]' },
    md: { box: 38, radius: 10, stroke: 1.8, markSize: 'text-lg', subSize: 'text-[10px]' },
    lg: { box: 48, radius: 13, stroke: 2, markSize: 'text-2xl', subSize: 'text-xs' },
    xl: { box: 64, radius: 16, stroke: 2.2, markSize: 'text-3xl', subSize: 'text-sm' },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon Mark */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center transition-transform duration-300 hover:scale-105"
        style={{ width: iconDimensions.box, height: iconDimensions.box }}
      >
        <svg
          viewBox="0 0 64 64"
          width={iconDimensions.box}
          height={iconDimensions.box}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          <defs>
            <linearGradient id="logo-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="50%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
            <linearGradient id="logo-accent-shield" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="logo-glow-diamond" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#a7f3d0" />
            </linearGradient>
          </defs>

          {/* Rounded Background Plate */}
          <rect
            width="64"
            height="64"
            rx="16"
            fill="url(#logo-bg-grad)"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Shield Outline */}
          <path
            d="M32 8L50 16V31C50 43.5 32 55 32 55C32 55 14 43.5 14 31V16L32 8Z"
            stroke="url(#logo-accent-shield)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="rgba(15, 23, 42, 0.65)"
          />

          {/* Left Architectural Facet (P-Monogram Silhouette) */}
          <path
            d="M23 41V23L32 17.5V36L23 41Z"
            fill="rgba(99, 102, 241, 0.28)"
            stroke="#818cf8"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />

          {/* Right Architectural Facet (E-Monogram Silhouette) */}
          <path
            d="M32 17.5L41 23V41L32 36V17.5Z"
            fill="rgba(16, 185, 129, 0.28)"
            stroke="#34d399"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />

          {/* Architectural Horizontal Cantilevers */}
          <path
            d="M32 23.5H39M32 29H38M32 34.5H39"
            stroke="#a7f3d0"
            strokeWidth="1.75"
            strokeLinecap="round"
          />

          {/* ZK Core Diamond Key */}
          <polygon
            points="32,27 34.5,31 32,35 29.5,31"
            fill="url(#logo-glow-diamond)"
          />
        </svg>
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-extrabold tracking-tight text-white ${iconDimensions.markSize}`}>
              Priv<span className="text-emerald-400">Estate</span>
            </span>
          </div>
          {showSubtitle && (
            <span className={`text-slate-400 font-medium tracking-wide mt-0.5 ${iconDimensions.subSize}`}>
              Private ownership. Verifiable real estate.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
