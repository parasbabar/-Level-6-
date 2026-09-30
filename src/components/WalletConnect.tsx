import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Wallet, ShieldCheck, AlertCircle, ExternalLink,
  RefreshCw, CheckCircle2, Lock, Copy, Check,
} from 'lucide-react';
import { useToast } from './motion';
import { dur, spring } from '../lib/motion';
import type { WalletConnectionStatus } from '../hooks/useMidnight';

interface WalletConnectProps {
  status: WalletConnectionStatus;
  walletName: string | null;
  walletIcon: string | null;
  shieldedAddress: string | null;
  walletSyncing: boolean;
  networkId: string;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  status, walletName, walletIcon, shieldedAddress, walletSyncing,
  networkId, error, onConnect, onDisconnect,
}) => {
  const [copied, setCopied] = useState(false);
  const [prevStatus, setPrevStatus] = useState<WalletConnectionStatus>(status);
  const reduced = useReducedMotion();
  const { toast } = useToast();
  const isConn = status === 'connected' || status === 'syncing';

  // Toast on connect/disconnect
  useEffect(() => {
    if (prevStatus !== status) {
      if (status === 'connected' && prevStatus === 'connecting') {
        toast('Wallet connected', 'success');
      } else if (status === 'disconnected' && prevStatus === 'connected') {
        toast('Wallet disconnected', 'info');
      }
      setPrevStatus(status);
    }
  }, [status, prevStatus, toast]);

  const copy = () => {
    if (shieldedAddress) {
      navigator.clipboard.writeText(shieldedAddress);
      setCopied(true);
      toast('Address copied', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.section, ease: [0.22, 1, 0.36, 1] }}
      className={`wallet-banner ${isConn ? 'wallet-banner-connected' : ''}`}
    >
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
        <motion.div
          animate={isConn ? { borderColor: 'var(--green-border)', background: 'var(--green-dim)' } : {}}
          transition={{ duration: dur.normal }}
          style={{
            width: 42, height: 42,
            borderRadius: 'var(--r-md)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <AnimatePresence mode="wait">
            {walletIcon ? (
              <motion.img
                key="wallet-icon"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: dur.fast }}
                src={walletIcon}
                alt={walletName || 'Wallet'}
                style={{ width: 24, height: 24, borderRadius: 4 }}
              />
            ) : (
              <motion.div
                key="wallet-default"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: dur.fast }}
              >
                <Wallet style={{ width: 18, height: 18, color: isConn ? 'var(--green)' : 'var(--text-3)' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}>
              {walletName || 'Midnight Lace Wallet'}
            </span>
            <span className="badge badge-green" style={{ fontSize: '0.625rem' }}>{networkId}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginTop: '2px' }}>
            <Lock style={{ width: 11, height: 11, color: isConn ? 'var(--cyan)' : 'var(--text-5)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-4)', fontFamily: 'var(--font-body)' }}>
              DApp Connector Standard
            </span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <AnimatePresence mode="wait">
          {isConn ? (
            <motion.div
              key="connected"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: dur.normal }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--green)', justifyContent: 'flex-end' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={spring.snappy}
                >
                  <CheckCircle2 style={{ width: 14, height: 14 }} />
                </motion.div>
                {walletSyncing ? 'Syncing…' : 'Connected'}
              </div>
              {shieldedAddress && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: dur.fast }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '2px', justifyContent: 'flex-end' }}
                >
                  <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-4)' }}>
                    {shieldedAddress.slice(0, 8)}…{shieldedAddress.slice(-6)}
                  </span>
                  <motion.button
                    whileTap={reduced ? {} : { scale: 0.9 }}
                    onClick={copy}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--green)' : 'var(--text-4)', display: 'flex', padding: 2 }}
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                          <Check style={{ width: 11, height: 11 }} />
                        </motion.div>
                      ) : (
                        <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                          <Copy style={{ width: 11, height: 11 }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          ) : status === 'connecting' ? (
            <motion.button
              key="connecting"
              disabled
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: dur.fast }}
              className="btn btn-primary"
              style={{ opacity: 0.6 }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                style={{ display: 'flex' }}
              >
                <RefreshCw style={{ width: 14, height: 14 }} />
              </motion.span>
              Connecting…
            </motion.button>
          ) : (
            <motion.button
              key="connect"
              onClick={onConnect}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileTap={reduced ? {} : { scale: 0.97 }}
              transition={{ duration: dur.fast }}
              className="btn btn-primary"
            >
              <ShieldCheck style={{ width: 15, height: 15 }} />
              Connect Wallet
            </motion.button>
          )}
        </AnimatePresence>

        {isConn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: dur.normal }}
            whileTap={reduced ? {} : { scale: 0.97 }}
            onClick={onDisconnect}
            className="btn btn-ghost btn-sm"
          >
            Disconnect
          </motion.button>
        )}
      </div>

      {/* Syncing alert */}
      <AnimatePresence>
        {walletSyncing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: dur.normal }}
            className="alert alert-amber"
            style={{ width: '100%', marginTop: 'var(--sp-2)', overflow: 'hidden' }}
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ display: 'flex' }}
            >
              <RefreshCw style={{ width: 16, height: 16, color: 'var(--amber)', flexShrink: 0 }} />
            </motion.span>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: '0.2rem', fontSize: '0.9rem' }}>Wallet Syncing with Midnight Preprod</p>
              <p style={{ color: 'var(--text-3)', lineHeight: 1.6, fontSize: '0.875rem' }}>
                Open <strong style={{ color: 'var(--text-2)' }}>Midnight Lace</strong> and wait for the sync bar to complete.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status === 'wallet-not-detected' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: dur.normal }}
            className="alert alert-amber"
            style={{ width: '100%', marginTop: 'var(--sp-2)', overflow: 'hidden' }}
          >
            <AlertCircle style={{ width: 16, height: 16, color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
            <p style={{ color: 'var(--text-3)', lineHeight: 1.6, fontSize: '0.875rem' }}>
              Install the{' '}
              <a href="https://docs.midnight.network/develop/tutorial/building/prereqs#install-the-midnight-lace-wallet"
                target="_blank" rel="noreferrer"
                style={{ color: 'var(--amber)', textDecoration: 'underline' }}>
                Midnight Lace Wallet <ExternalLink style={{ display: 'inline', width: 11, height: 11 }} />
              </a>{' '}
              and reload. ZK circuits are still available for testing.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && status === 'error' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: dur.normal }}
            className="alert alert-rose"
            style={{ width: '100%', marginTop: 'var(--sp-2)', overflow: 'hidden' }}
          >
            <AlertCircle style={{ width: 16, height: 16, color: 'var(--rose)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
