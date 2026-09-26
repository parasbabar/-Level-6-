import React, { useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, RefreshCw, AlertCircle, Info } from 'lucide-react';
import type { PropertyMetadata, InvestorPrivateHolding, VerificationResult } from '../utils/contract';

interface OwnershipProofProps {
  properties: PropertyMetadata[];
  selectedProperty: PropertyMetadata | null;
  portfolio: Record<string, InvestorPrivateHolding>;
  isGenerating: boolean;
  proofStatus: string | null;
  onSelectProperty: (property: PropertyMetadata) => void;
  onGenerateProof: (property: PropertyMetadata, thresholdPercentage: number) => Promise<VerificationResult>;
  onNavigateToMarketplace?: () => void;
}

export const OwnershipProof: React.FC<OwnershipProofProps> = ({
  properties,
  selectedProperty,
  portfolio,
  isGenerating,
  proofStatus,
  onSelectProperty,
  onGenerateProof,
  onNavigateToMarketplace,
}) => {
  const currentProperty = selectedProperty || properties[0];
  const holding = portfolio[currentProperty.id];
  const hasHoldings = Boolean(holding && holding.ownershipShares > 0n);

  const [threshold, setThreshold] = useState<number>(10);
  const [lastResult, setLastResult] = useState<VerificationResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const actualOwnershipPercentage = holding && currentProperty.totalShares > 0n
    ? (Number(holding.ownershipShares * 10000n / currentProperty.totalShares) / 100)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasHoldings) return;
    setExecutionError(null);
    setLastResult(null);

    try {
      const res = await onGenerateProof(currentProperty, threshold);
      setLastResult(res);
    } catch (err: any) {
      setExecutionError(err.message || 'Verification failed. Constraint not satisfied.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Zero-Knowledge Ownership Proof</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Midnight Compact ZK
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Prove to lenders or counterparties that you own at least a target percentage without revealing your exact share count or raw asset balance.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Property Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Select Tokenized Property
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {properties.map((prop) => {
                const isSelected = prop.id === currentProperty.id;
                const propHolding = portfolio[prop.id];
                const propHasShares = Boolean(propHolding && propHolding.ownershipShares > 0n);

                return (
                  <button
                    key={prop.id}
                    type="button"
                    onClick={() => {
                      onSelectProperty(prop);
                      setLastResult(null);
                      setExecutionError(null);
                    }}
                    className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate text-white">{prop.name}</span>
                        {propHasShares && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" title="You hold shares" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{prop.location}</div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400 mt-2 pt-2 border-t border-slate-800/60">
                      <span>{prop.id}</span>
                      <span className="text-slate-400">{prop.availableShares.toLocaleString()} avail.</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy Witness Callout */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Your Shielded Private Holding:{' '}
                <strong className="text-white font-mono">{actualOwnershipPercentage.toFixed(2)}%</strong>{' '}
                ({holding?.ownershipShares != null ? holding.ownershipShares.toLocaleString() : '0'} shares)
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 self-start sm:self-auto">
              🔒 Shielded Witness
            </span>
          </div>

          {/* Zero Holdings Guidance Callout */}
          {!hasHoldings && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">No Private Shares Held in {currentProperty.name}</strong>
                  <span className="text-amber-300/80 mt-0.5 block leading-relaxed">
                    Zero-Knowledge circuits require private witness inputs. Acquire fractional shares through your connected Midnight Lace Wallet in the RWA Marketplace before generating an ownership proof.
                  </span>
                </div>
              </div>
              {onNavigateToMarketplace && (
                <button
                  type="button"
                  onClick={onNavigateToMarketplace}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap shadow-md transition shrink-0"
                >
                  Acquire Shares
                </button>
              )}
            </div>
          )}

          {/* Threshold Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Public Ownership Claim Threshold
              </label>
              <span className="text-sm font-bold font-mono text-indigo-400">
                I own at least {threshold}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[5, 10, 15, 20].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setThreshold(val)}
                  disabled={!hasHoldings}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                    threshold === val
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  } ${!hasHoldings ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {val}%
                </button>
              ))}
            </div>

            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={threshold}
              disabled={!hasHoldings}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className={`w-full accent-indigo-500 cursor-pointer ${
                !hasHoldings ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating || !hasHoldings}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating Midnight Circuit & Witness...</span>
              </>
            ) : !hasHoldings ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Holdings Required to Prove (0 shares held)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Generate & Verify ZK Proof</span>
              </>
            )}
          </button>
        </form>

        {/* Live Generating Progress Indicator */}
        {isGenerating && proofStatus && (
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
            <span className="font-mono">{proofStatus}</span>
          </div>
        )}

        {/* Error State */}
        {executionError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">Circuit Assertion Failed</p>
              <p className="mt-0.5">{executionError}</p>
              <p className="mt-1 text-slate-400">
                The constraint <code className="text-rose-300 font-mono">investorOwnership &gt;= {threshold}%</code> was not met by your private witness. The proof was rejected by the Midnight circuit.
              </p>
            </div>
          </div>
        )}

        {/* Verification Success Display */}
        {lastResult && (
          <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Proof Generated & Claim Verified via Midnight Circuit</span>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs space-y-2.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Public Claim:</span>
                <span className="font-semibold text-white">{lastResult.publicClaim}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Circuit Evaluated:</span>
                <span className="font-mono text-indigo-400">{lastResult.zkirCircuit}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">ZK Identity Commitment:</span>
                <span className="font-mono text-emerald-400 truncate max-w-[280px]">
                  {lastResult.proofHash}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Public Ledger Update:</span>
                <span className="font-semibold text-emerald-400">✓ Audit Log Counter Incremented</span>
              </div>
            </div>

            <div className="p-3.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong>Privacy Guarantee:</strong> The verifier learns that the claim is <strong>VALID</strong>. Your exact ownership percentage ({actualOwnershipPercentage.toFixed(2)}%) remains strictly private and was never disclosed.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
