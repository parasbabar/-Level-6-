import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import type { PropertyMetadata, InvestorPrivateHolding } from '../utils/contract';
import type { TransactionStatus, WalletConnectionStatus } from '../hooks/useMidnight';

interface PropertyMarketplaceProps {
  properties: PropertyMetadata[];
  portfolio: Record<string, InvestorPrivateHolding>;
  walletStatus: WalletConnectionStatus;
  transactionStatus: TransactionStatus;
  transactionTxId: string | null;
  transactionError: string | null;
  currentProofStatus?: string | null;
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
  transactionTxId,
  transactionError,
  currentProofStatus,
  onSelectPropertyForProof,
  onExecutePurchase,
  onResetTransaction,
  onNavigateToPortfolio,
  onNavigateToOwnershipProof,
}) => {
  const [purchasingProperty, setPurchasingProperty] = useState<PropertyMetadata | null>(null);
  const [selectedSharesCount, setSelectedSharesCount] = useState<number>(10_000);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // Track which property the current modal session is for — prevents stale transactionStatus
  // from a previous property's purchase bleeding into a new modal.
  const modalPropertyIdRef = useRef<string | null>(null);

  const pricePerShareUsd = purchasingProperty && purchasingProperty.totalShares > 0n
    ? purchasingProperty.totalValuationUsd / Number(purchasingProperty.totalShares)
    : 50;

  const calculatedCapitalUsd = BigInt(Math.round(selectedSharesCount * pricePerShareUsd));
  const calculatedOwnershipPct = purchasingProperty && purchasingProperty.totalShares > 0n
    ? ((selectedSharesCount / Number(purchasingProperty.totalShares)) * 100).toFixed(2)
    : '0.00';

  // Determine if the transactionStatus reflects THIS property's session (not a stale previous one)
  const isCurrentModalTx = modalPropertyIdRef.current === purchasingProperty?.id;
  const effectiveTransactionStatus: TransactionStatus =
    purchasingProperty && !isCurrentModalTx && transactionStatus === 'confirmed'
      ? 'idle'  // Don't show success screen for a different property's old confirmed tx
      : transactionStatus;

  const handleOpenPurchase = (prop: PropertyMetadata) => {
    // Always reset before opening a new property modal to clear stale wallet state
    onResetTransaction();
    modalPropertyIdRef.current = prop.id;
    setPurchasingProperty(prop);
    setSelectedSharesCount(Number(prop.totalShares) / 10); // default 10%
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span>Tokenized Real-World Assets (RWA)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real estate properties fractionalized into verifiable shares on Midnight Preprod.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
            3 Active RWA Assets
          </span>
        </div>
      </div>

      {/* Grid of properties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((prop) => {
          const existingHolding = portfolio[prop.id];
          const alreadyInvested = existingHolding && existingHolding.ownershipShares > 0n;
          return (
          <div
            key={prop.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shadow-lg transition duration-200 flex flex-col"
          >
            {/* Image & Status Badge */}
            <div className="relative h-48 w-full overflow-hidden bg-slate-800">
              <img
                src={prop.imageUrl}
                alt={prop.name}
                className="w-full h-full object-cover brightness-90 hover:scale-105 transition duration-500"
              />
              <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur text-slate-950 font-bold text-[10px] tracking-wide px-2.5 py-1 rounded shadow-md uppercase">
                {prop.status}
              </div>
              {alreadyInvested ? (
                <div className="absolute top-3 right-3 bg-emerald-900/90 backdrop-blur text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded border border-emerald-500/50 flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" />
                  <span>HOLDING</span>
                </div>
              ) : (
                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur text-emerald-400 text-xs font-mono font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
                  {prop.id}
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur text-white text-xs px-2.5 py-1 rounded flex items-center gap-1.5 border border-slate-800">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{prop.location}</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">{prop.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{prop.assetType}</p>

                {/* Share Transparency Breakdown & Visual Progress */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <PieChart className="w-3.5 h-3.5 text-indigo-400" /> Share Allocation
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {prop.availableShares.toLocaleString()} Available
                    </span>
                  </div>

                  {/* Share Availability Bar */}
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                    <div
                      style={{
                        width: `${
                          prop.totalShares > 0n
                            ? Math.min(100, Number((prop.acquiredShares * 10000n) / prop.totalShares) / 100)
                            : 0
                        }%`,
                      }}
                      className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full transition-all duration-300"
                      title="Acquired Shares"
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
                      title="Available Shares"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono">
                    <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase block">Total</span>
                      <span className="text-xs font-bold text-slate-200">{prop.totalShares.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase block">Acquired</span>
                      <span className="text-xs font-bold text-amber-400">{prop.acquiredShares.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase block">Available</span>
                      <span className="text-xs font-bold text-emerald-400">{prop.availableShares.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-slate-950/40 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-emerald-400" /> Valuation
                      </span>
                      <span className="text-xs font-semibold text-white mt-0.5 block">
                        ${(prop.totalValuationUsd / 1_000_000).toFixed(2)}M
                      </span>
                    </div>

                    <div className="bg-slate-950/40 p-2 rounded border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Percent className="w-3 h-3 text-indigo-400" /> Yield APY
                      </span>
                      <span className="text-xs font-semibold text-emerald-400 mt-0.5 block">
                        {prop.projectedYieldApy}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                {/* Primary: Acquire Fractional Shares */}
                <button
                  onClick={() => handleOpenPurchase(prop)}
                  className={`w-full py-2.5 px-3 ${
                    alreadyInvested
                      ? 'bg-slate-700 hover:bg-emerald-700 border border-emerald-600/40'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  } text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-emerald-950/30`}
                >
                  {alreadyInvested ? (
                    <><BadgeCheck className="w-4 h-4 text-emerald-400" /><span>Add More Shares</span></>
                  ) : (
                    <><ShoppingBag className="w-4 h-4" /><span>Acquire Fractional Shares</span></>
                  )}
                </button>

                {/* Secondary Proof Buttons */}
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
                    Prove Compliance
                  </button>
                  <button
                    onClick={() => onSelectPropertyForProof(prop, 'rental')}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition text-center"
                  >
                    Prove Rental Yield
                  </button>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Share Purchase & Wallet Signing Modal */}
      {purchasingProperty && (
        /* Use effectiveTransactionStatus so a stale 'confirmed' from a different property never shows here */
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Acquire Fractional RWA Shares</h3>
                  <span className="text-xs font-mono text-emerald-400">{purchasingProperty.name}</span>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            {effectiveTransactionStatus === 'confirmed' ? (
              /* Success Confirmation State */
              <div className="space-y-4 text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Transaction Confirmed on Preprod!</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Your fractional shares have been authenticated and securely registered into your client-side shielded witness storage.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-left space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Acquired Holding:</span>
                    <span className="font-semibold text-white">{selectedSharesCount.toLocaleString()} shares ({calculatedOwnershipPct}%)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Deployed Capital:</span>
                    <span className="font-semibold text-emerald-400">${Number(calculatedCapitalUsd).toLocaleString()}</span>
                  </div>
                  {transactionTxId && (
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Midnight Preprod Network Transaction ID (txId):</span>
                      <span className="font-mono text-[11px] text-indigo-400 break-all">{transactionTxId}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => {
                      handleCloseModal();
                      onNavigateToPortfolio();
                    }}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    View in Shielded Portfolio
                  </button>
                  <button
                    onClick={() => {
                      const prop = purchasingProperty;
                      handleCloseModal();
                      onNavigateToOwnershipProof(prop);
                    }}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
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
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs mb-3 font-mono">
                    <span className="text-slate-400">Available Inventory:</span>
                    <span className="text-emerald-400 font-bold">
                      {purchasingProperty.availableShares.toLocaleString()} / {purchasingProperty.totalShares.toLocaleString()} shares
                    </span>
                  </div>

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
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2 text-xs">
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
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs text-indigo-300 flex items-center gap-2.5">
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
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2.5">
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
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-center gap-2.5">
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
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <div>
                        <span className="font-bold text-rose-200">Wallet Prompt Status:</span>
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
                          className="px-2.5 py-1 text-[11px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded border border-rose-500/40 transition"
                        >
                          Reset & Retry
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
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
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
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
          </div>
        </div>
      )}
    </div>
  );
};

