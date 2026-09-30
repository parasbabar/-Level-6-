/**
 * src/components/motion/index.tsx
 * Reusable animated primitives used across all pages.
 */

import React, {
  useEffect, useRef, useState, useCallback,
  createContext, useContext,
} from 'react';
import {
  motion, AnimatePresence, useReducedMotion,
  useMotionValue, useTransform, useSpring,
  useScroll,
  type MotionProps,
} from 'framer-motion';
import {
  CheckCircle2, AlertCircle, Info, X, RefreshCw, Check,
} from 'lucide-react';
import {
  fadeUp, fadeIn, popIn, slideRight,
  staggerContainer, pageVariants, safeVariants, spring, dur, ease,
} from '../../lib/motion';

/* ═══════════════════════════════════════════════════════════════════════════
   1. PageTransition — wraps each page, fades + slides on mount/unmount
   ═══════════════════════════════════════════════════════════════════════════ */
export const PageTransition: React.FC<{ children: React.ReactNode; id: string }> = ({ children, id }) => {
  const reduced = useReducedMotion();
  const v = safeVariants(pageVariants, reduced);
  return (
    <motion.div
      key={id}
      variants={v}
      initial="initial"
      animate="enter"
      exit="exit"
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   2. Reveal — generic scroll-driven fade+slide-up
   ═══════════════════════════════════════════════════════════════════════════ */
interface RevealProps extends MotionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  once?: boolean;
}
export const Reveal: React.FC<RevealProps> = ({
  children, delay = 0, className, style, once = true, ...rest
}) => {
  const reduced = useReducedMotion();
  const v = safeVariants(fadeUp, reduced);
  return (
    <motion.div
      variants={v}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-60px' }}
      transition={{ duration: dur.section, delay, ease }}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   3. StaggerGrid — stagger children on scroll into view
   ═══════════════════════════════════════════════════════════════════════════ */
export const StaggerGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}> = ({ children, className, style, delay = 0 }) => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: '-40px' }}
    transition={{ delayChildren: delay }}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);

/* Child item for StaggerGrid */
export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children, className, style,
}) => {
  const reduced = useReducedMotion();
  const v = safeVariants(fadeUp, reduced);
  return (
    <motion.div variants={v} className={className} style={style}>
      {children}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   4. AnimatedNumber — count-up / flip when value changes
   ═══════════════════════════════════════════════════════════════════════════ */
export const AnimatedNumber: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ value, prefix = '', suffix = '', decimals = 0, duration: dur_ = 1.4, className, style }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) { setDisplay(value); return; }
    const from = display;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / (dur_ * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
      else setDisplay(value);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   5. SpotlightCard — cursor-following green glow
   ═══════════════════════════════════════════════════════════════════════════ */
export const SpotlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  accent?: boolean;
}> = ({ children, className = '', style, onClick, accent }) => {
  const reduced = useReducedMotion();
  const mx = useMotionValue(-999);
  const my = useMotionValue(-999);
  const bg = useTransform(
    [mx, my],
    ([x, y]) =>
      `radial-gradient(320px circle at ${x}px ${y}px, rgba(74,222,40,0.11), transparent 70%)`
  );

  return (
    <motion.div
      className={`spotlight-card${accent ? ' accent-card' : ''} ${className}`}
      style={style}
      onClick={onClick}
      whileHover={reduced ? undefined : { y: -4 }}
      transition={spring.gentle}
      onMouseMove={reduced ? undefined : e => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      onMouseLeave={reduced ? undefined : () => { mx.set(-999); my.set(-999); }}
    >
      <motion.div
        aria-hidden="true"
        style={{ background: bg, position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none' }}
      />
      <div style={{ position: 'relative' }}>{children}</div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   6. Skeleton — shimmer placeholder
   ═══════════════════════════════════════════════════════════════════════════ */
export const Skeleton: React.FC<{
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = 16, borderRadius = 8, className, style }) => (
  <div
    className={className}
    style={{
      width, height, borderRadius,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.05) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.6s ease-in-out infinite',
      ...style,
    }}
  />
);

/* ═══════════════════════════════════════════════════════════════════════════
   7. Modal — backdrop blur + popIn panel
   ═══════════════════════════════════════════════════════════════════════════ */
export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: number;
}> = ({ open, onClose, title, subtitle, children, maxWidth = 520 }) => {
  const reduced = useReducedMotion();

  // Lock body scroll + ESC to close
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handler); };
  }, [open, onClose]);

  const panelV = safeVariants(popIn, reduced);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(5,8,5,0.80)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          variants={fadeIn}
          initial="hidden"
          animate="show"
          exit="exit"
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            variants={panelV}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{
              background: '#0E120E',
              border: '1px solid rgba(255,255,255,0.13)',
              borderRadius: '1.25rem',
              width: '100%',
              maxWidth,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.375rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  {title && <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: '#fff', margin: 0 }}>{title}</h3>}
                  {subtitle && <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>{subtitle}</p>}
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: '0.25rem', borderRadius: '0.375rem', display: 'flex', fontSize: '1.25rem' }} aria-label="Close">
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>
            )}
            <div style={{ padding: '1.5rem' }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   8. Drawer — right-side slide-in panel
   ═══════════════════════════════════════════════════════════════════════════ */
export const Drawer: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: number;
}> = ({ open, onClose, title, children, width = 480 }) => {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handler); };
  }, [open, onClose]);

  const drawerV = safeVariants(slideRight, reduced);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="drawer-backdrop"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(5,8,5,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />
          <motion.div
            key="drawer-panel"
            variants={drawerV}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width, zIndex: 201,
              background: '#0B0F0C',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              overflowY: 'auto',
              boxShadow: '-24px 0 64px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, background: '#0B0F0C', zIndex: 1 }}>
              {title && <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: '#fff', margin: 0 }}>{title}</h3>}
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', display: 'flex', padding: '0.25rem' }} aria-label="Close drawer">
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   9. Toast system
   ═══════════════════════════════════════════════════════════════════════════ */
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastItem { id: string; type: ToastType; message: string; duration?: number; }

interface ToastCtx {
  toast: (msg: string, type?: ToastType, duration?: number) => void;
}
const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 style={{ width: 16, height: 16 }} />,
  error:   <AlertCircle  style={{ width: 16, height: 16 }} />,
  info:    <Info          style={{ width: 16, height: 16 }} />,
  warning: <AlertCircle  style={{ width: 16, height: 16 }} />,
};
const TOAST_COLORS: Record<ToastType, string> = {
  success: 'var(--green)',
  error:   'var(--rose)',
  info:    'var(--blue)',
  warning: 'var(--amber)',
};

const ToastItem_: React.FC<{ item: ToastItem; onRemove: (id: string) => void }> = ({ item, onRemove }) => {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(100);
  const dur_ = item.duration ?? 4000;

  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      setProgress(Math.max(0, 100 - (elapsed / dur_) * 100));
      if (elapsed < dur_) raf = requestAnimationFrame(tick);
      else onRemove(item.id);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [item.id, dur_, onRemove]);

  return (
    <motion.div
      layout
      variants={reduced ? fadeIn : slideRight}
      initial="hidden"
      animate="show"
      exit="exit"
      style={{
        background: '#0E120E',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '0.875rem',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        minWidth: 280, maxWidth: 360,
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => onRemove(item.id)}
      whileHover={{ scale: 1.01 }}
      transition={spring.gentle}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem' }}>
        <span style={{ color: TOAST_COLORS[item.type], flexShrink: 0 }}>{TOAST_ICONS[item.type]}</span>
        <span style={{ fontSize: '0.9375rem', color: '#fff', flex: 1, lineHeight: 1.5 }}>{item.message}</span>
        <X style={{ width: 14, height: 14, color: 'var(--text-4)', flexShrink: 0 }} />
      </div>
      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ height: '100%', background: TOAST_COLORS[item.type], width: `${progress}%`, transition: 'width 0.1s linear' }} />
      </div>
    </motion.div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => setItems(prev => prev.filter(t => t.id !== id)), []);

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setItems(prev => [...prev.slice(-4), { id, type, message, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast stack */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          zIndex: 400,
          display: 'flex', flexDirection: 'column', gap: '0.625rem',
          alignItems: 'flex-end',
        }}
      >
        <AnimatePresence>
          {items.map(item => (
            <ToastItem_ key={item.id} item={item} onRemove={remove} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   10. ZKStepper — Building witness → Generating proof → Verifying on-chain
   ═══════════════════════════════════════════════════════════════════════════ */
const STEP_LABELS = ['Building witness', 'Generating proof', 'Verifying on-chain'];

export const ZKStepper: React.FC<{
  /** 0=idle, 1=witness, 2=proving, 3=verifying, 4=done, -1=error */
  stage: number;
  errorMessage?: string;
  className?: string;
}> = ({ stage, errorMessage, className = '' }) => {
  const reduced = useReducedMotion();
  const done  = stage === 4;
  const error = stage === -1;

  return (
    <div className={className}>
      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {STEP_LABELS.map((label, i) => {
          const stepNum  = i + 1;
          const isDone   = stage > stepNum || done;
          const isActive = stage === stepNum;
          const isError  = error && stage <= stepNum;

          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Icon */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${isDone ? 'var(--green)' : isActive ? 'var(--green)' : isError ? 'var(--rose)' : 'rgba(255,255,255,0.15)'}`,
                background: isDone ? 'var(--green-dim)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
              }}>
                <AnimatePresence mode="wait">
                  {isDone ? (
                    <motion.svg key="c" viewBox="0 0 24 24" style={{ width: 14, height: 14 }} fill="none" stroke="var(--green)" strokeWidth="3">
                      <motion.path
                        d="M5 12l5 5L20 7"
                        initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.35, ease }}
                      />
                    </motion.svg>
                  ) : isActive ? (
                    <motion.div
                      key="s"
                      animate={reduced ? {} : { rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--green)', borderTopColor: 'transparent' }}
                    />
                  ) : isError ? (
                    <X style={{ width: 12, height: 12, color: 'var(--rose)' }} />
                  ) : (
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-4)' }}>{stepNum}</span>
                  )}
                </AnimatePresence>
              </div>

              {/* Label */}
              <span style={{ fontSize: '0.9375rem', color: isDone ? '#fff' : isActive ? '#fff' : 'var(--text-4)', fontWeight: isDone || isActive ? 600 : 400, transition: 'color 0.2s' }}>
                {label}
              </span>

              {/* Active progress */}
              {isActive && (
                <motion.div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden', marginLeft: 'auto' }}>
                  <motion.div
                    style={{ height: '100%', background: 'var(--green)', transformOrigin: 'left' }}
                    animate={reduced ? { scaleX: 1 } : { scaleX: [0, 0.7, 0.85, 0.92] }}
                    transition={{ duration: 8, ease: 'easeOut' }}
                  />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && errorMessage && (
          <motion.div
            variants={safeVariants(fadeUp, reduced)}
            initial="hidden"
            animate="show"
            exit="exit"
            className="alert alert-rose"
            style={{ marginTop: '1rem' }}
          >
            <AlertCircle style={{ width: 16, height: 16, color: 'var(--rose)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success banner */}
      <AnimatePresence>
        {done && (
          <motion.div
            variants={safeVariants(popIn, reduced)}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{
              marginTop: '1.25rem',
              padding: '1.25rem',
              background: 'var(--green-dim)',
              border: '1px solid var(--green-border)',
              borderRadius: '0.875rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              boxShadow: '0 0 32px rgba(124,255,58,0.12)',
            }}
          >
            <CheckCircle2 style={{ width: 22, height: 22, color: 'var(--green)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>Proof Generated &amp; Verified</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginTop: 2 }}>Midnight Compact circuit passed on-chain</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   11. CopyTooltip — "Copied!" pops in on click
   ═══════════════════════════════════════════════════════════════════════════ */
export const CopyTooltip: React.FC<{
  text: string;
  children: React.ReactNode;
  className?: string;
}> = ({ text, children, className }) => {
  const [show, setShow] = useState(false);

  const handleClick = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setShow(true);
    setTimeout(() => setShow(false), 1800);
  };

  return (
    <span style={{ position: 'relative', display: 'inline-flex', cursor: 'pointer' }} className={className} onClick={handleClick}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.span
            variants={popIn}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{
              position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
              transform: 'translateX(-50%)',
              background: '#0E120E',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '0.5rem',
              padding: '0.25rem 0.625rem',
              fontSize: '0.75rem', fontWeight: 600,
              color: 'var(--green)',
              whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              pointerEvents: 'none',
              zIndex: 500,
            }}
          >
            <Check style={{ width: 11, height: 11 }} /> Copied!
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   12. ScrollProgressBar
   ═══════════════════════════════════════════════════════════════════════════ */
export const ScrollProgressBar: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: 'left' }}
      aria-hidden="true"
      className="scroll-progress-bar"
    />
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   13. AnimatedButton — whileTap + hover glow
   ═══════════════════════════════════════════════════════════════════════════ */
export const AnimatedButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'violet' | 'danger' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  glow?: boolean;
}> = ({ children, variant = 'ghost', loading, glow, className = '', style, disabled, onClick, type }) => {
  const reduced = useReducedMotion();
  const isPrimary = variant === 'primary';

  return (
    <motion.button
      whileTap={reduced || disabled ? undefined : { scale: 0.97 }}
      whileHover={reduced || disabled ? undefined : (glow || isPrimary) ? { boxShadow: '0 0 24px rgba(124,255,58,0.35)' } : {}}
      transition={{ duration: dur.micro }}
      className={`btn btn-${variant}${className ? ' ' + className : ''}`}
      style={style}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
    >
      {loading ? (
        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} style={{ display: 'inline-flex' }}>
          <RefreshCw style={{ width: 15, height: 15 }} />
        </motion.span>
      ) : children}
    </motion.button>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   14. EmptyState — animated
   ═══════════════════════════════════════════════════════════════════════════ */
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={safeVariants(fadeUp, reduced)}
      initial="hidden"
      animate="show"
      className="empty-state"
    >
      {icon && (
        <motion.div
          animate={reduced ? {} : { y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          style={{ color: 'var(--text-5)' }}
        >
          {icon}
        </motion.div>
      )}
      <div>
        <p style={{ fontWeight: 600, fontSize: '1.0625rem', color: '#fff', marginBottom: '0.5rem' }}>{title}</p>
        {description && <p style={{ color: 'var(--text-4)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{description}</p>}
      </div>
      {action}
    </motion.div>
  );
};
