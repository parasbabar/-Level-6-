import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Building2, ShoppingBag, X, RefreshCw,
  AlertCircle, Lock, Search, Filter,
  CheckCircle2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { fadeUp, dur, ease, safeVariants } from '../lib/motion';
import { PropertyCard } from './PropertyCard';
import type { PropertyMetadata, InvestorPrivateHolding } from '../utils/contract';
import type { TransactionStatus, WalletConnectionStatus } from '../hooks/useMidnight';

interface PropertyMarketplaceProps {
  properties: PropertyMetadata[];
  portfolio: Record<string, InvestorPrivateHolding>;
  walletStatus: WalletConnectionStatus;
  transactionStatus: TransactionStatus;
  transactionTxId?: string | null;
  transactionError: string | null;
  currentProofStatus?: string | null;
  isRefreshingInventory?: boolean;
  onRefreshInventory?: () => void;
  onSelectPropertyForProof: (property: PropertyMetadata, type: 'ownership' | 'compliance' | 'rental') => void;
  onExecutePurchase: (property: PropertyMetadata, shares: bigint, capitalUsd: bigint) => Promise<{ txId: string | null; holding: InvestorPrivateHolding }>;
  onResetTransaction: () => void;
  onNavigateToPortfolio: () => void;
  onNavigateToOwnershipProof: (property: PropertyMetadata) => void;
}

export const PropertyMarketplace: React.FC<PropertyMarketplaceProps> = ({
  properties, portfolio, walletStatus, transactionStatus, transactionTxId, transactionError,
  currentProofStatus, isRefreshingInventory = false, onRefreshInventory,
  onSelectPropertyForProof, onExecutePurchase, onResetTransaction,
  onNavigateToPortfolio, onNavigateToOwnershipProof,
}) => {
  const [purchasingProperty, setPurchasingProperty] = useState<PropertyMetadata | null>(null);
  const [selectedSharesCount, setSelectedSharesCount] = useState<number>(10_000);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const modalPropertyIdRef = useRef<string | null>(null);
  const reduced = useReducedMotion();

  const handleFlip = (id: string) => {
    setFlippedCardId(prev => (prev === id ? null : id));
  };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    properties.forEach(p => { if (p.assetType) cats.add(p.assetType); });
    return ['ALL', ...Array.from(cats)];
  }, [properties]);

  const filteredProperties = useMemo(() => properties.filter(p => {
    const matchSearch = searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch && (selectedCategory === 'ALL' || p.assetType === selectedCategory);
  }), [properties, searchTerm, selectedCategory]);

  const pricePerShare = purchasingProperty && purchasingProperty.totalShares > 0n
    ? purchasingProperty.totalValuationUsd / Number(purchasingProperty.totalShares) : 50;
  const calcCapital = BigInt(Math.round(selectedSharesCount * pricePerShare));
  const calcPct = purchasingProperty && purchasingProperty.totalShares > 0n
    ? ((selectedSharesCount / Number(purchasingProperty.totalShares)) * 100).toFixed(2) : '0.00';

  const isCurrentModalTx = modalPropertyIdRef.current === purchasingProperty?.id;
  const effectiveTxStatus: TransactionStatus =
    purchasingProperty && !isCurrentModalTx && transactionStatus === 'confirmed' ? 'idle' : transactionStatus;

  const openPurchase = (prop: PropertyMetadata) => {
    onResetTransaction();
    modalPropertyIdRef.current = prop.id;
    setPurchasingProperty(prop);
    setSelectedSharesCount(Math.min(10_000, Math.max(1000, Number(prop.availableShares))));
  };
  const closeModal = () => {
    setPurchasingProperty(null);
    modalPropertyIdRef.current = null;
    setIsSubmitting(false);
    onResetTransaction();
  };
  const confirmPurchase = async () => {
    if (!purchasingProperty || isSubmitting) return;
    setIsSubmitting(true);
    modalPropertyIdRef.current = purchasingProperty.id;
    try {
      await onExecutePurchase(purchasingProperty, BigInt(selectedSharesCount), calcCapital);
    } catch { /* handled by state */ }
    finally { setIsSubmitting(false); }
  };

  // ── inline style helpers ──
  const btn = (bg: string, color: string, extra?: React.CSSProperties): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    padding: '0.75rem 1.25rem', background: bg, color, border: 'none', borderRadius: '0.5rem',
    cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'inherit',
    transition: 'all 0.2s', ...extra,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Page header ── */}
      <motion.div
        variants={safeVariants(fadeUp, reduced)}
        initial="hidden"
        animate="show"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1.75rem' }}
      >
        <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {['Midnight Preprod', 'ZK Verified', 'Fractional RWA'].map((tag, i) => (
            <motion.span
              key={tag}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: dur.fast, ease }}
              className={i === 0 ? 'badge badge-gold' : i === 1 ? 'badge badge-teal' : 'badge'}
              style={{ fontSize: '0.6875rem', ...(i === 2 ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(247,247,244,0.5)' } : {}) }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div>
            <motion.h1
              initial={reduced ? false : { opacity: 0, filter: 'blur(6px)', y: 12 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ delay: 0.1, duration: dur.section, ease }}
              style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.025em', color: '#F7F7F4', lineHeight: 1.2, marginBottom: '0.625rem' }}
            >
              Property Marketplace
            </motion.h1>
            <p style={{ fontSize: '1rem', color: 'rgba(247,247,244,0.5)', maxWidth: '48rem', lineHeight: 1.6 }}>
              Acquire fractional shares in tokenized real-world assets on Midnight Preprod.
              Holdings remain in client-shielded witness storage — invisible to external observers.
            </p>
          </div>
          <motion.button
            onClick={onNavigateToPortfolio}
            whileHover={reduced ? {} : { y: -1 }}
            whileTap={reduced ? {} : { scale: 0.97 }}
            style={btn('rgba(255,255,255,0.06)', 'rgba(247,247,244,0.75)', { border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap', gap: '0.5rem' })}
          >
            <Lock style={{ width: 15, height: 15 }} /> View Portfolio
          </motion.button>
        </div>
      </motion.div>



      {/* ── Search + filter bar ── */}
      <motion.div
        variants={safeVariants(fadeUp, reduced)}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.15, duration: dur.normal }}
        className="app-card"
        style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 0 }}>
            <Search style={{ width: 14, height: 14, color: 'rgba(247,247,244,0.4)', position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search by name, location, or ID…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem', paddingRight: searchTerm ? '2.5rem' : '1rem' }}
              aria-label="Search properties"
            />
            <AnimatePresence>
              {searchTerm && (
                <motion.button
                  key="clear"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: dur.fast }}
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(247,247,244,0.4)', display: 'flex' }}
                  aria-label="Clear search"
                >
                  <X style={{ width: 13, height: 13 }} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Sync + count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            {onRefreshInventory && (
              <motion.button
                onClick={() => onRefreshInventory()}
                disabled={isRefreshingInventory}
                whileTap={reduced ? {} : { scale: 0.97 }}
                style={btn('rgba(255,255,255,0.05)', 'rgba(247,247,244,0.65)', { border: '1px solid rgba(255,255,255,0.1)', opacity: isRefreshingInventory ? 0.6 : 1, padding: '0.625rem 1rem', fontSize: '0.8125rem', gap: '0.375rem' })}
              >
                <motion.span
                  animate={isRefreshingInventory ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ repeat: isRefreshingInventory ? Infinity : 0, duration: 0.8, ease: 'linear' }}
                  style={{ display: 'flex' }}
                >
                  <RefreshCw style={{ width: 13, height: 13, color: '#D6B36A' }} />
                </motion.span>
                {isRefreshingInventory ? 'Syncing…' : 'Sync Registry'}
              </motion.button>
            )}
            <motion.span
              key={filteredProperties.length}
              initial={reduced ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur.fast }}
              style={{ padding: '0.625rem 0.875rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.5rem', fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(247,247,244,0.5)', whiteSpace: 'nowrap' }}
            >
              {filteredProperties.length} {filteredProperties.length === 1 ? 'asset' : 'assets'}
            </motion.span>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.125rem' }}>
          <Filter style={{ width: 13, height: 13, color: 'rgba(247,247,244,0.35)', flexShrink: 0 }} aria-hidden="true" />
          {categories.map(cat => (
            <motion.button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              whileTap={reduced ? {} : { scale: 0.95 }}
              style={{ position: 'relative', padding: '0.375rem 0.875rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit', background: 'transparent', border: `1px solid ${selectedCategory === cat ? 'rgba(124,255,58,0.3)' : 'rgba(255,255,255,0.08)'}`, color: selectedCategory === cat ? 'var(--green)' : 'rgba(247,247,244,0.55)', transition: 'border-color 0.15s, color 0.15s' }}
            >
              {selectedCategory === cat && (
                <motion.span
                  layoutId="chip-active"
                  style={{ position: 'absolute', inset: 0, borderRadius: '9999px', background: 'var(--green-dim)', zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                />
              )}
              {cat === 'ALL' ? 'All Categories' : cat}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Property grid with layout animation ── */}
      <AnimatePresence mode="popLayout">
        {filteredProperties.length === 0 ? (
          <motion.div
            key="empty"
            variants={safeVariants(fadeUp, reduced)}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '1rem' }}
          >
            <motion.div
              animate={reduced ? {} : { y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              <Building2 style={{ width: 40, height: 40, margin: '0 auto 1rem', color: 'rgba(247,247,244,0.2)' }} />
            </motion.div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#F7F7F4', marginBottom: '0.5rem' }}>No properties match your filter</h3>
            <p style={{ fontSize: '0.9375rem', color: 'rgba(247,247,244,0.45)', marginBottom: '1.5rem' }}>Try adjusting your search or selecting All Categories.</p>
            <motion.button
              whileTap={reduced ? {} : { scale: 0.97 }}
              onClick={() => { setSearchTerm(''); setSelectedCategory('ALL'); }}
              style={btn('rgba(255,255,255,0.08)', '#F7F7F4', { border: '1px solid rgba(255,255,255,0.12)' })}
            >
              Reset Filters
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            layout
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredProperties.map(prop => (
                <motion.div
                  key={prop.id}
                  layout
                  variants={safeVariants(fadeUp, reduced)}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: dur.fast } }}
                  transition={{ duration: dur.normal, ease }}
                >
                  <PropertyCard
                    property={prop}
                    holding={portfolio[prop.id]}
                    isFlipped={flippedCardId === prop.id}
                    onFlip={() => handleFlip(prop.id)}
                    onPurchase={() => openPurchase(prop)}
                    onOwnershipProof={() => onSelectPropertyForProof(prop, 'ownership')}
                    onComplianceProof={() => onSelectPropertyForProof(prop, 'compliance')}
                    onRentalProof={() => onSelectPropertyForProof(prop, 'rental')}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Acquire Shares Modal ── */}
      <AnimatePresence>
        {purchasingProperty && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(9,10,12,0.88)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#15171B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', maxWidth: 540, width: '100%', padding: '2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', color: '#F7F7F4', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '0.625rem', background: 'rgba(124,255,58,0.1)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag style={{ width: 20, height: 20, color: 'var(--green)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#F7F7F4', marginBottom: '0.125rem' }}>Acquire Fractional RWA Shares</h3>
                    <span style={{ fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--green)' }}>{purchasingProperty.name}</span>
                  </div>
                </div>
                {effectiveTxStatus !== 'preparing-transaction' && effectiveTxStatus !== 'awaiting-wallet-signature' && effectiveTxStatus !== 'transaction-submitted' && effectiveTxStatus !== 'waiting-for-confirmation' && (
                  <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(247,247,244,0.4)', padding: '0.375rem', borderRadius: '0.375rem', display: 'flex' }} aria-label="Close">
                    <X style={{ width: 18, height: 18 }} />
                  </button>
                )}
              </div>

              {/* ── State Machine Content ── */}
              {effectiveTxStatus === 'confirmed' ? (
                /* ── 1. REAL CONFIRMED SUCCESS ── */
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                    style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-dim)', border: '2px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                  >
                    <CheckCircle2 style={{ width: 32, height: 32, color: 'var(--green)' }} />
                  </motion.div>
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F7F7F4', marginBottom: '0.375rem' }}>✓ Purchase Successful</h4>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(247,247,244,0.6)', lineHeight: 1.5, maxWidth: '28rem', margin: '0 auto' }}>
                      {purchasingProperty.name}
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                    {[
                      ['Shares Acquired', `${selectedSharesCount.toLocaleString()} (${calcPct}%)`],
                      ['Total Investment', `$${Number(calcCapital).toLocaleString()}`],
                      ['Status', 'Confirmed on Midnight Preprod'],
                      ['ZK Storage', '● Client-Shielded Witness Active'],
                    ].map(([label, value], idx) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: idx < 3 ? '0.625rem' : 0, borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <span style={{ color: 'rgba(247,247,244,0.45)' }}>{label}:</span>
                        <span style={{ color: idx === 0 || idx === 1 ? 'var(--green)' : '#F7F7F4', fontWeight: 600, fontFamily: idx < 2 ? 'JetBrains Mono, monospace' : 'inherit' }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {transactionTxId && (
                    <div style={{ textAlign: 'left' }}>
                      <button
                        type="button"
                        onClick={() => setShowTechnicalDetails(prev => !prev)}
                        style={{ background: 'none', border: 'none', color: 'rgba(247,247,244,0.45)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0' }}
                      >
                        {showTechnicalDetails ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                        {showTechnicalDetails ? 'Hide technical metadata' : 'View transaction details'}
                      </button>
                      {showTechnicalDetails && (
                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all', color: 'rgba(247,247,244,0.7)' }}>
                          <div style={{ color: 'rgba(247,247,244,0.4)', marginBottom: '0.25rem' }}>Authoritative Transaction ID:</div>
                          <div style={{ color: '#D6B36A' }}>{transactionTxId}</div>
                          <div style={{ color: 'rgba(247,247,244,0.4)', marginTop: '0.5rem', marginBottom: '0.25rem' }}>Network:</div>
                          <div>Midnight Preprod Network</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
                    <button onClick={() => { closeModal(); onNavigateToPortfolio(); }} style={btn('rgba(255,255,255,0.06)', 'rgba(247,247,244,0.85)', { flex: 1, border: '1px solid rgba(255,255,255,0.12)' })}>
                      View Portfolio
                    </button>
                    <button onClick={() => { const p = purchasingProperty; closeModal(); onNavigateToOwnershipProof(p); }} style={btn('var(--green-dim)', 'var(--green)', { flex: 1, border: '1px solid var(--green-border)' })}>
                      Prove Ownership
                    </button>
                  </div>
                </div>
              ) : (
                /* ── 2. IDLE & IN-FLIGHT PURCHASE FORM ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Share selector */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(247,247,244,0.65)' }}>Shares to Acquire</label>
                      <span style={{ fontSize: '0.875rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--green)' }}>
                        {selectedSharesCount.toLocaleString()} ({calcPct}%)
                      </span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.875rem' }}>
                      <span style={{ color: 'rgba(247,247,244,0.45)' }}>Available Inventory:</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--green)', fontWeight: 600 }}>
                        {purchasingProperty.availableShares.toLocaleString()} / {purchasingProperty.totalShares.toLocaleString()} shares
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
                      {[2_500, 5_000, 10_000, 20_000].map(val => {
                        const dis = isSubmitting || (effectiveTxStatus !== 'idle' && effectiveTxStatus !== 'error') || val > Number(purchasingProperty.availableShares);
                        return (
                          <button key={val} type="button" onClick={() => setSelectedSharesCount(Math.min(val, Number(purchasingProperty.availableShares)))} disabled={dis}
                            style={{ flex: 1, padding: '0.5rem 0.25rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', cursor: dis ? 'not-allowed' : 'pointer', fontWeight: 600, background: selectedSharesCount === val ? 'var(--green-dim)' : dis ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)', border: `1px solid ${selectedSharesCount === val ? 'var(--green-border)' : 'rgba(255,255,255,0.08)'}`, color: selectedSharesCount === val ? 'var(--green)' : dis ? 'rgba(247,247,244,0.25)' : 'rgba(247,247,244,0.6)' }}>
                            {val.toLocaleString()}
                          </button>
                        );
                      })}
                    </div>
                    <input type="range" min="1000" max={Math.max(1000, Number(purchasingProperty.availableShares))} step="500"
                      value={Math.min(selectedSharesCount, Math.max(1000, Number(purchasingProperty.availableShares)))}
                      onChange={e => setSelectedSharesCount(Number(e.target.value))}
                      disabled={isSubmitting || (effectiveTxStatus !== 'idle' && effectiveTxStatus !== 'error')}
                      style={{ width: '100%', cursor: isSubmitting || (effectiveTxStatus !== 'idle' && effectiveTxStatus !== 'error') ? 'not-allowed' : 'pointer' }}
                    />
                    {selectedSharesCount > Number(purchasingProperty.availableShares) && (
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.8125rem', color: 'rgba(239,68,68,0.85)' }}>
                        <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
                        Exceeds available inventory ({purchasingProperty.availableShares.toLocaleString()} shares remaining).
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
                    {[
                      ['Price Per Share', `$${pricePerShare.toFixed(2)}`],
                      ['Total Investment', `$${Number(calcCapital).toLocaleString()}`],
                      ['Est. Annual Rental', `$${Math.round(Number(calcCapital) * (parseFloat(purchasingProperty.projectedYieldApy) / 100)).toLocaleString()} / yr`],
                    ].map(([label, value], i) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: i < 2 ? '0.625rem' : 0, borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                        <span style={{ color: 'rgba(247,247,244,0.45)' }}>{label}:</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: i === 1 ? 'var(--green)' : '#F7F7F4' }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* ── Active Status Panel for In-Flight Transaction ── */}
                  {(effectiveTxStatus === 'preparing-transaction' || effectiveTxStatus === 'awaiting-wallet-signature') && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ padding: '1rem', background: 'rgba(214,179,106,0.08)', border: '1px solid rgba(214,179,106,0.25)', borderRadius: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#D6B36A', fontWeight: 600, fontSize: '0.875rem' }}>
                        <RefreshCw style={{ width: 16, height: 16, animation: 'spin 1.2s linear infinite', flexShrink: 0 }} />
                        Waiting for wallet confirmation
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'rgba(247,247,244,0.7)', lineHeight: 1.5, margin: 0 }}>
                        {currentProofStatus || 'Please review and approve the purchase in your 1AM / Midnight Lace Wallet popup or extension icon.'}
                      </p>
                    </motion.div>
                  )}

                  {(effectiveTxStatus === 'transaction-submitted' || effectiveTxStatus === 'waiting-for-confirmation') && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ padding: '1rem', background: 'rgba(56,183,168,0.08)', border: '1px solid rgba(56,183,168,0.25)', borderRadius: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#38B7A8', fontWeight: 600, fontSize: '0.875rem' }}>
                        <RefreshCw style={{ width: 16, height: 16, animation: 'spin 1.2s linear infinite', flexShrink: 0 }} />
                        Confirming your purchase
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'rgba(247,247,244,0.7)', lineHeight: 1.5, margin: 0 }}>
                        {currentProofStatus || 'Broadcasting signed transaction to Midnight Preprod. Waiting for block confirmation (~15-30s)...'}
                      </p>
                      {transactionTxId && (
                        <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(247,247,244,0.5)', marginTop: '0.25rem' }}>
                          TX: {transactionTxId.slice(0, 18)}…
                        </div>
                      )}
                    </motion.div>
                  )}

                  {transactionError && effectiveTxStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ padding: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.625rem', fontSize: '0.875rem' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(239,68,68,0.95)', marginBottom: '0.375rem', fontWeight: 600 }}>
                        <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                        Transaction failed
                      </div>
                      <p style={{ color: 'rgba(239,68,68,0.8)', lineHeight: 1.5, fontSize: '0.8125rem', margin: 0 }}>
                        {transactionError}
                      </p>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={isSubmitting || effectiveTxStatus === 'preparing-transaction' || effectiveTxStatus === 'awaiting-wallet-signature' || effectiveTxStatus === 'transaction-submitted' || effectiveTxStatus === 'waiting-for-confirmation'}
                      style={btn('rgba(255,255,255,0.06)', 'rgba(247,247,244,0.7)', {
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '0.875rem 1.5rem',
                        cursor: isSubmitting || (effectiveTxStatus !== 'idle' && effectiveTxStatus !== 'error') ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting || (effectiveTxStatus !== 'idle' && effectiveTxStatus !== 'error') ? 0.4 : 1,
                      })}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmPurchase}
                      disabled={
                        isSubmitting ||
                        purchasingProperty.availableShares === 0n ||
                        BigInt(selectedSharesCount) > purchasingProperty.availableShares ||
                        (walletStatus !== 'connected' && walletStatus !== 'syncing') ||
                        (effectiveTxStatus !== 'idle' && effectiveTxStatus !== 'error')
                      }
                      style={{
                        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        padding: '0.875rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.9375rem', fontWeight: 600,
                        fontFamily: 'inherit',
                        cursor: isSubmitting || (effectiveTxStatus !== 'idle' && effectiveTxStatus !== 'error') || purchasingProperty.availableShares === 0n || BigInt(selectedSharesCount) > purchasingProperty.availableShares || (walletStatus !== 'connected' && walletStatus !== 'syncing') ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s', border: 'none',
                        background: (walletStatus !== 'connected' && walletStatus !== 'syncing') || BigInt(selectedSharesCount) > purchasingProperty.availableShares || purchasingProperty.availableShares === 0n
                          ? 'rgba(255,255,255,0.06)'
                          : isSubmitting || (effectiveTxStatus !== 'idle' && effectiveTxStatus !== 'error')
                          ? 'rgba(124,255,58,0.2)'
                          : 'var(--green)',
                        color: (walletStatus !== 'connected' && walletStatus !== 'syncing') || BigInt(selectedSharesCount) > purchasingProperty.availableShares
                          ? 'rgba(247,247,244,0.25)' : '#020802',
                        opacity: isSubmitting || (effectiveTxStatus !== 'idle' && effectiveTxStatus !== 'error') ? 0.7 : 1,
                      }}
                    >
                      {isSubmitting || effectiveTxStatus === 'preparing-transaction' || effectiveTxStatus === 'awaiting-wallet-signature' ? (
                        <><RefreshCw style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Waiting for Wallet…</>
                      ) : effectiveTxStatus === 'transaction-submitted' || effectiveTxStatus === 'waiting-for-confirmation' ? (
                        <><RefreshCw style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Confirming Purchase…</>
                      ) : purchasingProperty.availableShares === 0n ? (
                        'Sold Out'
                      ) : BigInt(selectedSharesCount) > purchasingProperty.availableShares ? (
                        'Exceeds Available'
                      ) : (walletStatus !== 'connected' && walletStatus !== 'syncing') ? (
                        'Connect Wallet First'
                      ) : (
                        <><Lock style={{ width: 15, height: 15 }} /> Confirm Share Purchase</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
