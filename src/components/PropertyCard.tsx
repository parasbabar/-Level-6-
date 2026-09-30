import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  TrendingUp, 
  RotateCw, 
  DollarSign, 
  Lock, 
  Key, 
  Coins,
  ShoppingBag,
  ArrowRight,
  PieChart
} from 'lucide-react';
import { PropertyMetadata, InvestorPrivateHolding } from '../utils/contract';

// ── Motion Tokens & Spring Config ───────────────────────────────────────────────
const FLIP_SPRING = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 26,
  mass: 1,
};

const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

// ── Animated Count-Up Hook ──────────────────────────────────────────────────────
function useCountUp(target: number, duration: number = 800) {
  const [current, setCurrent] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setCurrent(target);
      return;
    }
    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(eased * target));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrent(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration, prefersReducedMotion]);

  return current;
}

// ── Component Props ─────────────────────────────────────────────────────────────
interface PropertyCardProps {
  property: PropertyMetadata;
  holding?: InvestorPrivateHolding;
  isFlipped: boolean;
  onFlip: () => void;
  onPurchase: () => void;
  onOwnershipProof: () => void;
  onComplianceProof: () => void;
  onRentalProof: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  holding,
  isFlipped,
  onFlip,
  onPurchase,
  onOwnershipProof,
  onComplianceProof,
  onRentalProof,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse spotlight coordinates
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
      e.preventDefault();
      onFlip();
    }
  };

  // Derived progress values
  const total = Number(property.totalShares) || 1;
  const acquired = Number(property.acquiredShares) || 0;
  const available = Number(property.availableShares) || 0;
  const pctAcquired = Math.min(100, Math.max(0, (acquired / total) * 100));
  const isSoldOut = available === 0;

  const animatedValuation = useCountUp(property.totalValuationUsd, 800);

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      role="region"
      aria-label={`Property card for ${property.name}`}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[540px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7CFF3A]/60 rounded-3xl group select-none cursor-default"
      style={{ perspective: 1200 }}
    >
      {/* 3D Transform Container */}
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={
          prefersReducedMotion
            ? {}
            : {
                rotateY: isFlipped ? 180 : 0,
              }
        }
        transition={FLIP_SPRING}
      >
        {/* ── FRONT FACE ──────────────────────────────────────────────────── */}
        <div
          className={`absolute inset-0 w-full h-full rounded-3xl border border-white/10 bg-[#0a0f0a]/90 backdrop-blur-2xl overflow-hidden flex flex-col justify-between p-5 transition-all duration-300 ${
            isHovered 
              ? 'border-[#7CFF3A]/40 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_35px_rgba(124,255,58,0.18)]' 
              : 'shadow-[0_12px_36px_rgba(0,0,0,0.6)]'
          } ${prefersReducedMotion && isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Green cursor spotlight effect */}
          {isHovered && (
            <div
              className="pointer-events-none absolute -inset-px rounded-3xl opacity-70 transition-opacity duration-300"
              style={{
                background: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(124, 255, 58, 0.12), transparent 75%)`,
              }}
            />
          )}

          {/* Top Section: Media & Badges */}
          <div className="flex flex-col gap-3.5">
            {/* Image container */}
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-inner group-hover:border-white/20 transition-all">
              <img
                src={property.imageUrl}
                alt={property.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Status / Asset Type Badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2 items-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-white/20 text-white/90 text-xs font-semibold backdrop-blur-md shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7CFF3A] animate-pulse" />
                  {property.assetType || 'Residential'}
                </span>
                
                {property.status === 'Preprod Verified' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-[#7CFF3A]/15 border border-[#7CFF3A]/40 text-[#7CFF3A] backdrop-blur-md shadow-md">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7CFF3A]" />
                    Preprod
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 backdrop-blur-md shadow-md">
                    Testnet
                  </span>
                )}
              </div>

              {/* Flip Button overlay */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFlip();
                }}
                title="Flip to view detailed breakdown & ZK proofs"
                className="absolute top-3 right-3 px-2.5 py-1.5 rounded-full bg-black/75 hover:bg-[#7CFF3A]/25 border border-white/20 hover:border-[#7CFF3A]/60 text-white hover:text-[#7CFF3A] backdrop-blur-md transition-all duration-200 group/flip cursor-pointer flex items-center gap-1.5 text-xs font-medium shadow-lg"
                aria-label="Flip card for details"
              >
                <RotateCw className="w-3.5 h-3.5 transition-transform group-hover/flip:rotate-180 duration-500 text-[#7CFF3A]" />
                <span className="text-[11px] font-mono">Specs & ZK</span>
              </button>

              {/* Location pin on image bottom */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                <div className="flex items-center gap-1.5 truncate drop-shadow-md">
                  <MapPin className="w-3.5 h-3.5 text-[#7CFF3A] shrink-0" />
                  <span className="truncate font-medium text-white/90">{property.location}</span>
                </div>
                {holding && (
                  <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-[#7CFF3A]/25 border border-[#7CFF3A]/60 text-[#7CFF3A] text-[11px] font-mono font-bold backdrop-blur-md shadow-sm">
                    {holding.ownershipShares.toString()} Shares Owned
                  </span>
                )}
              </div>
            </div>

            {/* Property Title & ID */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight truncate group-hover:text-[#7CFF3A] transition-colors">
                  {property.name}
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-white/50 shrink-0">
                  #{property.id.slice(0, 6)}
                </span>
              </div>
            </div>

            {/* Share Allocation Progress Bar */}
            <div className="space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-white/60 flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-[#7CFF3A]" /> Shares Acquired
                </span>
                <span className="text-[#7CFF3A] font-bold">
                  {pctAcquired.toFixed(1)}% <span className="text-white/50 font-normal">({acquired.toLocaleString()} / {total.toLocaleString()})</span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative p-[1px]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#4ade28] via-[#7CFF3A] to-[#bbf7d0] shadow-[0_0_12px_rgba(124,255,58,0.6)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${pctAcquired}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            {/* Stats Row: Valuation & APY */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-center transition-colors group-hover:border-white/20">
                <span className="text-[10px] uppercase font-mono tracking-wider text-white/50 font-medium">
                  Total Valuation
                </span>
                <div className="text-base font-bold text-white font-mono mt-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-[#7CFF3A]" />
                  <span>${animatedValuation.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-center transition-colors group-hover:border-white/20">
                <span className="text-[10px] uppercase font-mono tracking-wider text-white/50 font-medium">
                  Projected APY
                </span>
                <div className="text-base font-bold text-[#7CFF3A] font-mono mt-1 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-[#7CFF3A]" />
                  <span>{property.projectedYieldApy}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Section */}
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPurchase();
              }}
              disabled={isSoldOut}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                isSoldOut
                  ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                  : 'bg-gradient-to-r from-[#4ade28] to-[#7CFF3A] text-black shadow-[0_0_24px_rgba(124,255,58,0.35)] hover:shadow-[0_0_36px_rgba(124,255,58,0.6)] hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isSoldOut ? 'Sold Out' : 'Acquire Fractional Shares'}</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFlip();
              }}
              className="w-full text-center text-xs font-mono text-white/50 hover:text-[#7CFF3A] transition-colors py-1 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Flip for ZK proof verification & detailed breakdown</span>
            </button>
          </div>
        </div>

        {/* ── BACK FACE ───────────────────────────────────────────────────── */}
        <div
          className={`absolute inset-0 w-full h-full rounded-3xl border border-[#7CFF3A]/30 bg-[#080d08]/95 backdrop-blur-2xl overflow-hidden flex flex-col justify-between p-5 transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.9)] ${
            prefersReducedMotion && !isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: prefersReducedMotion ? 'none' : 'rotateY(180deg)',
          }}
        >
          {/* Header of Back Face */}
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#7CFF3A]/10 border border-[#7CFF3A]/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-[#7CFF3A]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white truncate max-w-[190px]">
                    {property.name}
                  </h4>
                  <span className="text-[10px] font-mono text-[#7CFF3A]">Asset Intelligence & ZK</span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFlip();
                }}
                className="px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-mono"
                title="Flip back"
                aria-label="Flip back to front"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Front</span>
              </button>
            </div>

            {/* Staggered Back Content */}
            <motion.div
              variants={STAGGER_CONTAINER}
              initial="hidden"
              animate={isFlipped ? 'visible' : 'hidden'}
              className="mt-4 space-y-3.5"
            >
              {/* Share Breakdown 3-Column Grid */}
              <motion.div variants={STAGGER_ITEM} className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="text-[9px] uppercase font-mono text-white/50 tracking-wider">Total Shares</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {total.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="text-[9px] uppercase font-mono text-white/50 tracking-wider">Acquired</div>
                  <div className="text-sm font-bold text-[#D6B36A] font-mono mt-0.5">
                    {acquired.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#7CFF3A]/[0.08] border border-[#7CFF3A]/30 text-center">
                  <div className="text-[9px] uppercase font-mono text-[#7CFF3A]/70 tracking-wider font-semibold">Available</div>
                  <div className="text-sm font-bold text-[#7CFF3A] font-mono mt-0.5">
                    {available.toLocaleString()}
                  </div>
                </div>
              </motion.div>

              {/* Property Details Spec List */}
              <motion.div
                variants={STAGGER_ITEM}
                className="space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/10 text-xs font-mono"
              >
                <div className="flex justify-between items-center text-white/60">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#7CFF3A]" /> Share Price
                  </span>
                  <span className="text-white font-bold">
                    ${(property.totalValuationUsd / total).toFixed(2)} USD
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/60 border-t border-white/5 pt-1.5">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7CFF3A]" /> Min. Compliance
                  </span>
                  <span className="text-white font-bold">
                    ${property.complianceMinimumUsd.toString()} USD
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/60 border-t border-white/5 pt-1.5">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#7CFF3A]" /> Location
                  </span>
                  <span className="text-white/80 truncate max-w-[150px]" title={property.location}>
                    {property.location}
                  </span>
                </div>
              </motion.div>

              {/* Private Holdings Summary (if user owns shares) */}
              {holding ? (
                <motion.div
                  variants={STAGGER_ITEM}
                  className="p-3 rounded-2xl bg-[#7CFF3A]/[0.08] border border-[#7CFF3A]/30"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#7CFF3A] font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Your Private Position
                    </span>
                    <span className="text-white font-bold bg-[#7CFF3A]/20 px-2 py-0.5 rounded-md">
                      {holding.ownershipShares.toString()} Shares
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-white/70 mt-1.5">
                    <span>Invested: ${holding.investmentAmountUsd.toString()}</span>
                    <span className="text-[#7CFF3A]">Yield: ${holding.annualRentalIncomeUsd.toString()}/yr</span>
                  </div>
                </motion.div>
              ) : null}

              {/* Zero-Knowledge Proof Actions */}
              <motion.div variants={STAGGER_ITEM} className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#7CFF3A]" /> Zero-Knowledge Proof Verifications
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOwnershipProof();
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-[#7CFF3A]/15 border border-white/10 hover:border-[#7CFF3A]/50 text-xs font-mono text-white hover:text-[#7CFF3A] transition-all text-center flex flex-col items-center gap-1.5 group/btn cursor-pointer shadow-sm"
                  >
                    <Lock className="w-4 h-4 text-white/60 group-hover/btn:text-[#7CFF3A] transition-colors" />
                    <span className="font-semibold text-[11px]">Ownership</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onComplianceProof();
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-[#7CFF3A]/15 border border-white/10 hover:border-[#7CFF3A]/50 text-xs font-mono text-white hover:text-[#7CFF3A] transition-all text-center flex flex-col items-center gap-1.5 group/btn cursor-pointer shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4 text-white/60 group-hover/btn:text-[#7CFF3A] transition-colors" />
                    <span className="font-semibold text-[11px]">Compliance</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRentalProof();
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-[#7CFF3A]/15 border border-white/10 hover:border-[#7CFF3A]/50 text-xs font-mono text-white hover:text-[#7CFF3A] transition-all text-center flex flex-col items-center gap-1.5 group/btn cursor-pointer shadow-sm"
                  >
                    <Coins className="w-4 h-4 text-white/60 group-hover/btn:text-[#7CFF3A] transition-colors" />
                    <span className="font-semibold text-[11px]">Rental</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom Flip Button on Back Face */}
          <div className="pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFlip();
              }}
              className="w-full py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-white/30 text-white font-mono text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
