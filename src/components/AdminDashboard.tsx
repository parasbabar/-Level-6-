import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Building2,
  PlusCircle,
  ShieldCheck,
  AlertCircle,
  Layers,
  DollarSign,
  PieChart,
  Info,
  Lock,
  RefreshCw,
  X,
  MapPin,
  Search,
} from 'lucide-react';
import type { PropertyMetadata } from '../utils/contract';
import { calculateAvailableShares, ensure32BytesId } from '../utils/contract';
import { getSafeWalletFingerprint, type WalletConnectionStatus } from '../hooks/useMidnight';

interface AdminDashboardProps {
  properties: PropertyMetadata[];
  onAddProperty: (newProp: PropertyMetadata) => Promise<void>;
  onNavigateToMarketplace: () => void;
  isAdmin?: boolean;
  adminWalletAddress?: string;
  connectedWalletAddress?: string | null;
  walletStatus?: WalletConnectionStatus;
  isRefreshingInventory?: boolean;
  onRefreshInventory?: () => void;
}

const FILTER_CHIPS = ['All', 'Residential', 'Commercial', 'Luxury', 'Industrial'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  properties,
  onAddProperty,
  isAdmin = false,
  adminWalletAddress = '',
  connectedWalletAddress = null,
  walletStatus = 'disconnected',
  isRefreshingInventory = false,
  onRefreshInventory,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [assetType, setAssetType] = useState('Residential Multifamily');
  const [totalValuationUsd, setTotalValuationUsd] = useState<number>(4_500_000);
  const [totalShares, setTotalShares] = useState<number>(90_000);
  const [complianceMinimumUsd, setComplianceMinimumUsd] = useState<number>(200_000);
  const [projectedYieldApy, setProjectedYieldApy] = useState('8.2%');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80');
  const [formError, setFormError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Aggregated Statistics ─────────────────────────────────
  const totalValuationAll = properties.reduce((acc, p) => acc + p.totalValuationUsd, 0);
  const totalSharesAll    = properties.reduce((acc, p) => acc + p.totalShares, 0n);
  const totalAcquiredAll  = properties.reduce((acc, p) => acc + p.acquiredShares, 0n);
  const totalAvailableAll = properties.reduce((acc, p) => acc + p.availableShares, 0n);

  const acquiredPctAll = totalSharesAll > 0n
    ? Number((totalAcquiredAll * 10000n) / totalSharesAll) / 100
    : 0;

  const isConnected = walletStatus === 'connected' || Boolean(connectedWalletAddress);

  // ── Filtered rows ─────────────────────────────────────────
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === 'All' ||
        p.assetType.toLowerCase().includes(activeFilter.toLowerCase());

      return matchesSearch && matchesFilter;
    });
  }, [properties, activeFilter, searchQuery]);

  // ── Form helpers ──────────────────────────────────────────
  const handleResetForm = () => {
    setName('');
    setLocation('');
    setAssetType('Residential Multifamily');
    setTotalValuationUsd(4_500_000);
    setTotalShares(90_000);
    setComplianceMinimumUsd(200_000);
    setProjectedYieldApy('8.2%');
    setImageUrl('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80');
    setFormError(null);
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isAdmin) {
      setFormError(
        `Action rejected: Connected wallet (${getSafeWalletFingerprint(connectedWalletAddress)}) is not authorized as the platform admin (${getSafeWalletFingerprint(adminWalletAddress)}).`
      );
      return;
    }
    if (!name.trim())       { setFormError('Property name is required.');           return; }
    if (!location.trim())   { setFormError('Property location is required.');        return; }
    if (totalValuationUsd <= 0) { setFormError('Total Valuation must be positive.'); return; }
    if (totalShares <= 0)   { setFormError('Total Share Supply must be > 0.');       return; }
    if (complianceMinimumUsd <= 0) { setFormError('Compliance minimum must be > 0.'); return; }

    const calculatedAvailable = calculateAvailableShares(BigInt(totalShares), 0n);
    const nextIndex   = properties.length + 1;
    const generatedId = `PROP-${String(nextIndex).padStart(3, '0')}`;
    const bytesId     = ensure32BytesId(generatedId);

    const newProperty: PropertyMetadata = {
      id: generatedId,
      bytesId,
      name: name.trim(),
      location: location.trim(),
      assetType,
      totalValuationUsd,
      totalShares: BigInt(totalShares),
      complianceMinimumUsd: BigInt(complianceMinimumUsd),
      projectedYieldApy: projectedYieldApy.trim() || '8.0%',
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      status: 'Preprod Verified',
      acquiredShares: 0n,
      availableShares: calculatedAvailable,
    };

    setIsPublishing(true);
    try {
      await onAddProperty(newProperty);
      setIsModalOpen(false);
      handleResetForm();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to add property due to authorization or validation error.');
    } finally {
      setIsPublishing(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────
  const fmtCompact = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };

  return (
    <div style={{ padding: '28px 32px 48px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1280px', margin: '0 auto' }}>

      {/* ══════════════════════════════════════════════════════
          1. WALLET STATUS STRIP
      ══════════════════════════════════════════════════════ */}
      <div style={{ padding: '4px 4px', gap: '12px', display: 'flex', alignItems: 'center' }}>
        {/* Connected pill */}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0"
          style={{
            background: isConnected ? 'rgba(124,255,58,0.10)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isConnected ? 'rgba(124,255,58,0.28)' : 'rgba(255,255,255,0.12)'}`,
            color: isConnected ? '#7CFF3A' : '#9CA3AF',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              background: isConnected ? '#7CFF3A' : '#6B7280',
              boxShadow: isConnected ? '0 0 6px rgba(124,255,58,0.7)' : 'none',
            }}
          />
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>

        {/* 1AM label */}
        <span className="text-[13px] font-medium text-white shrink-0">1AM</span>

        {/* PREPROD pill */}
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold shrink-0"
          style={{
            background: 'rgba(34,211,238,0.10)',
            border: '1px solid rgba(34,211,238,0.28)',
            color: '#22D3EE',
          }}
        >
          PREPROD
        </span>

        {/* DApp connector label — flex-1 pushes right content away */}
        <span className="flex-1 min-w-0 flex items-center gap-1.5 text-[12px] text-white/40">
          <Lock className="w-3 h-3 shrink-0" />
          <span className="truncate">DApp Connector Standard</span>
        </span>

        {/* Wallet address */}
        {connectedWalletAddress && (
          <span className="font-mono text-[11px] text-white/50 truncate max-w-[160px] shrink-0">
            {connectedWalletAddress.slice(0, 10)}…{connectedWalletAddress.slice(-6)}
          </span>
        )}

        {/* Disconnect button */}
        <button
          type="button"
          className="text-[11px] font-medium text-white/60 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white/90 transition shrink-0 cursor-pointer rounded-lg"
          style={{ height: '32px', padding: '0 12px' }}
        >
          Disconnect
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          2. HERO CARD
      ══════════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ padding: 0, border: '1px solid #1c281f', background: '#0e150f', borderRadius: '16px' }}
      >
        <div className="grid grid-cols-[1.15fr_1fr]">
          {/* Left ─ title + actions */}
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
            {/* Auth badge */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider"
              style={{
                padding: '4px 12px',
                marginBottom: '16px',
                alignSelf: 'flex-start',
                background: isAdmin ? 'rgba(124,255,58,0.10)' : 'rgba(245,158,11,0.10)',
                border: `1px solid ${isAdmin ? 'rgba(124,255,58,0.28)' : 'rgba(245,158,11,0.28)'}`,
                color: isAdmin ? '#7CFF3A' : '#F59E0B',
              }}
            >
              <ShieldCheck className="w-3 h-3" />
              {isAdmin ? 'Admin authorized' : 'Read-only mode'}
            </span>

            {/* H1 */}
            <h1
              style={{ margin: '0 0 10px', fontSize: '32px', lineHeight: 1.15, fontWeight: 500, letterSpacing: '-0.025em', fontFamily: 'var(--font-display)', color: 'white' }}
            >
              RWA property console
            </h1>

            {/* Subtitle */}
            <p style={{ margin: 0, maxWidth: '440px', lineHeight: 1.6, fontSize: '15px', color: 'rgba(255,255,255,0.50)' }}>
              Issue, configure and publish fractional real estate assets to the Midnight Preprod RWA Marketplace.
            </p>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '28px', alignItems: 'center' }}>
              {/* Sync Registry — outline */}
              {onRefreshInventory && (
                <button
                  type="button"
                  onClick={onRefreshInventory}
                  disabled={isRefreshingInventory}
                  className="transition cursor-pointer disabled:opacity-50"
                  style={{
                    height: '42px',
                    padding: '0 18px',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.80)',
                  }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingInventory ? 'animate-spin' : ''}`} style={{ color: '#7CFF3A' }} />
                  {isRefreshingInventory ? 'Syncing…' : 'Sync registry'}
                </button>
              )}

              {/* Add New Property — solid green */}
              <button
                type="button"
                onClick={() => {
                  if (!isAdmin) {
                    setFormError('Unauthorized: You must connect the admin wallet to add properties.');
                    return;
                  }
                  setIsModalOpen(true);
                }}
                disabled={!isAdmin}
                className="transition"
                style={
                  isAdmin
                    ? { height: '42px', padding: '0 18px', gap: '8px', fontSize: '13px', fontWeight: 600, borderRadius: '10px', display: 'flex', alignItems: 'center', background: '#7CFF3A', color: '#020802', cursor: 'pointer' }
                    : { height: '42px', padding: '0 18px', gap: '8px', fontSize: '13px', fontWeight: 600, borderRadius: '10px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'not-allowed' }
                }
              >
                {isAdmin ? <PlusCircle className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {isAdmin ? 'Add new property' : 'Admin Restricted'}
              </button>
            </div>
          </div>

          {/* Right ─ share allocation panel */}
          <div
            style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px', borderLeft: '1px solid #1c281f' }}
          >
            {/* Row 1 — label + fraction */}
            <div className="flex items-center justify-between min-w-0 gap-3">
              <span className="text-[12px] text-white/50 truncate">Share allocation, all assets</span>
              <span className="font-mono text-[13px] font-medium text-white shrink-0">
                {totalAcquiredAll.toLocaleString()} / {totalSharesAll.toLocaleString()}
              </span>
            </div>

            {/* Row 2 — 12px tall rounded bar */}
            <div style={{ height: '12px', margin: '4px 0', borderRadius: '9999px', overflow: 'hidden', background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, acquiredPctAll)}%`,
                  background: 'linear-gradient(90deg, #7CFF3A 0%, #2E7D0B 100%)',
                  boxShadow: '0 0 10px rgba(124,255,58,0.4)',
                }}
              />
            </div>

            {/* Row 3 — two mini-stat cols */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              <div className="flex flex-col min-w-0">
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acquired</span>
                <span style={{ fontSize: '22px', marginTop: '4px', fontFamily: 'var(--font-mono)', fontWeight: 500, lineHeight: 1.1, color: 'white' }} className="truncate">
                  {acquiredPctAll.toFixed(1)}%
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available now</span>
                <span style={{ fontSize: '22px', marginTop: '4px', fontFamily: 'var(--font-mono)', fontWeight: 500, lineHeight: 1.1, color: '#7CFF3A' }} className="truncate">
                  {totalAvailableAll.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          3. STAT CARDS — 4-col grid
      ══════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* Total RWA Assets */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '16px', border: '1px solid #1c281f', background: '#0e150f', minWidth: 0 }}>
          <div
            style={{ width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Building2 className="w-4 h-4 text-white/70" />
          </div>
          <div className="min-w-0">
            <div className="truncate" style={{ fontSize: '32px', lineHeight: 1, fontFamily: 'var(--font-mono)', fontWeight: 500, letterSpacing: '-0.03em', color: 'white' }}>
              {properties.length}
            </div>
            <div style={{ fontSize: '13px', marginTop: '10px', color: 'rgba(255,255,255,0.40)' }} className="truncate">Total RWA assets</div>
          </div>
        </div>

        {/* Total Listed Valuation */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '16px', border: '1px solid rgba(124,255,58,0.2)', background: 'rgba(124,255,58,0.04)', minWidth: 0 }}>
          <div
            style={{ width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: 0, background: 'rgba(124,255,58,0.10)', border: '1px solid rgba(124,255,58,0.25)' }}
          >
            <DollarSign className="w-4 h-4" style={{ color: '#7CFF3A' }} />
          </div>
          <div className="min-w-0">
            <div className="truncate" style={{ fontSize: '32px', lineHeight: 1, fontFamily: 'var(--font-mono)', fontWeight: 500, letterSpacing: '-0.03em', color: '#7CFF3A' }}>
              {fmtCompact(totalValuationAll)}
            </div>
            <div style={{ fontSize: '13px', marginTop: '10px', color: 'rgba(255,255,255,0.40)' }} className="truncate">Total listed valuation</div>
          </div>
        </div>

        {/* Total Share Supply */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '16px', border: '1px solid rgba(34,211,238,0.2)', background: 'rgba(34,211,238,0.04)', minWidth: 0 }}>
          <div
            style={{ width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: 0, background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.25)' }}
          >
            <PieChart className="w-4 h-4" style={{ color: '#22D3EE' }} />
          </div>
          <div className="min-w-0">
            <div className="truncate" style={{ fontSize: '32px', lineHeight: 1, fontFamily: 'var(--font-mono)', fontWeight: 500, letterSpacing: '-0.03em', color: 'white' }}>
              {totalSharesAll.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', marginTop: '10px', color: 'rgba(255,255,255,0.40)' }} className="truncate">Total share supply</div>
          </div>
        </div>

        {/* Marketplace Allocation */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '16px', border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.04)', minWidth: 0 }}>
          <div
            style={{ width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: 0, background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <Layers className="w-4 h-4" style={{ color: '#A78BFA' }} />
          </div>
          <div className="min-w-0">
            <div className="truncate" style={{ fontSize: '32px', lineHeight: 1, fontFamily: 'var(--font-mono)', fontWeight: 500, letterSpacing: '-0.03em', color: '#A78BFA' }}>
              {totalAvailableAll.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', marginTop: '10px', color: 'rgba(255,255,255,0.40)' }} className="truncate">Marketplace allocation</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          4. SECURITY NOTE
      ══════════════════════════════════════════════════════ */}
      <div
        style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', lineHeight: 1.7, borderRadius: '16px', border: '1px solid #1c281f', background: '#0e150f' }}
        className="min-w-0"
      >
        <Info style={{ width: '20px', height: '20px', flexShrink: 0, color: '#7CFF3A' }} />
        <p className="text-[12px] text-white/60 min-w-0" style={{ margin: 0 }}>
          <strong className="text-white/80 font-semibold">Midnight Compact security model. </strong>
          Properties created via this console are structured with deterministic Compact parameters —{' '}
          <span
            style={{ padding: '2px 8px', margin: '0 2px', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'rgba(124,255,58,0.08)', border: '1px solid rgba(124,255,58,0.25)', color: '#7CFF3A', display: 'inline-flex', alignItems: 'center' }}
          >propertyId</span>{' '}
          <span
            style={{ padding: '2px 8px', margin: '0 2px', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'rgba(124,255,58,0.08)', border: '1px solid rgba(124,255,58,0.25)', color: '#7CFF3A', display: 'inline-flex', alignItems: 'center' }}
          >totalShares</span>{' '}
          <span
            style={{ padding: '2px 8px', margin: '0 2px', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'rgba(124,255,58,0.08)', border: '1px solid rgba(124,255,58,0.25)', color: '#7CFF3A', display: 'inline-flex', alignItems: 'center' }}
          >complianceMinimum</span>
          . Private keys and admin secrets are never placed in frontend source code.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          5. INVENTORY TABLE
      ══════════════════════════════════════════════════════ */}
      <div style={{ overflow: 'hidden', padding: 0, borderRadius: '16px', border: '1px solid #1c281f' }}>
        {/* Toolbar */}
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', background: '#0e150f', borderBottom: '1px solid #1c281f' }}>
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-white font-medium truncate" style={{ fontSize: '20px' }}>
              Property inventory
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.70)' }}
            >
              {filteredProperties.length}
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-white/40 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7CFF3A' }} />
              Live preprod registry
            </span>
          </div>

          {/* Right — filter chips + search */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div style={{ display: 'flex', gap: '8px' }}>
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setActiveFilter(chip)}
                  className="transition cursor-pointer"
                  style={
                    activeFilter === chip
                      ? { padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, background: 'rgba(124,255,58,0.12)', border: '1px solid rgba(124,255,58,0.35)', color: '#7CFF3A' }
                      : { padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)' }
                  }
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div style={{ position: 'relative', flexShrink: 0, minWidth: '220px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'rgba(255,255,255,0.30)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search properties…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:outline-none transition"
                style={{
                  height: '38px',
                  paddingLeft: '38px',
                  paddingRight: '12px',
                  minWidth: '220px',
                  width: '100%',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '12px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Table — horizontally scrollable */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '1080px' }}>
            {/* Column headers */}
            <div
              style={{
                padding: '12px 24px',
                display: 'grid',
                gridTemplateColumns: '84px minmax(0,2.2fr) minmax(0,1.5fr) 110px 90px minmax(0,1.5fr) 100px 120px 32px',
                gap: '16px',
                alignItems: 'center',
                background: '#0b110c',
                color: 'rgba(255,255,255,0.35)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}
            >
              <span>Asset ID</span>
              <span>Property</span>
              <span>Location</span>
              <span>Valuation</span>
              <span>Shares</span>
              <span>Acquired</span>
              <span>Available</span>
              <span>Status</span>
              <span />
            </div>

            {/* Rows */}
            {filteredProperties.length === 0 ? (
              <div style={{ padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.25)' }}>
                <Building2 className="w-8 h-8 opacity-40" />
                <span className="text-[13px]">No properties match your filter</span>
              </div>
            ) : (
              filteredProperties.map((prop) => {
                const rowAcqPct = prop.totalShares > 0n
                  ? Number((prop.acquiredShares * 10000n) / prop.totalShares) / 100
                  : 0;

                return (
                  <div
                    key={prop.id}
                    className="transition-colors"
                    style={{
                      padding: '16px 24px',
                      display: 'grid',
                      gridTemplateColumns: '84px minmax(0,2.2fr) minmax(0,1.5fr) 110px 90px minmax(0,1.5fr) 100px 120px 32px',
                      columnGap: '16px',
                      alignItems: 'center',
                      borderTop: '1px solid #1c281f',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#0c130d')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Asset ID */}
                    <span className="font-mono text-[13px] font-medium truncate" style={{ color: '#7CFF3A' }}>
                      {prop.id}
                    </span>

                    {/* Property — 48px thumbnail + name/type text */}
                    <div className="flex items-center min-w-0">
                      <img
                        src={prop.imageUrl}
                        alt={prop.name}
                        style={{ width: '48px', height: '48px', marginRight: '12px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <div className="flex flex-col min-w-0" style={{ gap: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'white' }} className="truncate">{prop.name}</span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)' }} className="truncate">{prop.assetType}</span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3 h-3 shrink-0 text-white/30" />
                      <span className="text-[12px] text-white/60 truncate">{prop.location}</span>
                    </div>

                    {/* Valuation */}
                    <span className="font-mono text-[12px] font-medium text-white truncate">
                      ${prop.totalValuationUsd.toLocaleString()}
                    </span>

                    {/* Shares */}
                    <span className="font-mono text-[12px] text-white/70 truncate">
                      {prop.totalShares.toLocaleString()}
                    </span>

                    {/* Acquired — progress */}
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-[11px] text-white/60 truncate">
                        {prop.acquiredShares.toLocaleString()} ({rowAcqPct.toFixed(1)}%)
                      </span>
                      <div style={{ marginTop: '8px', height: '6px', borderRadius: '9999px', overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, rowAcqPct)}%`,
                            background: 'linear-gradient(90deg, #7CFF3A, #2E7D0B)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Available */}
                    <span className="font-mono text-[12px] text-white/70 truncate">
                      {prop.availableShares.toLocaleString()}
                    </span>

                    {/* Status */}
                    <span
                      className="font-mono text-[10px] font-medium whitespace-nowrap"
                      style={{
                        padding: '4px 12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        width: 'auto',
                        alignSelf: 'flex-start',
                        justifySelf: 'start',
                        borderRadius: '9999px',
                        background: 'rgba(124,255,58,0.08)',
                        border: '1px solid rgba(124,255,58,0.25)',
                        color: '#7CFF3A',
                      }}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>

                    {/* Actions stub */}
                    <button
                      type="button"
                      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                      style={{ color: 'rgba(255,255,255,0.30)', background: 'transparent' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      title="More options"
                    >
                      <span className="text-lg leading-none" style={{ letterSpacing: '0.05em' }}>⋯</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL: Add New Property
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div
              className="rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
              style={{ background: '#0e150f', border: '1px solid #1c281f' }}
            >
              <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid #1c281f' }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(124,255,58,0.10)', border: '1px solid rgba(124,255,58,0.25)', color: '#7CFF3A' }}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-white">Add New RWA Property</h3>
                    <p className="text-xs text-white/50 font-normal">Configure parameters for a new Midnight tokenized property</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsModalOpen(false); handleResetForm(); }}
                  className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div
                  className="rounded-xl p-3.5 text-xs flex items-center gap-2.5"
                  style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.28)', color: '#F87171' }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#F43F5E' }} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateProperty} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-white/80 font-medium">Property Title / Name *</label>
                    <input type="text" required placeholder="e.g. Grand Horizon Tower" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg px-3 py-2 text-white focus:outline-none transition" style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid #1c281f' }} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/80 font-medium">Location *</label>
                    <input type="text" required placeholder="e.g. Denver, CO" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-lg px-3 py-2 text-white focus:outline-none transition" style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid #1c281f' }} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/80 font-medium">Asset Category *</label>
                    <select value={assetType} onChange={(e) => setAssetType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-white focus:outline-none transition" style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid #1c281f' }}>
                      <option value="Residential Multifamily">Residential Multifamily</option>
                      <option value="Commercial Grade-A Office">Commercial Grade-A Office</option>
                      <option value="Luxury Penthouse">Luxury Penthouse</option>
                      <option value="Industrial Logistics Hub">Industrial Logistics Hub</option>
                      <option value="Mixed-Use Hospitality">Mixed-Use Hospitality</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/80 font-medium">Total Valuation ($ USD) *</label>
                    <input type="number" min="1000" required value={totalValuationUsd} onChange={(e) => setTotalValuationUsd(Number(e.target.value))} className="w-full rounded-lg px-3 py-2 text-white font-mono focus:outline-none transition" style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid #1c281f' }} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/80 font-medium">Total Authorized Share Supply *</label>
                    <input type="number" min="1" required value={totalShares} onChange={(e) => setTotalShares(Number(e.target.value))} className="w-full rounded-lg px-3 py-2 text-white font-mono focus:outline-none transition" style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid #1c281f' }} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/80 font-medium">Compliance Minimum ($ USD) *</label>
                    <input type="number" min="100" required value={complianceMinimumUsd} onChange={(e) => setComplianceMinimumUsd(Number(e.target.value))} className="w-full rounded-lg px-3 py-2 text-white font-mono focus:outline-none transition" style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid #1c281f' }} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/80 font-medium">Projected Yield APY *</label>
                    <input type="text" required placeholder="e.g. 8.5%" value={projectedYieldApy} onChange={(e) => setProjectedYieldApy(e.target.value)} className="w-full rounded-lg px-3 py-2 text-white font-mono focus:outline-none transition" style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid #1c281f' }} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-white/80 font-medium">Image URL</label>
                    <input type="url" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full rounded-lg px-3 py-2 text-white font-mono focus:outline-none transition" style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid #1c281f' }} />
                  </div>
                </div>

                {/* Calculation preview */}
                <div className="rounded-xl p-3.5 space-y-1 font-mono text-[11px]" style={{ background: 'rgba(0,0,0,0.50)', border: '1px solid #1c281f' }}>
                  <div className="text-white/50">Calculation Preview:</div>
                  <div className="flex justify-between text-white/80">
                    <span>Price per Share:</span>
                    <span className="font-medium" style={{ color: '#7CFF3A' }}>
                      ${totalShares > 0 ? (totalValuationUsd / totalShares).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Initial Available Shares:</span>
                    <span className="font-medium text-white">{totalShares.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); handleResetForm(); }}
                    className="px-4 py-2 rounded-lg font-medium cursor-pointer transition"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.80)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="px-5 py-2 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    style={{ background: '#7CFF3A', color: '#020802' }}
                  >
                    {isPublishing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Publishing…
                      </>
                    ) : (
                      'Publish RWA Asset'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
