import React, { useState, useEffect } from 'react';
import {
  Award, Lock, CheckCircle2, RefreshCw, AlertCircle,
  TrendingUp, ShieldCheck, Info, ArrowRight,
} from 'lucide-react';
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
  properties, selectedProperty, portfolio, isGenerating, proofStatus,
  onSelectProperty, onGenerateProof, onGenerateRentalProof, initialMode = 'compliance',
  onNavigateToMarketplace,
}) => {
  const currentProp = selectedProperty || properties[0];
  const holding = currentProp ? portfolio[currentProp.id] : undefined;

  const [mode, setMode] = useState<'compliance' | 'rental'>(initialMode);
  const [compMin, setCompMin] = useState(250_000);
  const [rentMin, setRentMin] = useState(30_000);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setMode(initialMode); }, [initialMode]);

  const isCompliance = mode === 'compliance';
  const hasHolding = Boolean(holding && (
    isCompliance ? holding.investmentAmountUsd > 0n : holding.annualRentalIncomeUsd > 0n
  ));

  const privateVal = holding
    ? (isCompliance ? holding.investmentAmountUsd : holding.annualRentalIncomeUsd)
    : 0n;
  const threshold = isCompliance ? compMin : rentMin;
  const eligible = hasHolding && privateVal >= BigInt(threshold);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProp || !hasHolding) return;
    setErr(null); setResult(null);
    try {
      const res = isCompliance
        ? await onGenerateProof(currentProp, BigInt(compMin))
        : await onGenerateRentalProof!(currentProp, BigInt(rentMin));
      setResult(res);
    } catch (ex: unknown) {
      setErr((ex as Error).message || 'Circuit constraint not satisfied.');
    }
  };

  const COMPLIANCE_TIERS = [
    { label: 'Standard Accredited', amount: 100_000, desc: '$100K minimum' },
    { label: 'Qualified Investor',  amount: 250_000, desc: '$250K minimum' },
    { label: 'Institutional Tier', amount: 500_000, desc: '$500K minimum' },
  ];
  const RENTAL_TIERS = [
    { label: 'Tier 1 — Base',   amount: 25_000, desc: '$25K / yr' },
    { label: 'Tier 2 — Target', amount: 40_000, desc: '$40K / yr' },
    { label: 'Tier 3 — High',   amount: 60_000, desc: '$60K / yr' },
  ];
  const tiers = isCompliance ? COMPLIANCE_TIERS : RENTAL_TIERS;
  const selectedTierAmt = isCompliance ? compMin : rentMin;
  const setTierAmt = isCompliance ? setCompMin : setRentMin;

  return (
    <form onSubmit={handleSubmit}>
      <div className="page-gap">

        {/* Page header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className={`page-icon ${isCompliance ? 'page-icon-violet' : 'page-icon-cyan'}`}>
              {isCompliance
                ? <Award style={{ width: 26, height: 26, color: 'var(--violet-light)' }} />
                : <TrendingUp style={{ width: 26, height: 26, color: 'var(--cyan)' }} />
              }
            </div>
            <div>
              <h1 className="page-title">
                {isCompliance ? 'Compliance & Accreditation Proof' : 'Rental Yield Proof'}
              </h1>
              <p className="page-subtitle">
                {isCompliance
                  ? 'Prove you meet regulatory capital requirements without disclosing your exact investment amount.'
                  : 'Prove your rental distribution meets a yield benchmark without revealing your actual earnings.'}
              </p>
            </div>
          </div>

          {/* Mode switcher */}
          <div className="seg-tabs" style={{ flexShrink: 0 }}>
            <button type="button" className={`seg-tab ${mode === 'compliance' ? 'active-violet' : ''}`}
              onClick={() => { setMode('compliance'); setResult(null); setErr(null); }}>
              <Award style={{ width: 14, height: 14 }} />
              Accreditation
            </button>
            <button type="button" className={`seg-tab ${mode === 'rental' ? 'active-violet' : ''}`}
              onClick={() => { setMode('rental'); setResult(null); setErr(null); }}>
              <TrendingUp style={{ width: 14, height: 14 }} />
              Rental Yield
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--sp-6)', alignItems: 'start' }}>

          {/* Left column */}
          <div className="section-gap">

            {/* Property selection */}
            <div className="card">
              <p className="section-label" style={{ marginBottom: 'var(--sp-4)' }}>
                Select Property
              </p>
              <div className="grid-3" style={{ gap: 'var(--sp-4)' }}>
                {properties.map(p => {
                  const sel = p.id === currentProp?.id;
                  const h = portfolio[p.id];
                  const hasShares = Boolean(h && (isCompliance ? h.investmentAmountUsd > 0n : h.annualRentalIncomeUsd > 0n));
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: sel ? 'var(--violet-light)' : 'var(--text-4)' }}>{p.id}</span>
                        {hasShares && <span className="badge badge-green" style={{ fontSize: '0.5625rem' }}>Holding</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* No holding alert */}
            {!hasHolding && currentProp && (
              <div className="alert alert-amber">
                <AlertCircle style={{ width: 18, height: 18, color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 'var(--sp-1)' }}>
                    No {isCompliance ? 'investment capital' : 'rental income'} found for {currentProp.name}
                  </p>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    Acquire fractional shares in the Marketplace to establish a private witness holding before generating this proof.
                  </p>
                </div>
                {onNavigateToMarketplace && (
                  <button type="button" onClick={onNavigateToMarketplace} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                    Marketplace <ArrowRight style={{ width: 13, height: 13 }} />
                  </button>
                )}
              </div>
            )}

            {/* Benchmark / tier selection */}
            <div className="card">
              <p className="section-label" style={{ marginBottom: 'var(--sp-4)' }}>
                {isCompliance ? 'Regulatory Benchmark' : 'Rental Yield Target'}
              </p>
              <div className="grid-3" style={{ gap: 'var(--sp-4)' }}>
                {tiers.map(t => {
                  const sel = selectedTierAmt === t.amount;
                  return (
                    <button
                      key={t.amount}
                      type="button"
                      disabled={!hasHolding}
                      onClick={() => setTierAmt(t.amount)}
                      className={`sel-card ${sel ? 'selected-violet' : ''} ${sel ? 'check-icon' : ''}`}
                      style={{ opacity: !hasHolding ? 0.45 : 1 }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-1)' }}>{t.label}</div>
                      <div style={{ fontSize: '0.875rem', color: sel ? 'var(--violet-light)' : 'var(--text-3)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {t.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Proof status / error / result */}
            {isGenerating && proofStatus && (
              <div className="alert alert-violet">
                <RefreshCw style={{ width: 18, height: 18, color: 'var(--violet-light)', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--text-2)' }}>{proofStatus}</span>
              </div>
            )}
            {err && (
              <div className="alert alert-rose">
                <AlertCircle style={{ width: 18, height: 18, color: 'var(--rose)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 'var(--sp-1)' }}>Circuit Constraint Failed</p>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', lineHeight: 1.6 }}>{err}</p>
                </div>
              </div>
            )}
            {result && (
              <div className="proof-result animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                  <CheckCircle2 style={{ width: 22, height: 22, color: 'var(--green)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-1)' }}>Proof Generated &amp; Verified</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginTop: 2 }}>Midnight circuit evaluation successful</div>
                  </div>
                </div>
                <div className="divider" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  {[
                    ['Public Claim', result.publicClaim],
                    ['ZK Circuit', result.zkirCircuit],
                    ['Commitment', result.proofHash.slice(0, 28) + '…'],
                    ['Private Amount', '🔒 NOT DISCLOSED'],
                  ].map(([k, v]) => (
                    <div key={k} className="proof-row">
                      <span style={{ color: 'var(--text-4)', fontSize: '0.875rem' }}>{k}</span>
                      <span style={{ color: k === 'ZK Circuit' || k === 'Commitment' ? 'var(--violet-light)' : k === 'Private Amount' ? 'var(--cyan)' : 'var(--text-1)', fontFamily: k === 'ZK Circuit' || k === 'Commitment' ? 'var(--font-mono)' : 'inherit', fontWeight: 500, textAlign: 'right', fontSize: '0.875rem' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="alert alert-blue" style={{ marginTop: 'var(--sp-2)' }}>
                  <Info style={{ width: 16, height: 16, color: 'var(--blue)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>
                    Auditors receive mathematical certainty. Your underlying {isCompliance ? 'capital' : 'income'} remains private.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right column — sticky summary panel */}
          <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + var(--sp-6))' }} className="section-gap">

            {/* Private data box */}
            <div className="card card-cyan">
              <p className="section-label" style={{ marginBottom: 'var(--sp-4)', color: 'var(--cyan)' }}>Your Shielded Data</p>
              <div className="private-field">
                <div className="private-field-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Lock style={{ width: 11, height: 11, color: 'var(--cyan)' }} />
                    {isCompliance ? 'Private Capital' : 'Rental Income'}
                  </span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.5625rem' }}>Shielded</span>
                </div>
                <div className="private-field-value" style={{ color: holding ? 'var(--cyan)' : 'var(--text-5)' }}>
                  {holding
                    ? `$${Number(privateVal).toLocaleString()}${isCompliance ? '' : '/yr'}`
                    : 'No holding'
                  }
                </div>
              </div>
              <div className="private-field" style={{ marginTop: 'var(--sp-3)' }}>
                <div className="private-field-label">
                  <span>Proof Threshold</span>
                </div>
                <div className="private-field-value">
                  ${selectedTierAmt.toLocaleString()}{isCompliance ? '' : '/yr'}
                </div>
              </div>
              <div className="private-field" style={{ marginTop: 'var(--sp-3)' }}>
                <div className="private-field-label">
                  <span>Eligibility</span>
                </div>
                <div style={{ marginTop: 'var(--sp-2)' }}>
                  {!hasHolding
                    ? <span className="badge badge-amber">No Holding</span>
                    : eligible
                      ? <span className="badge badge-green"><span className="badge-dot" style={{ background: 'var(--green)' }} /> Eligible</span>
                      : <span className="badge badge-rose">Below Threshold</span>
                  }
                </div>
              </div>
            </div>

            {/* Property info */}
            {currentProp && (
              <div className="card">
                <p className="section-label" style={{ marginBottom: 'var(--sp-3)' }}>Selected Property</p>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: 'var(--sp-1)' }}>{currentProp.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-4)', marginBottom: 'var(--sp-4)' }}>{currentProp.location}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  {[
                    ['Compliance Min', `$${Number(currentProp.complianceMinimumUsd).toLocaleString()}`],
                    ['Projected Yield', currentProp.projectedYieldApy],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-4)' }}>{k}</span>
                      <span style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate button */}
            <button
              type="submit"
              disabled={isGenerating || !hasHolding}
              className="btn btn-primary btn-full"
              style={{ fontSize: '1rem' }}
            >
              {isGenerating
                ? <><RefreshCw style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Evaluating Circuit…</>
                : !hasHolding
                  ? <><Lock style={{ width: 16, height: 16 }} /> Holdings Required</>
                  : <><ShieldCheck style={{ width: 16, height: 16 }} /> Generate {isCompliance ? 'Compliance' : 'Rental Yield'} Proof</>
              }
            </button>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-4)', textAlign: 'center', lineHeight: 1.5 }}>
              Your {isCompliance ? 'capital amount' : 'rental earnings'} stay private. Only the claim result is disclosed.
            </p>

            {/* What this reveals */}
            <div className="card">
              <p className="section-label" style={{ marginBottom: 'var(--sp-4)' }}>What this proof reveals</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                {[
                  { label: 'Claim result (VALID/INVALID)', color: 'var(--green)', icon: '✓ Disclosed' },
                  { label: 'Required threshold ($)', color: 'var(--green)', icon: '✓ Disclosed' },
                  { label: `Your exact ${isCompliance ? 'capital' : 'income'}`, color: 'var(--cyan)', icon: '🔒 Hidden' },
                  { label: 'Your identity / wallet', color: 'var(--cyan)', icon: '🔒 Hidden' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', gap: 'var(--sp-3)' }}>
                    <span style={{ color: 'var(--text-3)' }}>{r.label}</span>
                    <span style={{ color: r.color, fontWeight: 600, flexShrink: 0 }}>{r.icon}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: responsive collapse */}
        <style>{`
          @media (max-width: 900px) {
            form > .page-gap > div[style*="grid-template-columns: 1fr 360px"] {
              grid-template-columns: 1fr !important;
            }
            form > .page-gap > div[style*="grid-template-columns: 1fr 360px"] > div[style*="sticky"] {
              position: static !important;
            }
          }
        `}</style>
      </div>
    </form>
  );
};
