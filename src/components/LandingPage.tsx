/**
 * LandingPage.tsx — PrivEstate
 * UI-only rewrite: aurora bg, shimmer headline, spotlight cards,
 * animated steps, scroll progress, floating ZK card.
 * All wallet/navigate props and logic UNCHANGED.
 */

import React, {
  useEffect, useRef, useState, useCallback, useMemo,
} from 'react';
import {
  motion, AnimatePresence,
  useScroll, useSpring, useMotionValue, useTransform, useReducedMotion,
} from 'framer-motion';
import {
  Sparkles, ChevronDown, Menu, X, Shield, Building2, Lock,
  FileCheck, ArrowRight, Users, Zap,
  Plus,
  Github, Twitter, ExternalLink, MapPin, TrendingUp,
  ShieldCheck, BarChart3, Key, Check, Copy,
} from 'lucide-react';import { PropertyMetadata } from '../utils/contract';
import type { ActiveTab } from './Layout';
import type { WalletConnectionStatus } from '../hooks/useMidnight';
import { PrivEstateLogo } from './PrivEstateLogo';
import { Modal, Button } from './ui/index';

/* ─── Types (unchanged) ─────────────────────────────────────────────────── */
interface LandingPageProps {
  properties: PropertyMetadata[];
  onNavigate: (tab: ActiveTab) => void;
  walletStatus?: WalletConnectionStatus;
  onConnectWallet?: () => void;
  shieldedAddress?: string | null;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

/* prefer-reduced-motion guard for variants */
function makeVariants(reduced: boolean | null) {
  const hidden = reduced ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 28, filter: 'blur(6px)' };
  const show   = { opacity: 1, y: 0, filter: 'blur(0px)' };
  return { hidden, show };
}

/* ─── Scroll progress bar ────────────────────────────────────────────────── */
const ScrollProgressBar: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return (
    <motion.div
      style={{ scaleX }}
      className="scroll-progress-bar"
      aria-hidden="true"
    />
  );
};

/* ─── SpotlightCard ──────────────────────────────────────────────────────── */
interface SpotlightCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent?: boolean;
  onClick?: () => void;
  delay?: number;
}
const SpotlightCard: React.FC<SpotlightCardProps> = ({ icon, title, desc, accent, onClick, delay = 0 }) => {
  const reduced = useReducedMotion();
  const mx = useMotionValue(-999);
  const my = useMotionValue(-999);
  const bg = useTransform([mx, my], ([x, y]) =>
    `radial-gradient(320px circle at ${x}px ${y}px, rgba(74,222,40,0.12), transparent 70%)`
  );
  return (
    <motion.div
      className={`spotlight-card${accent ? ' accent-card' : ''}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={reduced ? undefined : e => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      onMouseLeave={reduced ? undefined : () => { mx.set(-999); my.set(-999); }}
      whileHover={reduced ? undefined : { y: -4 }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Mouse-follow glow */}
      <motion.div
        style={{ background: bg }}
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        aria-hidden="true"
      />
      <div style={{ position: 'relative' }}>
        <div className="card-icon" style={{ marginBottom: '1.25rem' }}>
          {icon}
        </div>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.0625rem',
          fontWeight: 600, color: '#fff', letterSpacing: '-0.01em', marginBottom: '0.5rem',
        }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.9375rem', color: '#9CA3AF', lineHeight: 1.6 }}>{desc}</p>
      </div>
    </motion.div>
  );
};

/* ─── Reveal wrapper ─────────────────────────────────────────────────────── */
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className,
}) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* ─── CountUp ────────────────────────────────────────────────────────────── */
const CountUp: React.FC<{ target: string; suffix: string }> = ({ target, suffix }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState('0');
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      if (reduced) { setVal(target); return; }
      const numeric = parseFloat(target);
      if (isNaN(numeric)) { setVal(target); return; }
      const decimals = target.includes('.') ? target.split('.')[1].length : 0;
      const duration = 1600;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        setVal((numeric * ease).toFixed(decimals));
        if (t < 1) requestAnimationFrame(tick);
        else setVal(target);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, reduced]);

  return <span ref={ref}>{val}{suffix}</span>;
};

/* ─── Floating ZK proof card ─────────────────────────────────────────────── */
const ZKFloatCard: React.FC = () => (
  <div className="zk-float-card" aria-hidden="true">
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
      <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: 'var(--green-dim)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ShieldCheck style={{ width: 16, height: 16, color: 'var(--green)' }} />
      </div>
      <div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff' }}>ZK Proof Verified</div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-4)' }}>Midnight Preprod · proveOwnershipThreshold</div>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        <span className="badge badge-green" style={{ fontSize: '0.5625rem' }}>✓ VALID</span>
      </div>
    </div>
    {/* Proof fields */}
    {[
      { label: 'Public Claim', value: 'I own ≥ 10% of this property', reveal: true },
      { label: 'Exact Shares', value: '🔒 NOT DISCLOSED', reveal: false },
      { label: 'Capital Invested', value: '🔒 NOT DISCLOSED', reveal: false },
      { label: 'Ledger Counter', value: '+1 verifiedOwnershipCount', reveal: true },
    ].map(f => (
      <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.375rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', gap: '0.75rem' }}>
        <span style={{ color: 'var(--text-4)' }}>{f.label}</span>
        <span style={{ color: f.reveal ? '#fff' : 'var(--cyan)', fontFamily: f.reveal ? 'inherit' : 'var(--font-mono)', fontWeight: 600 }}>{f.value}</span>
      </div>
    ))}
  </div>
);

/* ─── Navbar ─────────────────────────────────────────────────────────────── */
interface NavbarProps {
  onNavigate: (tab: ActiveTab) => void;
  walletStatus?: WalletConnectionStatus;
  onConnectWallet?: () => void;
  shieldedAddress?: string | null;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, walletStatus, onConnectWallet, shieldedAddress }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const devRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!devOpen) return;
    const h = (e: MouseEvent) => {
      if (devRef.current && !devRef.current.contains(e.target as Node)) setDevOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [devOpen]);

  const isConnected = walletStatus === 'connected' || walletStatus === 'syncing';

  const navLinks: { label: string; tab: ActiveTab }[] = [
    { label: 'Marketplace', tab: 'marketplace' },
    { label: 'Portfolio',   tab: 'portfolio'   },
    { label: 'Proofs',      tab: 'ownership'   },
    { label: 'Verify',      tab: 'verifier'    },
  ];

  const copyAddr = () => {
    if (shieldedAddress) navigator.clipboard.writeText(shieldedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'background 0.3s, border-color 0.3s, padding 0.3s',
        padding: scrolled ? '0 0' : '0.25rem 0',
        background: scrolled ? 'rgba(5,8,5,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
      }}
      role="navigation"
      aria-label="Main"
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>

        {/* Custom PrivEstate Logo */}
        <button
          onClick={() => { setMobileOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
          aria-label="PrivEstate home"
        >
          <PrivEstateLogo size="md" showText={true} />
        </button>

        {/* Desktop nav links with sliding pill */}
        <ul
          style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', listStyle: 'none', flex: 1, justifyContent: 'center' }}
          className="lp-desktop-nav"
          onMouseLeave={() => setHoveredLink(null)}
        >
          {navLinks.map(l => (
            <li key={l.tab} style={{ position: 'relative' }}>
              <button
                onMouseEnter={() => setHoveredLink(l.tab)}
                onClick={() => onNavigate(l.tab)}
                style={{ position: 'relative', zIndex: 1, padding: '0.4rem 0.875rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 500, color: hoveredLink === l.tab ? '#fff' : 'rgba(255,255,255,0.68)', fontFamily: 'var(--font-body)', transition: 'color 0.2s', borderRadius: '9999px' }}
              >
                {l.label}
              </button>
              <AnimatePresence>
                {hoveredLink === l.tab && (
                  <motion.span
                    layoutId="nav-pill"
                    style={{ position: 'absolute', inset: 0, borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', zIndex: 0 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                  />
                )}
              </AnimatePresence>
            </li>
          ))}

          {/* Developers dropdown */}
          <li ref={devRef} style={{ position: 'relative' }}>            <button
              onClick={() => setDevOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem 0.875rem', borderRadius: '9999px', fontSize: '0.9375rem', fontWeight: 500, color: 'rgba(255,255,255,0.68)', fontFamily: 'var(--font-body)', transition: 'color 0.2s' }}
              aria-expanded={devOpen}
              aria-haspopup="menu"
            >
              Developers
              <motion.span animate={{ rotate: devOpen ? 180 : 0 }} transition={{ duration: 0.22 }}>
                <ChevronDown style={{ width: 14, height: 14 }} />
              </motion.span>
            </button>
            <AnimatePresence>
              {devOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', width: 200, background: 'rgba(10,16,10,0.97)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.875rem', padding: '0.5rem', overflow: 'hidden' }}
                  role="menu"
                >
                  {([
                    { label: 'Admin Panel',     tab: 'admin'  as ActiveTab },
                    { label: 'Deploy Contract', tab: 'deploy' as ActiveTab },
                  ]).map(item => (
                    <button
                      key={item.tab}
                      role="menuitem"
                      onClick={() => { setDevOpen(false); onNavigate(item.tab); }}
                      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-body)', textAlign: 'left', transition: 'background 0.15s, color 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,255,58,0.08)'; (e.currentTarget as HTMLElement).style.color = '#7CFF3A'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'; }}
                    >
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        </ul>

        {/* Right: wallet chip + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
          <button
            onClick={isConnected ? copyAddr : onConnectWallet}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4375rem 1rem',
              borderRadius: '9999px',
              background: isConnected ? 'var(--green-dim)' : 'linear-gradient(180deg,#8CFF4A 0%,#5FD318 50%,#2E7D0B 100%)',
              border: isConnected ? '1px solid var(--green-border)' : 'none',
              color: isConnected ? 'var(--green)' : '#020802',
              fontSize: '0.875rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'filter 0.2s, box-shadow 0.2s',
              boxShadow: isConnected ? 'none' : '0 0 18px rgba(124,255,58,0.28)',
            }}
            aria-label={isConnected ? 'Copy wallet address' : 'Connect Wallet'}
          >
            {isConnected ? (
              <>
                <span className="pulse-dot" aria-hidden="true" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                  {shieldedAddress ? `${shieldedAddress.slice(0, 6)}…${shieldedAddress.slice(-4)}` : 'Connected'}
                </span>
                {copied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12, opacity: 0.6 }} />}
              </>
            ) : (
              'Sign in / Connect'
            )}
          </button>

          <button
            onClick={() => setMobileOpen(v => !v)}
            style={{ display: 'none', padding: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#fff', cursor: 'pointer' }}
            className="lp-hamburger"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={mobileOpen ? 'x' : 'm'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                {mobileOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(5,8,5,0.98)', backdropFilter: 'blur(20px)', padding: '1rem 1.5rem 1.5rem' }}
          >
            {[...navLinks, { label: 'Admin Panel', tab: 'admin' as ActiveTab }, { label: 'Deploy', tab: 'deploy' as ActiveTab }].map((l, i) => (
              <motion.button
                key={l.tab}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { onNavigate(l.tab); setMobileOpen(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '1rem', fontWeight: 500, color: 'rgba(255,255,255,0.78)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                {l.label}
              </motion.button>
            ))}
            <button
              onClick={() => { (isConnected ? copyAddr : onConnectWallet)?.(); setMobileOpen(false); }}
              style={{ width: '100%', marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', background: 'linear-gradient(180deg,#8CFF4A 0%,#2E7D0B 100%)', border: 'none', borderRadius: '9999px', color: '#020802', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              {isConnected ? 'Wallet Connected' : 'Sign in / Connect Wallet'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) { .lp-desktop-nav { display: none !important; } .lp-hamburger { display: flex !important; } }
      `}</style>
    </motion.nav>
  );
};

/* ─── Hero ───────────────────────────────────────────────────────────────── */
const Hero: React.FC<{ onNavigate: (tab: ActiveTab) => void; onConnectWallet?: () => void }> = ({ onNavigate, onConnectWallet }) => {
  const reduced = useReducedMotion();
  const v = makeVariants(reduced);

  const words1 = ['Own', 'Property.'];
  const words2 = ['Prove', 'It', 'Privately.'];

  return (
    <section
      id="hero"
      style={{
        position: 'relative', minHeight: '100vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        paddingTop: '6rem', paddingBottom: '32vw',
        background: 'linear-gradient(180deg,#020402 0%,#050805 60%)',
      }}
    >
      {/* Aurora orbs */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="aurora-orb" style={{ left: '8%', top: '-8%', width: 520, height: 520, background: 'rgba(74,222,40,0.25)' }} />
        <div className="aurora-orb" style={{ right: '5%', top: '12%', width: 420, height: 420, background: 'rgba(16,185,129,0.15)', animationDelay: '-6s' }} />
        <div className="aurora-orb" style={{ left: '40%', bottom: '20%', width: 360, height: 360, background: 'rgba(74,222,40,0.10)', animationDelay: '-12s' }} />
      </div>

      {/* Grid overlay with radial fade */}
      <div aria-hidden="true" className="lp-grid-mask" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* Bottom gradient fade-out */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 'auto 0 0', height: '40%', background: 'linear-gradient(to top,#050805,transparent)', pointerEvents: 'none', zIndex: 1 }} />

      {/* Planet arc */}
      <div aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 0, pointerEvents: 'none' }}>
        <div className="animate-breathe" style={{ width: '145vw', height: '145vw', borderRadius: '50%', background: 'radial-gradient(ellipse 70% 60% at 50% 38%,#2E7D0B 0%,#1a4a07 20%,#0d2804 45%,#050805 75%)', boxShadow: '0 0 0 1.5px rgba(140,255,74,0.55),0 0 40px 6px rgba(140,255,74,0.40),0 0 100px 20px rgba(140,255,74,0.20),0 0 200px 60px rgba(60,180,20,0.12)', marginBottom: '-72vw', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '1%', left: '50%', transform: 'translateX(-50%)', width: '96%', height: '10%', borderRadius: '50%', background: 'radial-gradient(ellipse 80% 100% at 50% 0%,rgba(180,255,80,0.22),transparent 100%)', filter: 'blur(4px)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent 0px,transparent 28px,rgba(0,0,0,0.14) 28px,rgba(0,0,0,0.14) 29px)', borderRadius: '50%', opacity: 0.5 }} />
        </div>
        <div style={{ position: 'absolute', bottom: '72vw', left: '50%', transform: 'translateX(-50%)', width: '145vw', height: '18vw', background: 'radial-gradient(ellipse 100% 100% at 50% 100%,rgba(80,200,20,0.16),rgba(40,120,10,0.08) 40%,transparent 70%)', filter: 'blur(18px)' }} />
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: '56rem', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}>

        {/* Badge with spinning glow border */}
        <motion.div
          initial={v.hidden} animate={v.show}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'center' }}
        >
          <span className="badge-glow">
            <Sparkles style={{ width: 13, height: 13 }} />
            New: ZK Proof Ownership on Midnight Preprod
          </span>
        </motion.div>

        {/* Headline — word-by-word blur reveal */}
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.75rem,6.5vw,5rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.02, marginBottom: '1.5rem' }}>
          {/* Line 1 */}
          <span style={{ display: 'block' }}>
            {words1.map((w, i) => (
              <motion.span
                key={`l1-${i}`}
                style={{ display: 'inline-block', marginRight: '0.25em', color: '#fff' }}
                initial={reduced ? false : { opacity: 0, y: 32, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.7, delay: 0.18 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                {w}
              </motion.span>
            ))}
          </span>
          {/* Line 2 — green shimmer on last two words */}
          <span style={{ display: 'block' }}>
            {words2.map((w, i) => (
              <motion.span
                key={`l2-${i}`}
                className={i >= 1 ? 'shimmer-text' : ''}
                style={{ display: 'inline-block', marginRight: '0.25em', color: i === 0 ? '#fff' : undefined }}
                initial={reduced ? false : { opacity: 0, y: 32, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.7, delay: 0.42 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                {w}
              </motion.span>
            ))}
          </span>
        </h1>

        {/* Sub-copy */}
        <motion.p
          initial={v.hidden} animate={v.show}
          transition={{ duration: 0.6, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
          style={{ fontSize: 'clamp(1rem,1.6vw,1.1875rem)', color: '#9CA3AF', lineHeight: 1.7, maxWidth: '38rem', margin: '0 auto 2.25rem' }}
        >
          Fractional real-estate on Midnight Preprod with zero-knowledge proofs.
          Hold shares privately. Prove ownership without revealing anything.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={v.hidden} animate={v.show}
          transition={{ duration: 0.55, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2.5rem' }}
        >
          <button onClick={() => onNavigate('marketplace')} className="lp-btn-primary">
            Explore Properties <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
          <button onClick={onConnectWallet} className="lp-btn-ghost">
            Connect Wallet
          </button>
        </motion.div>

        {/* Trust strip — infinite marquee */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="marquee-outer"
          style={{ marginBottom: '3rem' }}
        >
          <div className="marquee-track">
            {[...Array(2)].flatMap(() => [
              { icon: Shield,    label: 'ZK-Verified On-Chain' },
              { icon: Lock,      label: 'Shielded Holdings' },
              { icon: Zap,       label: 'Midnight Preprod' },
              { icon: ShieldCheck, label: 'Compact ZK Circuits' },
              { icon: Building2, label: 'Fractional RWA' },
              { icon: Key,       label: 'Private Witness Storage' },
            ]).map(({ icon: Icon, label }, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.38)', whiteSpace: 'nowrap' }}>
                <Icon style={{ width: 13, height: 13, color: 'rgba(124,255,74,0.5)' }} />
                {label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Floating ZK proof card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <ZKFloatCard />
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Feature Strip (6-Card Grid) ────────────────────────────────────────── */
const FeatureStrip: React.FC<{ onNavigate: (tab: ActiveTab) => void }> = ({ onNavigate }) => {
  const [selectedFeature, setSelectedFeature] = useState<{
    title: string;
    desc: string;
    detail: string;
    tab: ActiveTab;
    icon: React.ReactNode;
    color: string;
  } | null>(null);

  const features = [
    {
      icon: <Building2 style={{ width: 20, height: 20, color: '#7CFF3A' }} />,
      title: 'Fractional Ownership',
      desc: 'Buy into premium real estate from $50/share. Tokenized properties on Midnight Preprod.',
      detail: 'Invest in institutional-grade real estate assets split into 100,000 fractional shares per property. Real-time share availability is synced across Midnight Preprod with zero hidden markups.',
      tab: 'marketplace' as ActiveTab,
      color: '#7CFF3A',
    },
    {
      icon: <ShieldCheck style={{ width: 20, height: 20, color: '#22D3EE' }} />,
      title: 'Private Holdings',
      desc: 'Your share count stays in client-shielded witness storage — never exposed on-chain.',
      detail: 'Client-side private state providers encrypt your portfolio balance and private keys locally in browser storage using 32-byte witness keys.',
      tab: 'portfolio' as ActiveTab,
      color: '#22D3EE',
    },
    {
      icon: <Key style={{ width: 20, height: 20, color: '#8B5CF6' }} />,
      title: 'ZK Proof Generation',
      desc: 'Prove ownership threshold, compliance, or rental yield without revealing exact figures.',
      detail: 'Execute in-browser Zero-Knowledge proof generation via Compact v0.16 circuits to prove statement validity (e.g. ownership >= 10%) with 0% data exposure.',
      tab: 'ownership' as ActiveTab,
      color: '#8B5CF6',
    },
    {
      icon: <FileCheck style={{ width: 20, height: 20, color: '#F59E0B' }} />,
      title: 'Auditor Verification',
      desc: 'Regulators verify mathematical proof validity on-chain with zero private data disclosure.',
      detail: 'Independent verifiers and regulatory compliance officers can mathematically verify proof certificates against Midnight Preprod contract state.',
      tab: 'verifier' as ActiveTab,
      color: '#F59E0B',
    },
    {
      icon: <Zap style={{ width: 20, height: 20, color: '#22D3EE' }} />,
      title: 'Preprod Smart Settlement',
      desc: 'Direct smart contract interactions deployed on Preprod testnet via Compact v0.16.',
      detail: 'Level 6 preprod infrastructure binds property parameterization (propertyId, totalShares, complianceMinimum) directly to Midnight ledger.',
      tab: 'deploy' as ActiveTab,
      color: '#22D3EE',
    },
    {
      icon: <TrendingUp style={{ width: 20, height: 20, color: '#7CFF3A' }} />,
      title: 'Shielded Dividend Yields',
      desc: 'Receive rental income and generate private yield claims verified on-chain.',
      detail: 'Track projected APY rental yields across your portfolio and generate zero-knowledge proof claims for statutory income minimums.',
      tab: 'admin' as ActiveTab,
      color: '#7CFF3A',
    },
  ];

  return (
    <section style={{ position: 'relative', zIndex: 5, marginTop: '-8rem', padding: '0 1.5rem 5rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', background: 'rgba(5,8,5,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '1.25rem' }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
              onClick={() => setSelectedFeature(f)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${f.color}50`; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', padding: '1.75rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.125rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.25s', fontFamily: 'var(--font-body)' }}
            >
              <div className="flex items-center justify-between">
                <div className="card-icon" style={{ background: `${f.color}15`, borderColor: `${f.color}30` }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: f.color, background: `${f.color}15`, padding: '0.2rem 0.5rem', borderRadius: '0.375rem', border: `1px solid ${f.color}30`, fontWeight: 600 }}>
                  Click to Explore &rarr;
                </span>
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.375rem', letterSpacing: '-0.01em' }}>{f.title}</div>
                <div style={{ fontSize: '0.875rem', color: '#9CA3AF', lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Feature Detail Modal Popup */}
      <Modal
        isOpen={Boolean(selectedFeature)}
        onClose={() => setSelectedFeature(null)}
        title={selectedFeature?.title || 'Feature Breakdown'}
        size="md"
      >
        {selectedFeature && (
          <div className="space-y-5 text-white/90 text-sm">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
              <div className="p-2.5 rounded-xl" style={{ background: `${selectedFeature.color}20`, color: selectedFeature.color }}>
                {selectedFeature.icon}
              </div>
              <div>
                <h4 className="font-bold text-white text-base">{selectedFeature.title}</h4>
                <p className="text-xs text-white/50">PrivEstate Level 6 Zero-Knowledge Feature</p>
              </div>
            </div>

            <p className="text-white/80 leading-relaxed text-sm">
              {selectedFeature.detail}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button variant="ghost" onClick={() => setSelectedFeature(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const tab = selectedFeature.tab;
                  setSelectedFeature(null);
                  onNavigate(tab);
                }}
              >
                Go to {selectedFeature.title} &rarr;
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`@media(max-width:900px){div[style*="repeat(3"]{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:540px){div[style*="repeat(3"]{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
};

/* ─── Stats ──────────────────────────────────────────────────────────────── */
const StatsSection: React.FC<{ properties: PropertyMetadata[] }> = ({ properties }) => {
  const totalVal = properties.reduce((s, p) => s + p.totalValuationUsd, 0);
  const totalSh  = properties.reduce((s, p) => s + Number(p.totalShares), 0);
  const acqSh    = properties.reduce((s, p) => s + Number(p.acquiredShares), 0);

  const stats = [
    { target: properties.length > 0 ? String(properties.length) : '5', suffix: '+', label: 'Properties Listed' },
    { target: totalVal  > 0 ? (totalVal / 1_000_000).toFixed(1) : '29.7', suffix: 'M', label: 'Total Asset Value', prefix: '$' },
    { target: totalSh   > 0 ? String(Math.round(totalSh  / 1000)) : '590', suffix: 'K', label: 'Fractional Shares' },
    { target: acqSh     > 0 ? String(Math.round(acqSh    / 1000)) : '154', suffix: 'K+', label: 'Shares Acquired' },
    { target: '3', suffix: '', label: 'ZK Circuits' },
    { target: 'Preprod', suffix: '', label: 'Network' },
  ];

  return (
    <section style={{ padding: '5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '2rem' }}>
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.07}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,2.5vw,2.25rem)', fontWeight: 700, color: 'var(--green)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {s.prefix ?? ''}
                <CountUp target={s.target} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginTop: '0.4rem', fontWeight: 500 }}>{s.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
      <style>{`@media(max-width:900px){section>div[style*="repeat(6"]{grid-template-columns:repeat(3,1fr)!important}}@media(max-width:540px){section>div[style*="repeat(6"]{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    </section>
  );
};

/* ─── How It Works — self-drawing connecting line ────────────────────────── */
const HowItWorks: React.FC<{ onNavigate: (tab: ActiveTab) => void }> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start 80%', 'end 60%'] });
  const lineWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const steps = [
    { n: '01', title: 'Connect Wallet',            desc: 'Install Midnight Lace, connect to Preprod. Your identity stays shielded throughout.' },
    { n: '02', title: 'Explore Properties',        desc: 'Browse tokenized real-estate assets. View share supply, valuation, and projected yield APY.' },
    { n: '03', title: 'Acquire Fractional Shares', desc: 'A real Midnight Preprod transaction stores your holdings in shielded witness storage.' },
    { n: '04', title: 'Generate ZK Proofs',        desc: 'Prove ownership threshold, accreditation, or rental yield — without revealing exact figures.' },
  ];

  return (
    <section style={{ padding: '6rem 1.5rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-label" style={{ marginBottom: '0.875rem', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-5)' }}>How it works</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,2.75rem)', fontWeight: 700, letterSpacing: '-0.025em', color: '#fff' }}>
              Four steps to private<br />real-estate ownership
            </h2>
          </div>
        </Reveal>

        <div ref={containerRef} className="steps-container">
          {/* Self-drawing line */}
          <div className="steps-line-track">
            <motion.div className="steps-line-fill" style={{ width: lineWidth }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.5rem' }}>
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div style={{ paddingTop: '2rem' }}>
                  {/* Step node dot */}
                  <div className="step-node" style={{ marginBottom: '1.25rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)' }}>{s.n}</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: '#fff', letterSpacing: '-0.015em', marginBottom: '0.5rem' }}>{s.title}</h3>
                  <p style={{ fontSize: '0.9375rem', color: '#9CA3AF', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
          <button onClick={() => onNavigate('marketplace')} className="lp-btn-primary">
            Start Exploring <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
      <style>{`@media(max-width:900px){div[style*="repeat(4,1fr)"]{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:540px){div[style*="repeat(4,1fr)"]{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
};

/* ─── Features Grid — spotlight cards ───────────────────────────────────── */
const FeaturesGrid: React.FC = () => {
  const cards = [
    { Icon: BarChart3,  title: 'Transparent Share Accounting',  desc: 'Every property shows Total, Acquired, and Available shares in real time — no hidden inventory manipulation.',      accent: true },
    { Icon: Shield,     title: 'Selective Disclosure',           desc: "Prove what's needed — ownership ≥ 10%, capital ≥ $250K, rental ≥ target. Nothing else is revealed." },
    { Icon: Zap,        title: 'Midnight-Native ZK Circuits',    desc: 'Three Compact language circuits compiled to ZKIR and verified on-chain. Proof keys distributed in-browser.' },
    { Icon: Users,      title: 'Multi-Property Portfolio',       desc: 'Hold shares across up to 5 Preprod properties. Each holding is wallet-isolated and state-restored on reload.' },
    { Icon: Lock,       title: 'Shielded Witness Storage',       desc: 'Capital invested, share count, and rental income never touch the public ledger — stored client-side only.' },
    { Icon: TrendingUp, title: 'Projected Yield Tracking',       desc: 'Monitor estimated annual rental income per holding. Generate a private yield claim without disclosing amounts.' },
  ];

  return (
    <section style={{ padding: '6rem 1.5rem', background: 'rgba(255,255,255,0.01)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-label" style={{ marginBottom: '0.875rem', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-5)' }}>Features</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,2.75rem)', fontWeight: 700, letterSpacing: '-0.025em', color: '#fff' }}>
              Built for serious<br />private real-estate investing
            </h2>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
          {cards.map((c, i) => (
            <SpotlightCard
              key={c.title}
              icon={<c.Icon style={{ width: 20, height: 20, color: c.accent ? 'var(--green)' : '#fff' }} />}
              title={c.title}
              desc={c.desc}
              accent={c.accent}
              delay={i * 0.07}
            />
          ))}
        </div>
      </div>
      <style>{`@media(max-width:900px){section div[style*="repeat(3,1fr)"]{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:540px){section div[style*="repeat(3,1fr)"]{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
};

/* ─── Properties Section ─────────────────────────────────────────────────── */
const PropertiesSection: React.FC<{ properties: PropertyMetadata[]; onNavigate: (tab: ActiveTab) => void }> = ({ properties, onNavigate }) => {
  const shown = properties.slice(0, 3);
  if (shown.length === 0) return null;

  return (
    <section style={{ padding: '6rem 1.5rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <Reveal>
            <div>
              <div className="section-label" style={{ marginBottom: '0.5rem', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-5)' }}>Live on Preprod</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,3vw,2.5rem)', fontWeight: 700, letterSpacing: '-0.025em', color: '#fff' }}>Featured Properties</h2>
            </div>
          </Reveal>
          <button onClick={() => onNavigate('marketplace')} className="lp-btn-ghost" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9375rem' }}>
            View all <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
          {shown.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.1}>
              <motion.div
                className="spotlight-card"
                style={{ padding: 0, cursor: 'pointer' }}
                onClick={() => onNavigate('marketplace')}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              >
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '1rem 1rem 0 0' }}>
                  <img
                    src={p.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'}
                    alt={p.name} loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'; }}
                    style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                  />
                  <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.625rem', padding: '0.2rem 0.6rem' }}>
                      <span className="badge-dot" style={{ background: 'var(--green)' }} />
                      {p.status || 'Preprod Verified'}
                    </span>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(5,8,5,0.9) 0%,transparent 50%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>
                    <MapPin style={{ width: 11, height: 11 }} /> {p.location}
                  </div>
                </div>
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: '#fff', marginBottom: '0.25rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-4)', marginBottom: '1rem' }}>{p.assetType}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[
                      { l: 'Valuation', v: formatCurrency(p.totalValuationUsd) },
                      { l: 'Total Shares', v: Number(p.totalShares).toLocaleString() },
                      { l: 'Yield APY', v: p.projectedYieldApy },
                    ].map(m => (
                      <div key={m.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '0.625rem 0.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-5)', marginBottom: '0.2rem' }}>{m.l}</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: m.l === 'Yield APY' ? 'var(--green)' : '#fff', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--green)' }}>
                    View Property <ArrowRight style={{ width: 14, height: 14 }} />
                  </div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:900px){section div[style*="repeat(3,1fr)"]{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:600px){section div[style*="repeat(3,1fr)"]{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
};

/* ─── FAQ ────────────────────────────────────────────────────────────────── */
const FAQ: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);
  const items = useMemo(() => [
    { q: 'What is PrivEstate?', a: 'PrivEstate is a privacy-preserving fractional real-estate platform on Midnight Preprod. Investors hold fractional shares privately using zero-knowledge proofs — no public disclosure of ownership amounts.' },
    { q: 'What wallet do I need?', a: 'The Midnight Lace browser extension, configured for Midnight Preprod. PrivEstate connects via the official Midnight DApp Connector (window.midnight.mnLace).' },
    { q: 'What are the three ZK circuits?', a: 'proveOwnershipThreshold (you own ≥ X%), proveCompliance (capital ≥ minimum), and proveRentalClaim (income ≥ target). All compiled to ZKIR and evaluated in-browser.' },
    { q: 'Is my exact share count ever visible on-chain?', a: 'No. Share count, capital, and rental income stay in client-shielded witness storage. The ledger only increments a verification counter when a proof passes.' },
    { q: 'Is this real money?', a: 'PrivEstate runs on Midnight Preprod (testnet). All transactions are for demonstration. No real assets or funds are involved.' },
    { q: 'Can I use PrivEstate without a wallet?', a: 'Browse the marketplace and landing page freely. Acquiring shares or generating ZK proofs requires a Midnight Lace wallet on Preprod.' },
  ], []);

  return (
    <section style={{ padding: '6rem 1.5rem' }}>
      <div style={{ maxWidth: '52rem', margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="section-label" style={{ marginBottom: '0.875rem', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-5)' }}>FAQ</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,2.75rem)', fontWeight: 700, letterSpacing: '-0.025em', color: '#fff' }}>Common questions</h2>
          </div>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="spotlight-card" style={{ padding: 0 }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '1.125rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600, color: '#fff', textAlign: 'left', gap: '1rem' }}
                  aria-expanded={open === i}
                >
                  {item.q}
                  <motion.div
                    animate={{ rotate: open === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}
                  >
                    <Plus style={{ width: 12, height: 12 }} />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p style={{ padding: '0 1.5rem 1.25rem', fontSize: '0.9375rem', color: '#9CA3AF', lineHeight: 1.65 }}>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── CTA Banner ─────────────────────────────────────────────────────────── */
const CTABanner: React.FC<{ onNavigate: (tab: ActiveTab) => void; onConnectWallet?: () => void }> = ({ onNavigate, onConnectWallet }) => (
  <section style={{ padding: '2rem 1.5rem 8rem', position: 'relative', overflow: 'hidden' }}>
    <div aria-hidden="true" style={{ position: 'absolute', bottom: '-10rem', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle at 50% 40%,#1a4a07,#0d2804 40%,transparent 70%)', boxShadow: '0 0 0 1px rgba(140,255,74,0.25),0 0 60px 10px rgba(80,200,20,0.12)', pointerEvents: 'none' }} />
    <Reveal>
      <div style={{ maxWidth: '44rem', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="section-label" style={{ marginBottom: '1rem', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-5)' }}>Get started today</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,4vw,3.25rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: '1.125rem' }}>
          Your next property<br />starts here.
        </h2>
        <p style={{ fontSize: '1.0625rem', color: '#9CA3AF', lineHeight: 1.6, marginBottom: '2rem' }}>
          Connect your Midnight Lace wallet and explore fractional real estate with the privacy you deserve.
        </p>
        <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('marketplace')} className="lp-btn-primary">Explore Properties</button>
          <button onClick={onConnectWallet} className="lp-btn-ghost">Connect Wallet</button>
        </div>
      </div>
    </Reveal>
  </section>
);

/* ─── Footer ─────────────────────────────────────────────────────────────── */
const Footer: React.FC<{ onNavigate: (tab: ActiveTab) => void }> = ({ onNavigate }) => (
  <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '3.5rem 1.5rem 2rem', background: 'rgba(2,4,2,0.8)' }}>
    <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%,#8CFF4A,#2E7D0B)', boxShadow: '0 0 10px rgba(140,255,74,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles style={{ width: 12, height: 12, color: '#050805' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>PrivEstate</span>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.65, maxWidth: '22rem' }}>
          Privacy-preserving fractional real-estate on Midnight Network Preprod. Hold shares privately. Prove ownership with zero-knowledge.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          {([{ href: 'https://github.com/parasbabar/-Level-6-', Icon: Github }, { href: 'https://x.com/PrivEstate', Icon: Twitter }]).map(({ href, Icon }) => (
            <a key={href} href={href} target="_blank" rel="noreferrer"
              style={{ width: 34, height: 34, borderRadius: '0.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', transition: 'color 0.2s,border-color 0.2s', textDecoration: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7CFF3A'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,255,58,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)'; }}
            >
              <Icon style={{ width: 15, height: 15 }} />
            </a>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>Product</div>
        {([{ l: 'Marketplace', t: 'marketplace' }, { l: 'Portfolio', t: 'portfolio' }, { l: 'Ownership Proof', t: 'ownership' }, { l: 'Compliance', t: 'compliance' }, { l: 'Proof Verifier', t: 'verifier' }] as { l: string; t: ActiveTab }[]).map(({ l, t }) => (
          <button key={t} onClick={() => onNavigate(t)} style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9375rem', color: '#6B7280', fontFamily: 'var(--font-body)', padding: '0.25rem 0', textAlign: 'left', transition: 'color 0.2s', marginBottom: '0.125rem', width: '100%' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6B7280'; }}
          >{l}</button>
        ))}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>Resources</div>
        {([{ l: 'Midnight Docs', h: 'https://docs.midnight.network' }, { l: 'Block Explorer', h: 'https://explorer.preprod.midnight.network' }, { l: 'GitHub', h: 'https://github.com/parasbabar/-Level-6-' }]).map(({ l, h }) => (
          <a key={h} href={h} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9375rem', color: '#6B7280', textDecoration: 'none', padding: '0.25rem 0', transition: 'color 0.2s', marginBottom: '0.125rem' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6B7280'; }}
          >{l} <ExternalLink style={{ width: 11, height: 11, opacity: 0.5 }} /></a>
        ))}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>Network</div>
        {([['Network', 'Midnight Preprod'], ['Contract', '2e5e3eea…1eaab9'], ['Circuits', 'proveOwnership, proveCompliance, proveRentalClaim']]).map(([k, v]) => (
          <div key={k} style={{ fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
            <span style={{ color: '#4B5563' }}>{k}: </span>
            <span style={{ color: '#6B7280', fontFamily: k === 'Contract' ? 'var(--font-mono)' : 'inherit', fontSize: k === 'Contract' ? '0.75rem' : 'inherit' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.8125rem', color: '#4B5563' }}>
      <span>© 2026 PrivEstate · Midnight Level 6 Supermoon</span>
      <span>Running on Midnight Preprod · Demo only · No real assets</span>
    </div>
    <style>{`@media(max-width:900px){footer div[style*="2fr 1fr 1fr 1fr"]{grid-template-columns:1fr 1fr!important}}@media(max-width:540px){footer div[style*="2fr 1fr 1fr 1fr"]{grid-template-columns:1fr!important}}`}</style>
  </footer>
);

/* ─── Main export (same props, same wallet/navigate logic) ───────────────── */
export const LandingPage: React.FC<LandingPageProps> = ({
  properties, onNavigate, walletStatus, onConnectWallet, shieldedAddress,
}) => {
  const handleNavigate = useCallback((tab: ActiveTab) => {
    onNavigate(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onNavigate]);

  return (
    <div style={{ background: '#050805', minHeight: '100vh' }}>
      <ScrollProgressBar />
      <Navbar
        onNavigate={handleNavigate}
        walletStatus={walletStatus}
        onConnectWallet={onConnectWallet}
        shieldedAddress={shieldedAddress}
      />
      <Hero onNavigate={handleNavigate} onConnectWallet={onConnectWallet} />
      <FeatureStrip onNavigate={handleNavigate} />
      <StatsSection properties={properties} />
      <HowItWorks onNavigate={handleNavigate} />
      <FeaturesGrid />
      <PropertiesSection properties={properties} onNavigate={handleNavigate} />
      <FAQ />
      <CTABanner onNavigate={handleNavigate} onConnectWallet={onConnectWallet} />
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default LandingPage;
