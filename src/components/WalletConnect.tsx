import React, { useState } from 'react';
import {
  Wallet,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
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
  status,
  walletName,
  walletIcon,
  shieldedAddress,
  walletSyncing,
  networkId,
  error,
  onConnect,
  onDisconnect,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (shieldedAddress) {
      navigator.clipboard.writeText(shieldedAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl text-slate-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        {/* Left: Wallet Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
            {walletIcon ? (
              <img src={walletIcon} alt={walletName || 'Wallet'} className="w-7 h-7 rounded-lg" />
            ) : (
              <Wallet className="w-6 h-6 text-indigo-400" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-base text-white">
                {walletName || 'Midnight Lace Wallet'}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-mono rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                Network: {networkId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>DApp Connector Standard (window.midnight)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Level 6 Supermoon
              </span>
            </p>
          </div>
        </div>

        {/* Right: Actions & State */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {status === 'connected' || status === 'syncing' ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{walletSyncing ? 'Wallet Connected — Syncing…' : 'Wallet Connected'}</span>
                </div>
                {shieldedAddress ? (
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <span className="text-[11px] font-mono text-slate-400">
                      {shieldedAddress.slice(0, 8)}...{shieldedAddress.slice(-6)}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      title="Copy full shielded address for faucet"
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ) : walletSyncing ? (
                  <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1 mt-0.5">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    Waiting for sync…
                  </span>
                ) : null}
              </div>
              <button
                onClick={onDisconnect}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition shadow-sm"
              >
                Disconnect
              </button>
            </div>
          ) : status === 'connecting' ? (
            <button
              disabled
              className="px-5 py-2.5 text-xs font-bold bg-indigo-600/50 text-indigo-200 rounded-xl flex items-center gap-2 cursor-wait"
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Connecting Wallet...</span>
            </button>
          ) : (
            <button
              onClick={onConnect}
              className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition transform hover:-translate-y-0.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Connect Midnight Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* Syncing Banner */}
      {walletSyncing && (
        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
          <div className="flex items-start gap-2.5">
            <RefreshCw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-spin" />
            <div>
              <p className="font-semibold text-amber-200">Midnight Wallet Syncing with Preprod</p>
              <p className="text-amber-300/80 mt-1 leading-relaxed">
                Your wallet is connected but still synchronizing with the Midnight Preprod network.
                Open the <strong className="text-amber-200">1AM (Midnight Lace)</strong> extension and wait for the sync bar to complete.
                Your shielded address will appear here automatically once ready.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error / Not Detected Alerts */}
      {status === 'wallet-not-detected' && (
        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">Midnight Wallet Extension Not Detected</p>
              <p className="text-amber-300/80 mt-1 leading-relaxed">
                To connect a live wallet, install the official{' '}
                <a
                  href="https://docs.midnight.network/develop/tutorial/building/prereqs#install-the-midnight-lace-wallet"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-semibold text-amber-200 hover:text-white inline-flex items-center gap-0.5"
                >
                  Midnight Lace Wallet <ExternalLink className="w-3 h-3 inline" />
                </a>{' '}
                and reload. You can still test all real Zero-Knowledge proofs and Compact circuits using the compiled in-browser verification engine below!
              </p>
            </div>
          </div>
        </div>
      )}

      {error && status === 'error' && (
        <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
