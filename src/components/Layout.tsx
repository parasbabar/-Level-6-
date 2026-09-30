import React, { useState, useRef, useEffect } from 'react';
import {
  Building2, Shield, Lock, FileCheck, Award,
  ExternalLink, Rocket, Sliders, Menu, X,
  ChevronLeft, Copy, Check,
  ChevronDown, LogOut,
} from 'lucide-react';
import { PrivEstateLogo } from './PrivEstateLogo';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ScrollProgressBar } from './motion';
import { spring, dur, ease } from '../lib/motion';
import type { WalletConnectionStatus } from '../hooks/useMidnight';

export type ActiveTab =
  | 'deploy' | 'marketplace' | 'portfolio'
  | 'ownership' | 'compliance' | 'verifier' | 'admin';

interface LayoutProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  walletStatus: WalletConnectionStatus;
  shieldedAddress: string | null;
  networkId: string;
  children: React.ReactNode;
  onGoHome?: () => void;
}

const TABS: { id: ActiveTab; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'marketplace', label: 'Marketplace', icon: Building2 },
  { id: 'portfolio',   label: 'Portfolio',   icon: Lock      },
  { id: 'ownership',   label: 'Ownership',   icon: Shield    },
  { id: 'compliance',  label: 'Compliance',  icon: Award     },
  { id: 'verifier',    label: 'Verifier',    icon: FileCheck },
  { id: 'admin',       label: 'Admin',       icon: Sliders   },
  { id: 'deploy',      label: 'Deploy',      icon: Rocket    },
];

export const Layout: React.FC<LayoutProps> = ({
  activeTab, onSelectTab, walletStatus, shieldedAddress, networkId, children, onGoHome,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletDropOpen, setWalletDropOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const walletDropRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const isConnected = walletStatus === 'connected' || walletStatus === 'syncing';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!walletDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (walletDropRef.current && !walletDropRef.current.contains(e.target as Node))
        setWalletDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [walletDropOpen]);

  const copyAddress = () => {
    if (shieldedAddress) navigator.clipboard.writeText(shieldedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTab = (tab: ActiveTab) => { onSelectTab(tab); setMobileOpen(false); };

  const addrShort = shieldedAddress
    ? `${shieldedAddress.slice(0, 6)}…${shieldedAddress.slice(-4)}`
    : null;

  return (
    <div className="app-shell">
      <ScrollProgressBar />

      {/* ── Fixed navbar ──────────────────────────────────────────────────── */}
      <motion.header
        className="app-navbar"
        style={{
          background: scrolled ? 'rgba(5,8,5,0.92)' : 'rgba(5,8,5,0.70)',
          backdropFilter: scrolled ? 'blur(20px)' : 'blur(8px)',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'blur(8px)',
          borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)'}`,
          transition: 'background 0.3s, border-color 0.3s, backdrop-filter 0.3s',
        }}
      >
        <div className="pg-container app-navbar-inner">

          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
            {onGoHome && (
              <motion.button
                onClick={onGoHome}
                whileHover={reduced ? {} : { x: -2 }}
                whileTap={reduced ? {} : { scale: 0.95 }}
                transition={{ duration: dur.micro }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-pill)',
                  padding: '5px 10px',
                  color: 'var(--text-3)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
                aria-label="Home"
              >
                <ChevronLeft style={{ width: 13, height: 13 }} />
                Home
              </motion.button>
            )}

            <button
              onClick={onGoHome}
              style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              aria-label="PrivEstate home"
            >
              <PrivEstateLogo size="md" showText={true} animate={!reduced} />
            </button>
          </div>

          {/* Center: tabs with sliding layoutId pill */}
          <nav
            style={{ display: 'flex', alignItems: 'center', gap: '2px', overflow: 'hidden' }}
            className="desktop-nav"
            role="navigation"
            aria-label="App tabs"
          >
            {TABS.map(t => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTab(t.id)}
                  aria-current={active ? 'page' : undefined}
                  style={{
                    position: 'relative',
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    padding: '6px 12px', height: 34,
                    borderRadius: 'var(--r-pill)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.875rem', fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                    transition: 'color 0.18s',
                    whiteSpace: 'nowrap',
                    zIndex: 1,
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
                >
                  {/* Sliding active pill */}
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      style={{
                        position: 'absolute', inset: 0,
                        borderRadius: 'var(--r-pill)',
                        background: 'var(--green-dim)',
                        border: '1px solid var(--green-border)',
                        zIndex: -1,
                      }}
                      transition={spring.pill}
                    />
                  )}
                  <motion.span
                    animate={reduced ? {} : active ? { color: 'var(--green)' } : {}}
                    transition={{ duration: dur.fast }}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Icon style={{ width: 13, height: 13 }} />
                  </motion.span>
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
            {/* Network badge with pulse */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '4px 10px',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-pill)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-4)',
            }}>
              <motion.span
                style={{ width: 7, height: 7, borderRadius: '50%', background: isConnected ? 'var(--green)' : 'var(--amber)', display: 'block', flexShrink: 0 }}
                animate={reduced ? {} : isConnected ? { boxShadow: ['0 0 0px rgba(124,255,58,0)', '0 0 8px rgba(124,255,58,0.8)', '0 0 0px rgba(124,255,58,0)'] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              />
              {networkId}
            </div>

            {/* Wallet chip */}
            {isConnected && addrShort ? (
              <div ref={walletDropRef} style={{ position: 'relative' }}>
                <motion.button
                  onClick={() => setWalletDropOpen(v => !v)}
                  whileHover={reduced ? {} : { boxShadow: '0 0 12px rgba(124,255,58,0.2)' }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    padding: '5px 12px',
                    background: 'var(--green-dim)',
                    border: '1px solid var(--green-border)',
                    borderRadius: 'var(--r-pill)',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--green)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                  {addrShort}
                  <motion.span animate={{ rotate: walletDropOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown style={{ width: 12, height: 12 }} />
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {walletDropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.18, ease }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                        width: 200,
                        background: 'rgba(10,16,10,0.98)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 'var(--r-lg)',
                        padding: '0.5rem',
                        backdropFilter: 'blur(16px)',
                        zIndex: 200,
                      }}
                    >
                      <button
                        onClick={copyAddress}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--r-md)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-2)', fontFamily: 'var(--font-body)', transition: 'background 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                      >
                        {copied ? <Check style={{ width: 14, height: 14, color: 'var(--green)' }} /> : <Copy style={{ width: 14, height: 14 }} />}
                        {copied ? 'Copied!' : 'Copy address'}
                      </button>
                      <button
                        onClick={() => { setWalletDropOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--r-md)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--rose)', fontFamily: 'var(--font-body)', transition: 'background 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--rose-dim)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                      >
                        <LogOut style={{ width: 14, height: 14 }} /> Disconnect
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                whileTap={reduced ? {} : { scale: 0.96 }}
                transition={{ duration: dur.micro }}
                style={{
                  padding: '5px 14px', borderRadius: 'var(--r-pill)',
                  background: 'linear-gradient(180deg,#8CFF4A 0%,#2E7D0B 100%)',
                  border: 'none', color: '#020802',
                  fontSize: '0.875rem', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                Connect
              </motion.button>
            )}

            {/* Mobile hamburger */}
            <motion.button
              onClick={() => setMobileOpen(v => !v)}
              whileTap={reduced ? {} : { scale: 0.94 }}
              style={{
                display: 'none', padding: '0.4rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)',
                color: '#fff', cursor: 'pointer',
              }}
              className="mobile-menu-toggle"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={mobileOpen ? 'x' : 'm'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.14 }} style={{ display: 'flex' }}>
                  {mobileOpen ? <X style={{ width: 17, height: 17 }} /> : <Menu style={{ width: 17, height: 17 }} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease }}
              style={{ overflow: 'hidden', borderTop: '1px solid var(--border)', background: 'rgba(5,8,5,0.97)', backdropFilter: 'blur(20px)' }}
            >
              <div style={{ padding: '0.875rem var(--sp-4) 1.25rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {TABS.map((t, i) => {
                  const Icon = t.icon;
                  const active = activeTab === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => handleTab(t.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 0.875rem', borderRadius: 'var(--r-md)',
                        background: active ? 'var(--green-dim)' : 'none',
                        border: `1px solid ${active ? 'var(--green-border)' : 'transparent'}`,
                        color: active ? 'var(--green)' : 'var(--text-3)',
                        fontSize: '0.9375rem', fontWeight: active ? 600 : 400,
                        cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left',
                      }}
                    >
                      <Icon style={{ width: 15, height: 15 }} />
                      {t.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main */}
      <main className="app-main" role="main">
        <div className="pg-container">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: 'var(--sp-5) 0', marginTop: 'var(--sp-8)' }}>
        <div className="pg-container" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-4)' }}>PrivEstate · Midnight Preprod · Level 6 Supermoon</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { label: 'Midnight Docs', href: 'https://docs.midnight.network' },
              { label: 'Explorer', href: 'https://explorer.preprod.midnight.network' },
            ].map(({ label, href }) => (
              <a key={href} href={href} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--text-4)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--green)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-4)'; }}
              >
                {label} <ExternalLink style={{ width: 10, height: 10 }} />
              </a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 1024px) { .desktop-nav { display: none !important; } .mobile-menu-toggle { display: flex !important; } }
      `}</style>
    </div>
  );
};
