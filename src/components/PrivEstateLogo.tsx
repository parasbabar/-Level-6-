import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface PrivEstateLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  className?: string;
  showTagline?: boolean;
  animate?: boolean;
}

export const PrivEstateLogo: React.FC<PrivEstateLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  animate = true,
  className = '',
}) => {
  const reduced = useReducedMotion();
  const shouldAnimate = animate && !reduced;

  const dim =
    typeof size === 'number' ? size
    : size === 'xs' ? 22
    : size === 'sm' ? 28
    : size === 'lg' ? 42
    : size === 'xl' ? 56
    : 34;

  const textSize =
    typeof size === 'number' ? size * 0.47
    : size === 'xs' ? 11
    : size === 'sm' ? 13
    : size === 'lg' ? 19
    : size === 'xl' ? 24
    : 15;

  const taglineSize = Math.max(8, textSize * 0.58);
  const uid = React.useId().replace(/:/g, '');

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`} style={{ lineHeight: 1 }}>
      <div className="relative flex-shrink-0" style={{ width: dim, height: dim }}>
        {shouldAnimate ? (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(74,222,40,0.35) 0%, rgba(34,211,238,0.20) 50%, transparent 75%)', filter: 'blur(6px)', transform: 'scale(1.4)' }}
            animate={{ opacity: [0.55, 0.9, 0.55], scale: [1.35, 1.55, 1.35] }}
            transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
          />
        ) : (
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(74,222,40,0.28) 0%, transparent 70%)', filter: 'blur(5px)', transform: 'scale(1.4)' }} />
        )}

        <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="PrivEstate logo" role="img" style={{ position: 'relative', zIndex: 1 }}>
          <defs>
            <linearGradient id={`gm-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade28" />
              <stop offset="48%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id={`gf-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#0f2a1a" />
              <stop offset="100%" stopColor="#080d0f" />
            </linearGradient>
            <linearGradient id={`gc-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#4ade28" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#22D3EE" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id={`gk-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <radialGradient id={`gi-${uid}`} cx="50%" cy="35%" r="50%">
              <stop offset="0%" stopColor="#4ade28" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#4ade28" stopOpacity="0" />
            </radialGradient>
            <clipPath id={`cs-${uid}`}>
              <path d="M24 3.5 L41 9.5 V22C41 33 34 40 24 44C14 40 7 33 7 22V9.5Z" />
            </clipPath>
          </defs>

          {/* Shield fill */}
          <path d="M24 3.5 L41 9.5 V22C41 33 34 40 24 44C14 40 7 33 7 22V9.5Z" fill={`url(#gf-${uid})`} />
          <path d="M24 3.5 L41 9.5 V22C41 33 34 40 24 44C14 40 7 33 7 22V9.5Z" fill={`url(#gi-${uid})`} />
          {/* Shield gradient border */}
          <path d="M24 3.5 L41 9.5 V22C41 33 34 40 24 44C14 40 7 33 7 22V9.5Z" fill="none" stroke={`url(#gm-${uid})`} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />

          {/* City skyline clipped inside shield */}
          <g clipPath={`url(#cs-${uid})`} opacity="0.95">
            <rect x="9"  y="28" width="4"   height="16" rx="0.4" fill={`url(#gc-${uid})`} opacity="0.5" />
            <rect x="13" y="22" width="5"   height="22" rx="0.5" fill={`url(#gc-${uid})`} opacity="0.65" />
            <rect x="14.5" y="24" width="2" height="2" rx="0.3" fill="#22D3EE" opacity="0.7" />
            <rect x="14.5" y="28" width="2" height="2" rx="0.3" fill="#22D3EE" opacity="0.4" />
            <rect x="18.5" y="16" width="5.5" height="28" rx="0.6" fill={`url(#gc-${uid})`} />
            <rect x="21" y="12" width="1" height="5" rx="0.3" fill="#4ade28" opacity="0.9" />
            <circle cx="21.5" cy="12" r="0.9" fill="#4ade28" />
            <rect x="24.5" y="20" width="5"   height="24" rx="0.5" fill={`url(#gc-${uid})`} opacity="0.75" />
            <rect x="25.5" y="22" width="2" height="2" rx="0.3" fill="#4ade28" opacity="0.6" />
            <rect x="30" y="25" width="4.5" height="19" rx="0.4" fill={`url(#gc-${uid})`} opacity="0.55" />
            <rect x="31" y="27" width="1.5" height="1.5" rx="0.3" fill="#22D3EE" opacity="0.5" />
            <rect x="35" y="30" width="3.5" height="14" rx="0.4" fill={`url(#gc-${uid})`} opacity="0.4" />
            <rect x="7" y="43" width="34" height="1.5" rx="0.5" fill="#4ade28" opacity="0.25" />
          </g>

          {/* ZK Keyhole */}
          <circle cx="24" cy="24" r="5" fill="rgba(5,8,5,0.85)" stroke={`url(#gk-${uid})`} strokeWidth="1.5" />
          <path d="M21.8 27.5 L22.5 33 H25.5 L26.2 27.5" fill={`url(#gk-${uid})`} strokeLinejoin="round" />

          {/* Corner accent dots */}
          <circle cx="11" cy="13" r="1.1" fill="#22D3EE" opacity="0.8" />
          <circle cx="37" cy="13" r="1.1" fill="#8B5CF6" opacity="0.8" />
          <circle cx="24" cy="43" r="1"   fill="#4ade28" opacity="0.8" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span style={{ fontFamily: 'var(--font-display, "Inter", sans-serif)', fontSize: textSize, fontWeight: 800, letterSpacing: '-0.025em', color: '#ffffff', lineHeight: 1 }}>
            Priv
            <span style={{ background: 'linear-gradient(90deg, #4ade28 0%, #22D3EE 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Estate
            </span>
          </span>
          {showTagline && (
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: taglineSize, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#22D3EE', opacity: 0.75, marginTop: 2, lineHeight: 1 }}>
              Shielded RWA · Midnight
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivEstateLogo;
