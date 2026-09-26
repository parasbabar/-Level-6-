import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  Edit3,
  Check,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  PieChart,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import type { PropertyMetadata, InvestorPrivateHolding } from '../utils/contract';
import type { MidnightTransactionRecord } from '../hooks/useMidnight';

interface PortfolioProps {
  properties: PropertyMetadata[];
  portfolio: Record<string, InvestorPrivateHolding>;
  transactionHistory?: MidnightTransactionRecord[];
  isRestoringState?: boolean;
  restorationError?: string | null;
  onUpdateHolding: (propertyId: string, updates: Partial<InvestorPrivateHolding>) => void;
  onSelectPropertyForProof: (property: PropertyMetadata, type: 'ownership' | 'compliance' | 'rental') => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({
  properties,
  portfolio,
  transactionHistory = [],
  isRestoringState = false,
  restorationError = null,
  onUpdateHolding,
  onSelectPropertyForProof,
}) => {
  const [showSensitiveData, setShowSensitiveData] = useState<boolean>(true);
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const [editShares, setEditShares] = useState<string>('');
  const [editInvestment, setEditInvestment] = useState<string>('');
  const [editRental, setEditRental] = useState<string>('');

  const startEdit = (holding: InvestorPrivateHolding) => {
    setEditingPropId(holding.propertyId);
    setEditShares(holding.ownershipShares.toString());
    setEditInvestment(holding.investmentAmountUsd.toString());
    setEditRental(holding.annualRentalIncomeUsd.toString());
  };

  const saveEdit = (propId: string) => {
    onUpdateHolding(propId, {
      ownershipShares: BigInt(editShares || '0'),
      investmentAmountUsd: BigInt(editInvestment || '0'),
      annualRentalIncomeUsd: BigInt(editRental || '0'),
    });
    setEditingPropId(null);
  };

  const propertiesWithHoldings = properties.filter(
    (prop) => portfolio[prop.id] && portfolio[prop.id].ownershipShares > 0n
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* State Restoration Banner */}
      {isRestoringState && (
        <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-2xl p-5 flex items-center gap-3.5 text-indigo-200 animate-pulse shadow-xl">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="text-xs">
            <strong className="text-white">Restoring your private portfolio from Midnight network...</strong>
            <span className="block text-indigo-300/80 mt-0.5">
              Reconstructing client-side witness state and verifying on-chain ledger records for your wallet.
            </span>
          </div>
        </div>
      )}

      {/* Restoration Error Banner */}
      {restorationError && (
        <div className="bg-rose-950/60 border border-rose-500/40 rounded-2xl p-5 flex items-center gap-3.5 text-rose-200 shadow-xl">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-xs">
            <strong className="text-rose-100">Portfolio restoration encountered an issue:</strong>
            <span className="block text-rose-300/90 mt-0.5">{restorationError}</span>
          </div>
        </div>
      )}

      {/* Header with Privacy Guarantee & Shield Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Shielded Private Portfolio</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                  <Lock className="w-2.5 h-2.5" /> CONFIDENTIAL
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            This information resides strictly within your client-side shielded witness storage. The Midnight blockchain and external observers never see raw share quantities or dollar amounts; only your generated Zero-Knowledge proofs verify specific claims.
          </p>
        </div>

        <button
          onClick={() => setShowSensitiveData(!showSensitiveData)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition self-start sm:self-auto shadow-sm"
        >
          {showSensitiveData ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
          <span>{showSensitiveData ? 'Hide Private Values' : 'Show Values'}</span>
        </button>
      </div>

      {/* Portfolio Aggregate Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Capital Deployed</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {showSensitiveData
              ? `$${propertiesWithHoldings
                  .reduce((acc, p) => acc + (portfolio[p.id]?.investmentAmountUsd || 0n), 0n)
                  .toLocaleString()}`
              : '••••••••••••'}
          </div>
          <span className="text-[11px] text-slate-500 block">Total private capital</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Shares Held</span>
            <PieChart className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            {showSensitiveData
              ? propertiesWithHoldings
                  .reduce((acc, p) => acc + (portfolio[p.id]?.ownershipShares || 0n), 0n)
                  .toLocaleString()
              : '••••••••••••'}
          </div>
          <span className="text-[11px] text-slate-500 block">Fractional units</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Est. Rental Yield</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300">
            {showSensitiveData
              ? `$${propertiesWithHoldings
                  .reduce((acc, p) => acc + (portfolio[p.id]?.annualRentalIncomeUsd || 0n), 0n)
                  .toLocaleString()} / yr`
              : '••••••••••••'}
          </div>
          <span className="text-[11px] text-slate-500 block">Projected distribution</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Shielded Assets</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {propertiesWithHoldings.length}
          </div>
          <span className="text-[11px] text-slate-500 block">Listed properties</span>
        </div>
      </div>

      {/* Property Holdings List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Investor Holdings by Property ({propertiesWithHoldings.length})
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Client Witness State
          </span>
        </div>

        {propertiesWithHoldings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Building2 className="w-12 h-12 mx-auto text-slate-600" />
            <h3 className="text-base font-semibold text-slate-200">No Private Holdings Found</h3>
            <p className="text-xs max-w-sm mx-auto text-slate-400">
              Acquire fractional shares from the RWA Marketplace to establish private witness holdings and generate zero-knowledge ownership proofs.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {propertiesWithHoldings.map((prop) => {
              const holding = portfolio[prop.id];
              const isEditing = editingPropId === prop.id;
              const ownershipPercentage =
                prop.totalShares > 0n
                  ? (Number((holding.ownershipShares * 10000n) / prop.totalShares) / 100).toFixed(2)
                  : '0.00';

              return (
                <div
                  key={prop.id}
                  className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:bg-slate-800/20 transition"
                >
                  {/* Property Identity */}
                  <div className="flex items-center gap-4 min-w-[260px]">
                    <img
                      src={prop.imageUrl}
                      alt={prop.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0 shadow-md"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white">{prop.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-indigo-400 font-bold">{prop.id}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {prop.assetType}
                        </span>
                      </div>
                      <span className="block text-[11px] text-slate-400 mt-1">
                        Supply: {prop.totalShares.toLocaleString()} shares | Available: {prop.availableShares.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Private Metrics or Edit Mode */}
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full bg-slate-950/80 p-3.5 rounded-xl border border-indigo-500/30">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-semibold">Shares Owned</label>
                        <input
                          type="number"
                          value={editShares}
                          onChange={(e) => setEditShares(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-semibold">Capital Invested ($)</label>
                        <input
                          type="number"
                          value={editInvestment}
                          onChange={(e) => setEditInvestment(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-semibold">Annual Rental ($)</label>
                        <input
                          type="number"
                          value={editRental}
                          onChange={(e) => setEditRental(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 flex-1 w-full lg:w-auto font-mono">
                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-sans">
                          <span>Private Shares</span>
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                        </div>
                        <div className="text-sm font-bold text-white mt-1">
                          {showSensitiveData ? (
                            <>
                              {holding.ownershipShares.toLocaleString()}{' '}
                              <span className="text-xs text-indigo-400 font-normal">
                                ({ownershipPercentage}%)
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-500">••••••••••</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-sans">
                          <span>Invested Capital</span>
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                        </div>
                        <div className="text-sm font-bold text-white mt-1">
                          {showSensitiveData ? (
                            `$${holding.investmentAmountUsd.toLocaleString()}`
                          ) : (
                            <span className="text-slate-500">••••••••••</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-sans">
                          <span>Rental Yield</span>
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                        </div>
                        <div className="text-sm font-bold text-emerald-400 mt-1">
                          {showSensitiveData ? (
                            `$${holding.annualRentalIncomeUsd.toLocaleString()}/yr`
                          ) : (
                            <span className="text-slate-500">••••••••••</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    {isEditing ? (
                      <button
                        onClick={() => saveEdit(prop.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(holding)}
                        className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition shadow-sm"
                        title="Adjust testnet private holding"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onSelectPropertyForProof(prop, 'ownership')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30"
                    >
                      Generate ZK Proof
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real Transaction History Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              On-Chain Activity Ledger (Midnight Preprod Records)
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {transactionHistory.length} On-Chain Records
          </span>
        </div>

        {transactionHistory.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-xs">
            No transaction activity recorded yet for this wallet on Midnight Preprod.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {transactionHistory.map((tx, idx) => {
              const dateStr = tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'Recent';

              return (
                <div
                  key={`${tx.txId}-${idx}`}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/20 transition"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {tx.propertyName || 'Property Share Purchase'}
                      </span>
                      <span className="text-xs font-mono text-indigo-400 font-semibold">{tx.propertyId}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Shielded Witness Allocation
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>
                        Shares: <strong className="text-slate-200">{BigInt(tx.shares || '0').toLocaleString()}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Proportional Valuation: <strong className="text-slate-200">${BigInt(tx.capitalUsd || '0').toLocaleString()}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">{dateStr}</span>
                    </div>

                    <div className="mt-1.5 text-[11px] font-mono text-slate-500 flex flex-wrap items-center gap-2">
                      <span className="text-emerald-400/90 font-sans">Shielded Witness Registered</span>
                      <span>•</span>
                      <span className="text-slate-400 font-sans">Midnight Preprod (Simulated Demo)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
