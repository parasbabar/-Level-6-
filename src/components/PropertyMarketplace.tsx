import React, { useState, useRef, useMemo } from 'react';
import {
  Building2,
  ShieldCheck,
  MapPin,
  DollarSign,
  Percent,
  ArrowRight,
  ShoppingBag,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  BadgeCheck,
  PieChart,
  Search,
  Filter,
  Layers,
  Sparkles,
  Cpu,
  FileCheck2,
} from 'lucide-react';
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
  properties,
  portfolio,
  walletStatus,
  transactionStatus,
  transactionError,
  currentProofStatus,
  isRefreshingInventory = false,
  onRefreshInventory,
  onSelectPropertyForProof,
  onExecutePurchase,
  onResetTransaction,
  onNavigateToPortfolio,
  onNavigateToOwnershipProof,
}) => {
  const [purchasingProperty, setPurchasingProperty] = useState<PropertyMetadata | null>(null);
  const [selectedSharesCount, setSelectedSharesCount] = useState<number>(10_000);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Track which property the current modal session is for — prevents stale transactionStatus
  const modalPropertyIdRef = useRef<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    properties.forEach((p) => {
      if (p.assetType) cats.add(p.assetType);
    });
    return ['ALL', ...Array.from(cats)];
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchesSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || p.assetType === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [properties, searchTerm, selectedCategory]);

  const pricePerShareUsd = purchasingProperty && purchasingProperty.totalShares > 0n
    ? purchasingProperty.totalValuationUsd / Number(purchasingProperty.totalShares)
    : 50;

  const calculatedCapitalUsd = BigInt(Math.round(selectedSharesCount * pricePerShareUsd));
  const calculatedOwnershipPct = purchasingProperty && purchasingProperty.totalShares > 0n
    ? ((selectedSharesCount / Number(purchasingProperty.totalShares)) * 100).toFixed(2)
    : '0.00';

  // Determine if transactionStatus reflects THIS property session
  const isCurrentModalTx = modalPropertyIdRef.current === purchasingProperty?.id;
  const effectiveTransactionStatus: TransactionStatus =
    purchasingProperty && !isCurrentModalTx && transactionStatus === 'confirmed'
      ? 'idle'
      : transactionStatus;

  const handleOpenPurchase = (prop: PropertyMetadata) => {
    onResetTransaction();
    modalPropertyIdRef.current = prop.id;
    setPurchasingProperty(prop);
    const defaultAmount = Math.min(10_000, Math.max(1000, Number(prop.availableShares)));
    setSelectedSharesCount(defaultAmount);
  };

  const handleCloseModal = () => {
    setPurchasingProperty(null);
    modalPropertyIdRef.current = null;
    setIsSubmitting(false);
    onResetTransaction();
  };

  const handleConfirmPurchase = async () => {
    if (!purchasingProperty || isSubmitting) return;
    setIsSubmitting(true);
    modalPropertyIdRef.current = purchasingProperty.id;
    try {
      await onExecutePurchase(purchasingProperty, BigInt(selectedSharesCount), calculatedCapitalUsd);
    } catch {
      // Handled by state
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header Experience */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>PRIVATE REAL ESTATE OWNERSHIP</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Own Property. <br className="hidden sm:inline" />
            <span className="gradient-text-emerald">Protect Your Privacy.</span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Acquire fractional shares in verified premium commercial and residential properties on Midnight Preprod.
            Zero-Knowledge proofs allow you to prove accreditation and ownership without disclosing private balances.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <a
              href="#marketplace-grid"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition transform hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Properties</span>
            </a>
            <button
              onClick={onNavigateToPortfolio}
              className="px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition inline-flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>View Shielded Portfolio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trust & Product Signal Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">Midnight Preprod</div>
            <div className="text-[10px] text-slate-400 truncate">On-Chain Ledger</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">ZK Privacy</div>
            <div className="text-[10px] text-slate-400 truncate">Off-Chain Proofs</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">Verifiable Equity</div>
            <div className="text-[10px] text-slate-400 truncate">Compact Circuits</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">Shielded Witness</div>
            <div className="text-[10px] text-slate-400 truncate">Private Storage</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl flex items-center gap-3 shadow-sm col-span-2 md:col-span-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">Share Accounting</div>
            <div className="text-[10px] text-slate-400 truncate">Transparent Limits</div>
          </div>
        </div>
      </div>

      {/* Discovery, Search & Filter Bar */}
      <div id="marketplace-grid" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search properties by name, location, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Refresh / Sync Inventory */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {onRefreshInventory && (
            <button
              onClick={onRefreshInventory}
              disabled={isRefreshingInventory}
              className="px-3.5 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition disabled:opacity-60"
              title="Re-fetch authoritative property inventory from Midnight Preprod registry"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshingInventory ? 'animate-spin' : ''}`} />
              <span>{isRefreshingInventory ? 'Syncing...' : 'Sync Registry'}</span>
            </button>
          )}
          <span className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono">
            {filteredProperties.length} {filteredProperties.length === 1 ? 'Asset' : 'Assets'}
          </span>
        </div>
      </div>

      {/* Grid of properties */}
      {filteredProperties.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Building2 className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-semibold text-slate-200">No properties match your filter</h3>
          <p className="text-xs max-w-sm mx-auto text-slate-400">
            Try adjusting your search keyword or selecting "All Categories" to view available tokenized RWA assets.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('ALL');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredProperties.map((prop) => {
            const existingHolding = portfolio[prop.id];
            const alreadyInvested = existingHolding && existingHolding.ownershipShares > 0n;

            return (
              <div
                key={prop.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
              >
                {/* Image Header */}
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-slate-800">
                    <img
                      src={prop.imageUrl}
                      alt={prop.name}
                      className="w-full h-full object-cover brightness-95 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/40 pointer-events-none" />

                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-amber-300 font-bold text-[10px] tracking-wide px-2.5 py-1 rounded-md border border-amber-500/30 uppercase shadow-md">
                      {prop.status}
                    </div>

                    {alreadyInvested ? (
                      <div className="absolute top-3 right-3 bg-emerald-950/90 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-emerald-500/50 flex items-center gap-1 shadow-md">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>HOLDING</span>
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-indigo-300 text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md border border-indigo-500/30">
                        {prop.id}
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-slate-800 shadow-md">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{prop.location}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition">
                        {prop.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{prop.assetType}</p>
                    </div>

                    {/* Share Allocation Breakdown */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <PieChart className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Share Allocation</span>
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">
                          {prop.availableShares.toLocaleString()} Available
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                        <div
                          style={{
                            width: `${
                              prop.totalShares > 0n
                                ? Math.min(100, Number((prop.acquiredShares * 10000n) / prop.totalShares) / 100)
                                : 0
                            }%`,
                          }}
                          className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full transition-all duration-300"
                          title={`Acquired: ${prop.acquiredShares.toLocaleString()} shares`}
                        />
                        <div
                          style={{
                            width: `${
                              prop.totalShares > 0n
                                ? Math.max(0, 100 - Number((prop.acquiredShares * 10000n) / prop.totalShares) / 100)
                                : 100
                            }%`,
                          }}
                          className="bg-emerald-500/80 h-full transition-all duration-300"
                          title={`Available: ${prop.availableShares.toLocaleString()} shares`}
                        />
                      </div>

                      {/* 3-Column Stats */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono">
                        <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 min-w-0 flex flex-col justify-center">
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block truncate">Total</span>
                          <span className="text-xs font-bold text-slate-200 tabular-nums block truncate w-full" title={prop.totalShares.toLocaleString()}>
                            {prop.totalShares.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 min-w-0 flex flex-col justify-center">
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block truncate">Acquired</span>
                          <span className="text-xs font-bold text-amber-400 tabular-nums block truncate w-full" title={prop.acquiredShares.toLocaleString()}>
                            {prop.acquiredShares.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 min-w-0 flex flex-col justify-center">
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block truncate">Available</span>
                          <span className="text-xs font-bold text-emerald-400 tabular-nums block truncate w-full" title={prop.availableShares.toLocaleString()}>
                            {prop.availableShares.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Financial Metrics */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-emerald-400" /> Valuation
                          </span>
                          <span className="text-xs font-bold text-white mt-0.5 block font-mono">
                            ${(prop.totalValuationUsd / 1_000_000).toFixed(2)}M
                          </span>
                        </div>

                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Percent className="w-3 h-3 text-indigo-400" /> Yield APY
                          </span>
                          <span className="text-xs font-bold text-emerald-400 mt-0.5 block font-mono">
                            {prop.projectedYieldApy}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Anchored cleanly at bottom) */}
                <div className="p-5 pt-0 space-y-2">
                  <button
                    onClick={() => handleOpenPurchase(prop)}
                    className={`w-full py-2.5 px-3 ${
                      alreadyInvested
                        ? 'bg-slate-800 hover:bg-emerald-700 border border-emerald-600/40'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    } text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/40`}
                  >
                    {alreadyInvested ? (
                      <>
                        <BadgeCheck className="w-4 h-4 text-emerald-400" />
                        <span>Add More Shares</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Acquire Fractional Shares</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onSelectPropertyForProof(prop, 'ownership')}
                    className="w-full py-1.5 px-3 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Generate Ownership ZK Proof</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onSelectPropertyForProof(prop, 'compliance')}
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition text-center"
                    >
                      Compliance
                    </button>
                    <button
                      onClick={() => onSelectPropertyForProof(prop, 'rental')}
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition text-center"
                    >
                      Rental Yield
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Purchase Modal */}
      {purchasingProperty && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Acquire Fractional RWA Shares</h3>
                  <span className="text-xs font-mono text-emerald-400">{purchasingProperty.name}</span>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            {effectiveTransactionStatus === 'confirmed' ? (
              /* Success Confirmation State */
              <div className="space-y-4 text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Share Allocation Registered</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Your fractional shares have been calculated and securely stored into your client-side shielded witness storage for privacy-preserving zero-knowledge proofs.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-left space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Property Asset:</span>
                    <span className="font-semibold text-white">
                      {purchasingProperty.name} ({purchasingProperty.id})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Acquired Allocation:</span>
                    <span className="font-semibold text-white">
                      {selectedSharesCount.toLocaleString()} shares ({calculatedOwnershipPct}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Property Valuation:</span>
                    <span className="font-semibold text-emerald-400 font-mono">
                      ${purchasingProperty.totalValuationUsd.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Proportional Share Value:</span>
                    <span className="font-semibold text-slate-200 font-mono">
                      ${Number(calculatedCapitalUsd).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-slate-400">
                    <span>Privacy & ZK Status:</span>
                    <span className="text-indigo-300 font-medium inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Client-Shielded Witness Active
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Network Mode:</span>
                    <span className="text-slate-300 font-mono">Midnight Preprod (Demo Allocation)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => {
                      handleCloseModal();
                      onNavigateToPortfolio();
                    }}
                    className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    View in Shielded Portfolio
                  </button>
                  <button
                    onClick={() => {
                      const prop = purchasingProperty;
                      handleCloseModal();
                      onNavigateToOwnershipProof(prop);
                    }}
                    className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Prove Ownership (ZK Proof)
                  </button>
                </div>
              </div>
            ) : (
              /* Share Configuration Form */
              <div className="space-y-4">
                {/* Share Count Selector */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Shares to Acquire
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {selectedSharesCount.toLocaleString()} shares ({calculatedOwnershipPct}%)
                    </span>
                  </div>

                  {/* Share Availability Info Banner */}
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs mb-3 font-mono">
                    <span className="text-slate-400">Available Inventory:</span>
                    <span className="text-emerald-400 font-bold">
                      {purchasingProperty.availableShares.toLocaleString()} / {purchasingProperty.totalShares.toLocaleString()} shares
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-2 mb-3">
                    {[2_500, 5_000, 10_000, 20_000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelectedSharesCount(Math.min(val, Number(purchasingProperty.availableShares)))}
                        disabled={
                          (transactionStatus !== 'idle' && transactionStatus !== 'error') ||
                          val > Number(purchasingProperty.availableShares)
                        }
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition border ${
                          selectedSharesCount === val
                            ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                            : val > Number(purchasingProperty.availableShares)
                            ? 'bg-slate-900/40 border-slate-800/40 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {val.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="1000"
                    max={Math.max(1000, Number(purchasingProperty.availableShares))}
                    step="500"
                    value={Math.min(selectedSharesCount, Math.max(1000, Number(purchasingProperty.availableShares)))}
                    onChange={(e) => setSelectedSharesCount(Number(e.target.value))}
                    disabled={transactionStatus !== 'idle' && transactionStatus !== 'error'}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />

                  {selectedSharesCount > Number(purchasingProperty.availableShares) && (
                    <div className="mt-2.5 p-2.5 bg-rose-950/80 border border-rose-500/40 rounded-lg text-xs text-rose-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        Exceeds available inventory ({purchasingProperty.availableShares.toLocaleString()} shares remaining).
                      </span>
                    </div>
                  )}
                </div>

                {/* Investment Calculation Card */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Valuation Per Share:</span>
                    <span className="font-mono text-white">${pricePerShareUsd.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Total Investment Capital:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ${Number(calculatedCapitalUsd).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Projected Annual Rental Income:</span>
                    <span className="font-mono text-indigo-300">
                      ${Math.round(Number(calculatedCapitalUsd) * (parseFloat(purchasingProperty.projectedYieldApy) / 100)).toLocaleString()} / yr
                    </span>
                  </div>
                </div>

                {/* Transaction State Machine Feedback */}
                {effectiveTransactionStatus === 'awaiting-wallet-signature' && (
                  <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center gap-2.5">
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-indigo-400" />
                    <span>
                      {currentProofStatus ? (
                        <span>{currentProofStatus}</span>
                      ) : (
                        <span>
                          <strong>Awaiting Wallet Signature:</strong> Please approve the authorization request in your Midnight Lace Wallet extension.
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {effectiveTransactionStatus === 'transaction-submitted' && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5">
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-emerald-400" />
                    <span>
                      {currentProofStatus || (
                        <span>
                          <strong>Transaction Submitted:</strong> Broadcasting to Midnight Preprod network...
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {effectiveTransactionStatus === 'waiting-for-confirmation' && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2.5">
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
                    <span>
                      {currentProofStatus || (
                        <span>
                          <strong>Waiting for Confirmation:</strong> Finalizing on Midnight Preprod ledger (~15-30s)...
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {transactionError && effectiveTransactionStatus !== 'idle' && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <div>
                        <span className="font-bold text-rose-200">Transaction Status:</span>
                        <p className="mt-0.5 text-rose-300/90">{transactionError}</p>
                      </div>
                    </div>
                    {transactionError.toLowerCase().includes('pending') && (
                      <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
                        <span className="text-[11px] text-amber-300/90">
                          Block confirmation on Midnight Preprod takes 15-30s.
                        </span>
                        <button
                          type="button"
                          onClick={() => onResetTransaction()}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-md border border-rose-500/40 transition"
                        >
                          Reset & Retry
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Modal Action Buttons */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmPurchase}
                    disabled={
                      isSubmitting ||
                      purchasingProperty.availableShares === 0n ||
                      BigInt(selectedSharesCount) > purchasingProperty.availableShares ||
                      (walletStatus !== 'connected' && walletStatus !== 'syncing') ||
                      (effectiveTransactionStatus !== 'idle' && effectiveTransactionStatus !== 'error')
                    }
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                      walletStatus !== 'connected' && walletStatus !== 'syncing'
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : BigInt(selectedSharesCount) > purchasingProperty.availableShares || purchasingProperty.availableShares === 0n
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : isSubmitting || (effectiveTransactionStatus !== 'idle' && effectiveTransactionStatus !== 'error')
                        ? 'bg-emerald-600/50 text-white cursor-wait'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                    }`}
                  >
                    {isSubmitting || effectiveTransactionStatus === 'preparing-transaction' || effectiveTransactionStatus === 'awaiting-wallet-signature' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generating Proof & Submitting...</span>
                      </>
                    ) : effectiveTransactionStatus === 'transaction-submitted' || effectiveTransactionStatus === 'waiting-for-confirmation' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Confirming on Midnight...</span>
                      </>
                    ) : purchasingProperty.availableShares === 0n ? (
                      <span>Sold Out (0 Available)</span>
                    ) : BigInt(selectedSharesCount) > purchasingProperty.availableShares ? (
                      <span>Exceeds Available Shares</span>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Confirm Share Purchase</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
