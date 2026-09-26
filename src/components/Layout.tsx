import React, { useState } from 'react';
import {
  Building2,
  Shield,
  Lock,
  FileCheck,
  Award,
  Sparkles,
  ExternalLink,
  Rocket,
  Sliders,
  Menu,
  X,
  CheckCircle2,
} from 'lucide-react';
import { PrivEstateLogo } from './PrivEstateLogo';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navGroups = [
    {
      group: 'Core',
      tabs: [
        { id: 'marketplace' as ActiveTab, label: 'Marketplace', icon: Building2 },
        { id: 'portfolio' as ActiveTab, label: 'Portfolio', icon: Lock },
      ],
    },
    {
      group: 'ZK Proofs',
      tabs: [
        { id: 'ownership' as ActiveTab, label: 'Ownership Proof', icon: Shield },
        { id: 'compliance' as ActiveTab, label: 'Compliance', icon: Award },
        { id: 'verifier' as ActiveTab, label: 'Verifier', icon: FileCheck },
      ],
    },
    {
      group: 'Manage',
      tabs: [
        { id: 'admin' as ActiveTab, label: 'Admin', icon: Sliders },
        { id: 'deploy' as ActiveTab, label: 'Deploy', icon: Rocket },
      ],
    },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner: Privacy & Architecture Guarantee */}
      <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-emerald-950/80 border-b border-indigo-500/20 py-2 px-4 text-center text-xs text-indigo-200 flex items-center justify-center gap-2 backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>
          <strong className="text-white">PrivEstate — Level 6 Supermoon Release</strong>
          <span className="hidden sm:inline"> | Privacy-Preserving Fractional Real Estate on Midnight Preprod</span>
        </span>
        <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" /> ZK Compact Verified
        </span>
      </div>

      {/* Main Header / Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Custom Brand Logo & Wordmark */}
          <div
            className="cursor-pointer flex items-center gap-3 group"
            onClick={() => handleTabClick('marketplace')}
          >
            <PrivEstateLogo size="md" showWordmark={true} showSubtitle={true} />
            <span className="hidden xl:inline text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Supermoon
            </span>
          </div>

          {/* Grouped Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800/80">
            {navGroups.map((g, gIdx) => (
              <React.Fragment key={g.group}>
                {gIdx > 0 && <div className="w-px h-4 bg-slate-800 mx-1" />}
                <div className="flex items-center gap-1">
                  {g.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition duration-150 ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </nav>

          {/* Quick Network & Wallet Status Indicator + Mobile Menu Toggle */}
          <div className="flex items-center gap-2.5">
            {shieldedAddress && (
              <span className="hidden sm:inline text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                {shieldedAddress.slice(0, 6)}...{shieldedAddress.slice(-4)}
              </span>
            )}

            <div className="flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  walletStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-[11px] font-medium">{networkId}</span>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 py-3 space-y-3 animate-fade-in shadow-2xl">
            {navGroups.map((g) => (
              <div key={g.group} className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2">
                  {g.group}
                </div>
                {g.tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-300 hover:bg-slate-800/80 bg-slate-950/40 border border-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </div>
                      {isActive && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-700">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Horizontal scroll tabs for medium screens when menu is closed */}
        <div className="hidden md:flex lg:hidden overflow-x-auto border-t border-slate-800/80 px-4 py-2 gap-1.5 no-scrollbar bg-slate-950/40">
          {navGroups.flatMap((g) => g.tabs).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-200'
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
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-10 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <PrivEstateLogo size="sm" showWordmark={true} showSubtitle={false} />
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-300 font-semibold">
                <span>PrivEstate — Midnight Level 6 Supermoon Submission</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xl leading-relaxed">
                Institutional-grade Real-World Asset (RWA) fractionalization powered by Midnight Network Preprod. Zero-Knowledge proofs protect confidential ownership, compliance, and rental yield.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <a
              href="https://docs.midnight.network"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-indigo-400 transition flex items-center gap-1"
            >
              <span>Midnight Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="https://explorer.preprod.midnight.network"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-emerald-400 transition flex items-center gap-1"
            >
              <span>Preprod Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-700">•</span>
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
