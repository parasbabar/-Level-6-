import React from 'react';
import { Building2, Shield, Lock, FileCheck, Award, Sparkles, ExternalLink, Rocket, Sliders } from 'lucide-react';
import type { WalletConnectionStatus } from '../hooks/useMidnight';

export type ActiveTab = 'deploy' | 'marketplace' | 'portfolio' | 'ownership' | 'compliance' | 'verifier' | 'admin';

interface LayoutProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  walletStatus: WalletConnectionStatus;
  shieldedAddress: string | null;
  networkId: string;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  onSelectTab,
  walletStatus,
  shieldedAddress,
  networkId,
  children,
}) => {
  const tabs = [
    { id: 'marketplace', label: 'RWA Marketplace', icon: Building2 },
    { id: 'portfolio', label: 'Shielded Portfolio', icon: Lock },
    { id: 'ownership', label: 'Ownership Proof', icon: Shield },
    { id: 'compliance', label: 'Compliance Proof', icon: Award },
    { id: 'verifier', label: 'Auditor Verifier', icon: FileCheck },
    { id: 'admin', label: 'Admin Dashboard', icon: Sliders },
    { id: 'deploy', label: 'Deploy Contract', icon: Rocket },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner: Privacy & Architecture Guarantee */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border-b border-indigo-500/20 py-1.5 px-4 text-center text-xs text-indigo-200 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>
          <strong>PrivEstate — Level 6 Supermoon Release</strong> | Zero-Knowledge Real World Asset Privacy on Midnight Network Preprod
        </span>
      </div>

      {/* Main Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('marketplace')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-white tracking-tight">PrivEstate</h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Level 6 Supermoon
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Private ownership. Verifiable real estate.</p>
            </div>
          </div>

          {/* Nav Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id as ActiveTab)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Network & Status Indicator */}
          <div className="flex items-center gap-2">
            {shieldedAddress && (
              <span className="hidden lg:inline text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                {shieldedAddress.slice(0, 6)}...{shieldedAddress.slice(-4)}
              </span>
            )}
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              <span className={`w-2 h-2 rounded-full ${walletStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{networkId}</span>
            </span>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex overflow-x-auto border-t border-slate-800 px-3 py-2 gap-1.5 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id as ActiveTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 bg-slate-900 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>PrivEstate — Midnight Level 6 Supermoon Submission</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xl">
              Verifiable RWA privacy platform refined based on genuine Level 5 user feedback. Midnight Preprod smart contract execution & Zero-Knowledge witness compliance.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href="https://docs.midnight.network"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-indigo-400 transition flex items-center gap-1"
            >
              <span>Midnight Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/parasbabar/-Level-6-.git"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-indigo-400 transition flex items-center gap-1"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
