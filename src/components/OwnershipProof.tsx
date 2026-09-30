import React, { useState } from 'react';
import {
  ShieldCheck, Lock, CheckCircle2, RefreshCw,
  AlertCircle, Info, ArrowRight,
} from 'lucide-react';
import type { PropertyMetadata, InvestorPrivateHolding, VerificationResult } from '../utils/contract';

interface OwnershipProofProps {
  properties: PropertyMetadata[];
  selectedProperty: PropertyMetadata | null;
  portfolio: Record<string, InvestorPrivateHolding>;
  isGenerating: boolean;
  proofStatus: string | null;
  onSelectProperty: (p: PropertyMetadata) => void;
  onGenerateProof: (p: PropertyMetadata, threshold: number) => Promise<VerificationResult>;
  onNavigateToMarketplace?: () => void;
}

export const OwnershipProof: React.FC<OwnershipProofProps> = ({
  properties, selectedProperty, portfolio, isGenerating, proofStatus,
  onSelectProperty, onGenerateProof, onNavigateToMarketplace,
}) => {
  const prop = selectedProperty || properties[0];
  const holding = prop ? portfolio[prop.id] : undefined;
  const hasHolding = Boolean(holding && holding.ownershipShares > 0n);

  const [threshold, setThreshold] = useState(10);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const actualPct = holding && prop && prop.totalShares > 0n
    ? Number(holding.ownershipShares * 10000n / prop.totalShares) / 100
    : 0;

  const eligible = hasHolding && actualPct >= threshold;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prop || !hasHolding) return;
    setErr(null); setResult(null);
    try {
      const res = await onGenerateProof(prop, threshold);
      setResult(res);
    } catch (ex: unknown) {
      setErr((ex as Error).message || 'Circuit constraint not satisfied.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="page-gap">

        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-icon page-icon-violet">
              <ShieldCheck style={{ width: 26, height: 26, color: 'var(--violet-light)' }} />
            </div>
            <div>
              <h1 className="page-title">Zero-Knowledge Ownership Proof</h1>
              <p className="page-subtitle">
                Prove you own at least a target percentage of a property without revealing your exact share count.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--sp-6)', alignItems: 'start' }}>

          {/* Left */}
          <div className="section-gap">

            {/* Property selector */}
            <div className="card">
              <p className="section-label" style={{ marginBottom: 'var(--sp-4)' }}>Select Property</p>
              <div className="grid-3" style={{ gap: 'var(--sp-4)' }}>
                {properties.map(p => {
                  const sel = p.id === prop?.id;
                  const h = portfolio[p.id];
                  const hasShares = Boolean(h && h.ownershipShares > 0n);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { onSelectProperty(p); setResult(null); setErr(null); }}
                      className={`sel-card ${sel ? 'selected-violet' : ''} ${sel ? 'check-icon' : ''}`}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-1)', marginBottom: 'var(--sp-1)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-4)' }}>{p.location}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--border)', fontSize: '0.75rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: sel ? 'var(--violet-light)' : 'var(--text-5)' }}>{p.id}</span>
                        {hasShares && <span className="badge badge-green" style={{ fontSize: '0.5625rem' }}>Holding</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* No holding */}
            {!hasHolding && prop && (
              <div className="alert alert-amber">
                <AlertCircle style={{ width: 18, height: 18, color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 'var(--sp-1)' }}>No shares held in {prop.name}</p>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    ZK circuits need private witness data. Acquire shares in the Marketplace first.
                  </p>
                </div>
                {onNavigateToMarketplace && (
                  <button type="button" onClick={onNavigateToMarketplace} className="btn btn-primary btn-sm">
                    Marketplace <ArrowRight style={{ width: 13, height: 13 }} />
                  </button>
                )}
              </div>
            )}

            {/* Threshold */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
                <p className="section-label">Ownership Threshold Claim</p>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.0625rem', color: 'var(--violet-light)' }}>
                  I own ≥ {threshold}%
                </span>
              </div>

              <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                {[5, 10, 15, 20].map(v => (
                  <button
                    key={v}
                    type="button"
                    disabled={!hasHolding}
                    onClick={() => setThreshold(v)}
                    className={`btn ${threshold === v ? 'btn-violet' : 'btn-ghost'} btn-sm`}
                    style={{ flex: 1 }}
                  >
                    {v}%
                  </button>
                ))}
              </div>

              <input
                type="range" min={1} max={50} step={1} value={threshold}
                disabled={!hasHolding}
                onChange={e => setThreshold(Number(e.target.value))}
              />
            </div>

            {/* Status / result / error */}
            {isGenerating && proofStatus && (
              <div className="alert alert-violet">
                <RefreshCw style={{ width: 18, height: 18, color: 'var(--violet-light)', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontSize: '0.875rem' }}>{proofStatus}</span>
              </div>
            )}
            {err && (
              <div className="alert alert-rose">
                <AlertCircle style={{ width: 18, height: 18, color: 'var(--rose)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 'var(--sp-1)' }}>Circuit Assertion Failed</p>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', lineHeight: 1.6 }}>{err}</p>
                  <p style={{ color: 'var(--text-4)', fontSize: '0.8125rem', marginTop: 'var(--sp-2)' }}>
                    Constraint: ownership ≥ {threshold}% was not satisfied by your private witness.
                  </p>
                </div>
              </div>
            )}
            {result && (
              <div className="proof-result animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                  <CheckCircle2 style={{ width: 22, height: 22, color: 'var(--green)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-1)' }}>Proof Generated &amp; Verified</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginTop: 2 }}>Midnight Compact circuit passed</div>
                  </div>
                </div>
                <div className="divider" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  {[
                    ['Public Claim', result.publicClaim],
                    ['ZK Circuit', result.zkirCircuit],
                    ['Commitment', result.proofHash.slice(0, 28) + '…'],
                    ['Ledger Update', '✓ Audit counter incremented'],
                    ['Exact Ownership', '🔒 NOT DISCLOSED'],
                  ].map(([k, v]) => (
                    <div key={k} className="proof-row">
                      <span style={{ color: 'var(--text-4)', fontSize: '0.875rem' }}>{k}</span>
                      <span style={{
                        color: k === 'ZK Circuit' || k === 'Commitment' ? 'var(--violet-light)' : k === 'Exact Ownership' ? 'var(--cyan)' : k === 'Ledger Update' ? 'var(--green)' : 'var(--text-1)',
                        fontFamily: k === 'ZK Circuit' || k === 'Commitment' ? 'var(--font-mono)' : 'inherit',
                        fontWeight: 500, textAlign: 'right', fontSize: '0.875rem',
                      }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sticky panel */}
          <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + var(--sp-6))' }} className="section-gap">

            <div className="card card-cyan">
              <p className="section-label" style={{ marginBottom: 'var(--sp-4)', color: 'var(--cyan)' }}>Your Shielded Holding</p>
              <div className="private-field">
                <div className="private-field-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Lock style={{ width: 11, height: 11, color: 'var(--cyan)' }} />
                    Shares Owned
                  </span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.5625rem' }}>Shielded</span>
                </div>
                <div className="private-field-value" style={{ color: 'var(--cyan)' }}>
                  {holding ? `${Number(holding.ownershipShares).toLocaleString()} (${actualPct.toFixed(2)}%)` : 'No holding'}
                </div>
              </div>
              <div className="private-field" style={{ marginTop: 'var(--sp-3)' }}>
                <div className="private-field-label"><span>Claim Threshold</span></div>
                <div className="private-field-value">{threshold}%</div>
              </div>
              <div className="private-field" style={{ marginTop: 'var(--sp-3)' }}>
                <div className="private-field-label"><span>Will Pass?</span></div>
                <div style={{ marginTop: 'var(--sp-2)' }}>
                  {!hasHolding
                    ? <span className="badge badge-amber">No Holding</span>
                    : eligible
                      ? <span className="badge badge-green"><span className="badge-dot" style={{ background: 'var(--green)' }} /> Will Pass</span>
                      : <span className="badge badge-rose">Will Fail</span>
                  }
                </div>
              </div>
            </div>

            {prop && (
              <div className="card">
                <p className="section-label" style={{ marginBottom: 'var(--sp-3)' }}>Selected Property</p>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-1)', marginBottom: 'var(--sp-1)' }}>{prop.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-4)', marginBottom: 'var(--sp-4)' }}>{prop.location}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-4)' }}>Total Shares</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontWeight: 600 }}>{Number(prop.totalShares).toLocaleString()}</span>
                </div>
              </div>
            )}

            <button type="submit" disabled={isGenerating || !hasHolding} className="btn btn-primary btn-full">
              {isGenerating
                ? <><RefreshCw style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Evaluating Circuit…</>
                : !hasHolding
                  ? <><Lock style={{ width: 16, height: 16 }} /> Holdings Required</>
                  : <><ShieldCheck style={{ width: 16, height: 16 }} /> Generate Ownership Proof</>
              }
            </button>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-4)', textAlign: 'center', lineHeight: 1.5 }}>
              Your exact share count stays private. Only the threshold claim is disclosed.
            </p>

            <div className="alert alert-blue">
              <Info style={{ width: 15, height: 15, color: 'var(--blue)', flexShrink: 0, marginTop: 2 }} />
              <p style={{ color: 'var(--text-3)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                The verifier learns your ownership is ≥ {threshold}%. Your actual {actualPct.toFixed(2)}% holding remains strictly private.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          form > .page-gap > div[style*="grid-template-columns: 1fr 360px"] {
            grid-template-columns: 1fr !important;
          }
          form > .page-gap > div > div[style*="sticky"] { position: static !important; }
        }
      `}</style>
    </form>
  );
};
