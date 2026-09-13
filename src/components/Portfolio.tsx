import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Shield, Edit3, Check, Sparkles, ExternalLink, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
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
    <div className="space-y-6">
      {/* State Restoration Banner */}
      {isRestoringState && (
        <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-4 flex items-center gap-3 text-indigo-200 animate-pulse">
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
        <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-4 flex items-center gap-3 text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-xs">
            <strong className="text-rose-100">Portfolio restoration encountered an issue:</strong>
            <span className="block text-rose-300/90 mt-0.5">{restorationError}</span>
          </div>
        </div>
      )}

      {/* Header with Privacy Guarantee & Shield Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Shielded Private Portfolio</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> 🔒 PRIVATE & CONFIDENTIAL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            This information resides strictly within your client-side shielded storage. The Midnight blockchain and external observers never see these raw numbers; only your generated ZK proofs verify specific claims.
          </p>
                  </div>

                  {/* Portfolio Aggregate Summary Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Capital Deployed</span>
                      <span className="text-lg font-bold font-mono text-emerald-400">
                        {showSensitiveData
                          ? `$${propertiesWithHoldings
                              .reduce((acc, p) => acc + (portfolio[p.id]?.investmentAmountUsd || 0n), 0n)
                              .toLocaleString()}`
                          : '••••••••••••'}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Shares Held</span>
                      <span className="text-lg font-bold font-mono text-indigo-300">
                        {showSensitiveData
                          ? propertiesWithHoldings
                              .reduce((acc, p) => acc + (portfolio[p.id]?.ownershipShares || 0n), 0n)
                              .toLocaleString()
                          : '••••••••••••'}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Est. Annual Rental Yield</span>
                      <span className="text-lg font-bold font-mono text-purple-300">
                        {showSensitiveData
                          ? `$${propertiesWithHoldings
                              .reduce((acc, p) => acc + (portfolio[p.id]?.annualRentalIncomeUsd || 0n), 0n)
                              .toLocaleString()} / yr`
                          : '••••••••••••'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Property Identity & Holdings List */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Investor Holdings by Property ({propertiesWithHoldings.length})
                    </span>
                    <span className="text-[11px] font-mono text-indigo-400">
                      Client-side Witness State
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800">
                    {propertiesWithHoldings.map((prop) => {
                      const holding = portfolio[prop.id];
                      const isEditing = editingPropId === prop.id;
                      const ownershipPercentage =
                        prop.totalShares > 0n
                          ? (Number(holding.ownershipShares * 10000n / prop.totalShares) / 100).toFixed(2)
                          : '0.00';

                      return (
                        <div key={prop.id} className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:bg-slate-800/30 transition">
                          {/* Property Identity */}
                          <div className="flex items-center gap-4 min-w-[260px]">
                            <img
                              src={prop.imageUrl}
                              alt={prop.name}
                              className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
                            />
                            <div>
                              <h4 className="font-bold text-sm text-white">{prop.name}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-mono text-indigo-400 font-bold">{prop.id}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {prop.availableShares.toLocaleString()} avail.
                                </span>
                              </div>
                              <span className="block text-[11px] text-slate-400 mt-1">
                                Pool: {prop.totalShares.toLocaleString()} shares | Acquired: {prop.acquiredShares.toLocaleString()}
                              </span>
                            </div>
                          </div>

                  {/* Private Metrics or Edit Mode */}
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full bg-slate-950/60 p-3 rounded-lg border border-indigo-500/30">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase">Shares Owned</label>
                        <input
                          type="number"
                          value={editShares}
                          onChange={(e) => setEditShares(e.target.value)}
                          className="w-full mt-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase">Capital Invested ($)</label>
                        <input
                          type="number"
                          value={editInvestment}
                          onChange={(e) => setEditInvestment(e.target.value)}
                          className="w-full mt-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase">Annual Rental ($)</label>
                        <input
                          type="number"
                          value={editRental}
                          onChange={(e) => setEditRental(e.target.value)}
                          className="w-full mt-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 flex-1 w-full lg:w-auto">
                      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Private Shares</span>
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                        </div>
                        <div className="text-sm font-semibold text-white mt-1">
                          {showSensitiveData ? (
                            <>
                              {holding.ownershipShares.toLocaleString()}{' '}
                              <span className="text-xs text-indigo-400 font-normal">
                                ({ownershipPercentage}%)
                              </span>
                            </>
                          ) : (
                            <span className="font-mono text-slate-500">••••••••••</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Invested Capital</span>
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                        </div>
                        <div className="text-sm font-semibold text-white mt-1">
                          {showSensitiveData ? (
                            `$${holding.investmentAmountUsd.toLocaleString()}`
                          ) : (
                            <span className="font-mono text-slate-500">••••••••••</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Rental Yield</span>
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                        </div>
                        <div className="text-sm font-semibold text-emerald-400 mt-1">
                          {showSensitiveData ? (
                            `$${holding.annualRentalIncomeUsd.toLocaleString()}/yr`
                          ) : (
                            <span className="font-mono text-slate-500">••••••••••</span>
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
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(holding)}
                        className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                        title="Adjust testnet private holding"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onSelectPropertyForProof(prop, 'ownership')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
                    >
                      Prove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Real Transaction History Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Transaction History (Midnight Preprod Ledger Records)
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">
            {transactionHistory.length} On-Chain Records
          </span>
        </div>

        {transactionHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No transaction activity recorded yet for this wallet on Midnight Preprod.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {transactionHistory.map((tx, idx) => {
              const isConfirmed = tx.status === 'confirmed';
              const dateStr = tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'Recent';

              return (
                <div key={`${tx.txId}-${idx}`} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/20 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{tx.propertyName || 'Property Share Purchase'}</span>
                      <span className="text-xs font-mono text-indigo-400">{tx.propertyId}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isConfirmed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {isConfirmed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Confirmed on Midnight Preprod
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-amber-400" /> Transaction submitted — verification pending
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                      <span>Shares: <strong className="text-slate-200">{BigInt(tx.shares || '0').toLocaleString()}</strong></span>
                      <span>•</span>
                      <span>Capital: <strong className="text-slate-200">${BigInt(tx.capitalUsd || '0').toLocaleString()}</strong></span>
                      <span>•</span>
                      <span className="text-slate-500">{dateStr}</span>
                    </div>

                    <div className="mt-1.5 text-[11px] font-mono text-slate-500 flex items-center gap-2">
                      <span>TX Hash:</span>
                      <span className="text-slate-300 select-all">{tx.txId}</span>
                      <a
                        href={`https://explorer.preprod.midnight.network/tx/${tx.txId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
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
