import React, { useState, useEffect } from 'react';
import { Award, Lock, CheckCircle2, RefreshCw, AlertCircle, Info } from 'lucide-react';
import type { PropertyMetadata, InvestorPrivateHolding, VerificationResult } from '../utils/contract';

interface ComplianceProofProps {
  properties: PropertyMetadata[];
  selectedProperty: PropertyMetadata | null;
  portfolio: Record<string, InvestorPrivateHolding>;
  isGenerating: boolean;
  proofStatus: string | null;
  onSelectProperty: (property: PropertyMetadata) => void;
  onGenerateProof: (property: PropertyMetadata, minimumUsd: bigint) => Promise<VerificationResult>;
  onGenerateRentalProof?: (property: PropertyMetadata, minimumYieldUsd: bigint) => Promise<VerificationResult>;
  initialMode?: 'compliance' | 'rental';
  onNavigateToMarketplace?: () => void;
}

export const ComplianceProof: React.FC<ComplianceProofProps> = ({
  properties,
  selectedProperty,
  portfolio,
  isGenerating,
  proofStatus,
  onSelectProperty,
  onGenerateProof,
  onGenerateRentalProof,
  initialMode = 'compliance',
  onNavigateToMarketplace,
}) => {
  const currentProperty = selectedProperty || properties[0];
  const holding = portfolio[currentProperty.id];
  const [proofMode, setProofMode] = useState<'compliance' | 'rental'>(initialMode);
  const hasHolding = Boolean(
    holding && (proofMode === 'compliance' ? holding.investmentAmountUsd > 0n : holding.annualRentalIncomeUsd > 0n)
  );
  const [minimumRequirement, setMinimumRequirement] = useState<number>(250_000);
  const [minimumYieldRequirement, setMinimumYieldRequirement] = useState<number>(30_000);
  const [lastResult, setLastResult] = useState<VerificationResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMode) {
      setProofMode(initialMode);
    }
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasHolding) return;
    setExecutionError(null);
    setLastResult(null);

    try {
      if (proofMode === 'compliance') {
        const res = await onGenerateProof(currentProperty, BigInt(minimumRequirement));
        setLastResult(res);
      } else if (onGenerateRentalProof) {
        const res = await onGenerateRentalProof(currentProperty, BigInt(minimumYieldRequirement));
        setLastResult(res);
      }
    } catch (err: any) {
      setExecutionError(err.message || 'Verification failed. Threshold requirement not satisfied.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
        {/* Mode Selector */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-slate-950 rounded-lg border border-slate-800 w-fit">
          <button
            type="button"
            onClick={() => {
              setProofMode('compliance');
              setLastResult(null);
              setExecutionError(null);
            }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              proofMode === 'compliance'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Accreditation & Compliance
          </button>
          <button
            type="button"
            onClick={() => {
              setProofMode('rental');
              setLastResult(null);
              setExecutionError(null);
            }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              proofMode === 'rental'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Confidential Rental Yield
          </button>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {proofMode === 'compliance'
                ? 'Verifiable Investor Compliance & Accreditation'
                : 'Confidential Rental Yield Proof'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {proofMode === 'compliance'
                ? 'Prove you meet regulatory accreditation criteria without revealing your net worth or total capital.'
                : 'Prove your property rental distribution satisfies yield benchmarks without disclosing private earnings.'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Property Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Associated Property Offering
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {properties.map((prop) => {
                const isSelected = prop.id === currentProperty.id;
                return (
                  <button
                    key={prop.id}
                    type="button"
                    onClick={() => {
                      onSelectProperty(prop);
                      setLastResult(null);
                      setExecutionError(null);
                    }}
                    className={`p-3.5 rounded-lg border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-600/10 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs truncate text-white">{prop.name}</span>
                    <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 mt-1">
                      <span>
                        {proofMode === 'compliance'
                          ? `Req: $${prop.complianceMinimumUsd.toLocaleString()}`
                          : `APY: ${prop.projectedYieldApy}`}
                      </span>
                      <span className="text-slate-400">{prop.availableShares.toLocaleString()} avail.</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy Callout */}
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>
                {proofMode === 'compliance' ? (
                  <>
                    Your Private Investment Capital:{' '}
                    <strong className="text-white">
                      ${holding?.investmentAmountUsd != null ? holding.investmentAmountUsd.toLocaleString() : '0'}
                    </strong>
                  </>
                ) : (
                  <>
                    Your Confidential Rental Income:{' '}
                    <strong className="text-white">
                      ${holding?.annualRentalIncomeUsd != null ? holding.annualRentalIncomeUsd.toLocaleString() : '0'}/yr
                    </strong>
                  </>
                )}
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              🔒 Shielded Witness
            </span>
          </div>

          {/* Zero Holding Callout */}
          {!hasHolding && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">
                    {proofMode === 'compliance' ? 'No Investment Capital Found' : 'No Rental Income Stream Found'}
                  </strong>
                  <span className="text-slate-300 mt-0.5 block">
                    You currently have no private holdings registered for {currentProperty.name}. Acquire fractional shares in the RWA Marketplace to establish verifiable capital and rental distributions.
                  </span>
                </div>
              </div>
              {onNavigateToMarketplace && (
                <button
                  type="button"
                  onClick={onNavigateToMarketplace}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap shadow transition shrink-0"
                >
                  Acquire Shares
                </button>
              )}
            </div>
          )}

          {/* Preset Requirements */}
          {proofMode === 'compliance' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Regulatory Benchmark
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Standard Accredited', amount: 100_000 },
                  { label: 'Qualified Investor', amount: 250_000 },
                  { label: 'Institutional Tier', amount: 500_000 },
                ].map((tier) => (
                  <button
                    key={tier.amount}
                    type="button"
                    onClick={() => setMinimumRequirement(tier.amount)}
                    disabled={!hasHolding}
                    className={`p-3 rounded-lg border text-left transition ${
                      minimumRequirement === tier.amount
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    } ${!hasHolding ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-xs font-bold">{tier.label}</div>
                    <div className="text-xs font-mono mt-1 opacity-90">${tier.amount.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Annual Rental Claim Benchmark
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Tier 1 Minimum Yield', amount: 25_000 },
                  { label: 'Tier 2 Target Yield', amount: 40_000 },
                  { label: 'Tier 3 High Yield', amount: 60_000 },
                ].map((tier) => (
                  <button
                    key={tier.amount}
                    type="button"
                    onClick={() => setMinimumYieldRequirement(tier.amount)}
                    disabled={!hasHolding}
                    className={`p-3 rounded-lg border text-left transition ${
                      minimumYieldRequirement === tier.amount
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    } ${!hasHolding ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-xs font-bold">{tier.label}</div>
                    <div className="text-xs font-mono mt-1 opacity-90">${tier.amount.toLocaleString()}/yr</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isGenerating || !hasHolding}
            className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating Midnight Circuit...</span>
              </>
            ) : !hasHolding ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Holdings Required to Prove (0 shares held)</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                <span>
                  {proofMode === 'compliance'
                    ? 'Generate Compliance Proof'
                    : 'Generate Rental Yield Proof'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Live Generating Progress Indicator */}
        {isGenerating && proofStatus && (
          <div className="mt-4 p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
            <span className="font-mono">{proofStatus}</span>
          </div>
        )}

        {/* Error State */}
        {executionError && (
          <div className="mt-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">
                {proofMode === 'compliance'
                  ? 'Compliance Requirement Rejected'
                  : 'Rental Yield Requirement Rejected'}
              </p>
              <p className="mt-0.5">{executionError}</p>
              <p className="mt-1 text-slate-400">
                The constraint was not satisfied in the Compact circuit. The private witness value did not meet the claimed threshold.
              </p>
            </div>
          </div>
        )}

        {/* Success */}
        {lastResult && (
          <div className="mt-6 p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>✓ Cryptographically Validated by Midnight Circuit</span>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 text-xs space-y-2.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Claim Verified:</span>
                <span className="font-semibold text-white">{lastResult.publicClaim}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Underlying Financial Amount:</span>
                <span className="font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  NOT DISCLOSED (🔒 PRIVATE)
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Zero-Knowledge Circuit:</span>
                <span className="font-mono text-indigo-400">{lastResult.zkirCircuit}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Regulator Verification Commitment:</span>
                <span className="font-mono text-slate-400 truncate max-w-[280px]">
                  {lastResult.proofHash}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Auditors can confirm you satisfy regulatory or financial thresholds without receiving access to your bank statements, tax returns, or private distribution accounts.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
