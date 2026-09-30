import React, { useState } from 'react';
import {
  Lock, Eye, EyeOff, Shield, Edit3, Check, Clock,
  CheckCircle2, AlertCircle, Building2, PieChart,
  DollarSign, TrendingUp, RefreshCw,
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
  properties, portfolio, transactionHistory = [],
  isRestoringState = false, restorationError = null,
  onUpdateHolding, onSelectPropertyForProof,
}) => {
  const [masked, setMasked] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editShares, setEditShares] = useState('');
  const [editInv, setEditInv] = useState('');
  const [editRent, setEditRent] = useState('');

  const holdings = properties.filter(p => portfolio[p.id] && portfolio[p.id].ownershipShares > 0n);

  const totalCapital = holdings.reduce((s, p) => s + (portfolio[p.id]?.investmentAmountUsd ?? 0n), 0n);
  const totalShares  = holdings.reduce((s, p) => s + (portfolio[p.id]?.ownershipShares   ?? 0n), 0n);
  const totalRental  = holdings.reduce((s, p) => s + (portfolio[p.id]?.annualRentalIncomeUsd ?? 0n), 0n);

  const fmt = (n: bigint, prefix = '$') =>
    masked ? '••••••••' : `${prefix}${Number(n).toLocaleString()}`;

  const startEdit = (h: InvestorPrivateHolding) => {
    setEditId(h.propertyId);
    setEditShares(h.ownershipShares.toString());
    setEditInv(h.investmentAmountUsd.toString());
    setEditRent(h.annualRentalIncomeUsd.toString());
  };
  const saveEdit = (id: string) => {
    onUpdateHolding(id, {
      ownershipShares: BigInt(editShares || '0'),
      investmentAmountUsd: BigInt(editInv || '0'),
      annualRentalIncomeUsd: BigInt(editRent || '0'),
    });
    setEditId(null);
  };

  return (
    <div className="page-gap">

      {/* Restoring banner */}
      {isRestoringState && (
        <div className="alert alert-cyan animate-fade-in">
          <RefreshCw style={{ width: 18, height: 18, color: 'var(--cyan)', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>Restoring private portfolio…</p>
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Reconstructing client-side witness state from Midnight network.</p>
          </div>
        </div>
      )}
      {restorationError && (
        <div className="alert alert-rose">
          <AlertCircle style={{ width: 18, height: 18, color: 'var(--rose)', flexShrink: 0 }} />
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>{restorationError}</p>
        </div>
      )}

      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-icon page-icon-cyan">
            <Shield style={{ width: 26, height: 26, color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="page-title">Shielded Portfolio</h1>
            <p className="page-subtitle">
              Your holdings live exclusively in client-shielded witness storage.
              The public ledger never records your share counts or invested capital.
            </p>
          </div>
        </div>
        <button
          onClick={() => setMasked(v => !v)}
          className="btn btn-ghost"
          style={{ gap: 'var(--sp-2)' }}
        >
          {masked
            ? <><Eye style={{ width: 15, height: 15 }} /> Show Values</>
            : <><EyeOff style={{ width: 15, height: 15 }} /> Hide Values</>
          }
        </button>
      </div>

      {/* 4 stat cards */}
      <div className="grid-4">
        <div className="stat-card card-cyan">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Capital Deployed</span>
            <div className="stat-icon" style={{ background: 'var(--cyan-dim)', border: '1px solid var(--cyan-border)' }}>
              <DollarSign style={{ width: 18, height: 18, color: 'var(--cyan)' }} />
            </div>
          </div>
          <div className="stat-value tabular" style={{ color: 'var(--cyan)' }}>{fmt(totalCapital)}</div>
          <span className="stat-label">Total private capital</span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Total Shares</span>
            <div className="stat-icon" style={{ background: 'var(--violet-dim)', border: '1px solid var(--violet-border)' }}>
              <PieChart style={{ width: 18, height: 18, color: 'var(--violet-light)' }} />
            </div>
          </div>
          <div className="stat-value tabular" style={{ color: 'var(--violet-light)' }}>
            {masked ? '••••••••' : Number(totalShares).toLocaleString()}
          </div>
          <span className="stat-label">Fractional units held</span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Est. Annual Yield</span>
            <div className="stat-icon" style={{ background: 'var(--green-dim)', border: '1px solid var(--green-border)' }}>
              <TrendingUp style={{ width: 18, height: 18, color: 'var(--green)' }} />
            </div>
          </div>
          <div className="stat-value tabular" style={{ color: 'var(--green)' }}>{fmt(totalRental)}/yr</div>
          <span className="stat-label">Projected distribution</span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Active Holdings</span>
            <div className="stat-icon" style={{ background: 'var(--amber-dim)', border: '1px solid var(--amber-border)' }}>
              <Building2 style={{ width: 18, height: 18, color: 'var(--amber)' }} />
            </div>
          </div>
          <div className="stat-value tabular">{holdings.length}</div>
          <span className="stat-label">Properties with shares</span>
        </div>
      </div>

      {/* Holdings */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{
          padding: 'var(--sp-5) var(--sp-6)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <Building2 style={{ width: 16, height: 16, color: 'var(--cyan)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-1)' }}>
              Holdings by Property
            </span>
            <span className="badge badge-cyan">{holdings.length} assets</span>
          </div>
          <span className="badge badge-muted" style={{ fontSize: '0.625rem' }}>Client Witness State</span>
        </div>

        {holdings.length === 0 ? (
          <div className="empty-state">
            <Building2 style={{ width: 48, height: 48, color: 'var(--text-5)' }} />
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '1.0625rem', marginBottom: 'var(--sp-2)' }}>No Holdings Yet</p>
              <p style={{ color: 'var(--text-4)', fontSize: '0.9375rem', maxWidth: '32rem', lineHeight: 1.6 }}>
                Acquire fractional shares in the Marketplace to build your private portfolio.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {holdings.map(prop => {
              const h = portfolio[prop.id];
              const isEditing = editId === prop.id;
              const pct = prop.totalShares > 0n
                ? (Number((h.ownershipShares * 10000n) / prop.totalShares) / 100).toFixed(2)
                : '0.00';

              return (
                <div key={prop.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 'var(--sp-6)',
                  padding: 'var(--sp-5) var(--sp-6)',
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'center',
                }}>
                  {/* Property info + metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr auto', gap: 'var(--sp-6)', alignItems: 'center', minWidth: 0 }}>
                    {/* Identity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', minWidth: 0 }}>
                      <img
                        src={prop.imageUrl}
                        alt={prop.name}
                        style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
                        onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&q=60'; }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prop.name}</div>
                        <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-1)', flexWrap: 'wrap' }}>
                          <span className="badge badge-violet" style={{ fontSize: '0.5625rem' }}>{prop.id}</span>
                          <span className="badge badge-muted" style={{ fontSize: '0.5625rem' }}>{prop.assetType}</span>
                        </div>
                      </div>
                    </div>

                    {/* Metrics / Edit form */}
                    {isEditing ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-3)' }}>
                        {[
                          { label: 'Shares', val: editShares, set: setEditShares },
                          { label: 'Capital ($)', val: editInv, set: setEditInv },
                          { label: 'Rental ($/yr)', val: editRent, set: setEditRent },
                        ].map(f => (
                          <div key={f.label} className="form-group">
                            <label className="form-label">{f.label}</label>
                            <input
                              type="number"
                              value={f.val}
                              onChange={e => f.set(e.target.value)}
                              style={{ fontSize: '0.875rem', padding: 'var(--sp-2) var(--sp-3)' }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-3)' }}>
                        {[
                          { label: 'Private Shares', value: masked ? '••••••••' : `${Number(h.ownershipShares).toLocaleString()} (${pct}%)`, color: 'var(--cyan)' },
                          { label: 'Capital Invested', value: fmt(h.investmentAmountUsd), color: 'var(--text-1)' },
                          { label: 'Rental Yield', value: `${fmt(h.annualRentalIncomeUsd)}/yr`, color: 'var(--green)' },
                        ].map(m => (
                          <div key={m.label} className="private-field">
                            <div className="private-field-label">
                              <span>{m.label}</span>
                              <Lock style={{ width: 10, height: 10, color: 'var(--cyan)' }} />
                            </div>
                            <div className="private-field-value" style={{ color: m.color, fontSize: '0.9375rem' }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', alignItems: 'flex-end' }}>
                      {isEditing ? (
                        <button onClick={() => saveEdit(prop.id)} className="btn btn-primary btn-sm">
                          <Check style={{ width: 13, height: 13 }} /> Save
                        </button>
                      ) : (
                        <button onClick={() => startEdit(h)} className="btn btn-ghost btn-sm" title="Adjust test holding">
                          <Edit3 style={{ width: 13, height: 13 }} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ZK Proof button */}
                  <button
                    onClick={() => onSelectPropertyForProof(prop, 'ownership')}
                    className="btn btn-violet"
                    style={{ flexShrink: 0 }}
                  >
                    <Shield style={{ width: 14, height: 14 }} />
                    Generate ZK Proof
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{
          padding: 'var(--sp-5) var(--sp-6)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <Clock style={{ width: 16, height: 16, color: 'var(--text-4)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-1)' }}>On-Chain Activity</span>
          </div>
          <span className="badge badge-muted" style={{ fontSize: '0.625rem' }}>{transactionHistory.length} records</span>
        </div>
        {transactionHistory.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--sp-10) var(--sp-8)' }}>
            <Clock style={{ width: 36, height: 36, color: 'var(--text-5)' }} />
            <p style={{ color: 'var(--text-4)', fontSize: '0.9375rem' }}>No on-chain activity yet for this wallet.</p>
          </div>
        ) : (
          <div>
            {transactionHistory.map((tx, i) => (
              <div key={`${tx.txId}-${i}`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--sp-4) var(--sp-6)',
                borderBottom: i < transactionHistory.length - 1 ? '1px solid var(--border)' : 'none',
                gap: 'var(--sp-6)', flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-1)' }}>
                      {tx.propertyName || 'Share Purchase'}
                    </span>
                    <span className="badge badge-violet" style={{ fontSize: '0.5625rem' }}>{tx.propertyId}</span>
                    <span className="badge badge-green" style={{ fontSize: '0.5625rem' }}>
                      <CheckCircle2 style={{ width: 10, height: 10 }} /> Confirmed
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--sp-5)', fontSize: '0.8125rem', color: 'var(--text-4)', flexWrap: 'wrap' }}>
                    <span>Shares: <strong style={{ color: 'var(--text-2)' }}>{BigInt(tx.shares || '0').toLocaleString()}</strong></span>
                    <span>Value: <strong style={{ color: 'var(--text-2)' }}>${BigInt(tx.capitalUsd || '0').toLocaleString()}</strong></span>
                    <span>{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'Recent'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          /* Holdings row: 2-col instead of 3 */
        }
        @media (max-width: 640px) {
          /* Holdings: stack columns */
        }
      `}</style>
    </div>
  );
};
