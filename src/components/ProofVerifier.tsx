import React, { useState } from 'react';
import {
  CheckCircle2, Shield, Lock, FileCheck,
  Hash, Clock, Copy, Check, Filter,
} from 'lucide-react';
import type { VerificationResult } from '../utils/contract';

interface ProofVerifierProps {
  verificationHistory: VerificationResult[];
}

const CLAIM_TYPE_LABELS: Record<string, string> = {
  OWNERSHIP_THRESHOLD: 'Ownership',
  COMPLIANCE_MINIMUM:  'Compliance',
  RENTAL_YIELD:        'Rental Yield',
};
const CLAIM_TYPE_BADGES: Record<string, string> = {
  OWNERSHIP_THRESHOLD: 'badge-violet',
  COMPLIANCE_MINIMUM:  'badge-green',
  RENTAL_YIELD:        'badge-cyan',
};

export const ProofVerifier: React.FC<ProofVerifierProps> = ({ verificationHistory }) => {
  const [filter, setFilter] = useState<'ALL' | 'OWNERSHIP_THRESHOLD' | 'COMPLIANCE_MINIMUM' | 'RENTAL_YIELD'>('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filtered = verificationHistory.filter(
    i => filter === 'ALL' || i.claimType === filter
  );

  const copyHash = (h: string) => {
    navigator.clipboard.writeText(h);
    setCopiedHash(h);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="page-gap">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-icon page-icon-violet">
            <FileCheck style={{ width: 26, height: 26, color: 'var(--violet-light)' }} />
          </div>
          <div>
            <h1 className="page-title">Proof Verifier</h1>
            <p className="page-subtitle">
              Auditor portal — verify cryptographic proof claims without accessing sensitive investor data.
            </p>
          </div>
        </div>
        <span className="badge badge-green">
          <span className="badge-dot" style={{ background: 'var(--green)' }} />
          ZK Verification Active
        </span>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: 'var(--text-4)', fontSize: '0.875rem' }}>
          <Filter style={{ width: 14, height: 14 }} />
          Filter:
        </div>
        {([
          { id: 'ALL', label: `All (${verificationHistory.length})` },
          { id: 'OWNERSHIP_THRESHOLD', label: 'Ownership' },
          { id: 'COMPLIANCE_MINIMUM',  label: 'Compliance' },
          { id: 'RENTAL_YIELD',        label: 'Rental Yield' },
        ] as const).map(opt => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            className={`filter-pill ${filter === opt.id ? 'active' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Shield style={{ width: 52, height: 52, color: 'var(--text-5)' }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: '1.0625rem', color: 'var(--text-1)', marginBottom: 'var(--sp-2)' }}>No Verifications Found</p>
              <p style={{ color: 'var(--text-4)', fontSize: '0.9375rem', maxWidth: '36rem', lineHeight: 1.6 }}>
                {verificationHistory.length === 0
                  ? 'Generate an ownership, compliance, or rental yield proof from the Portfolio or Proof pages to see verification logs here.'
                  : 'No records match the selected filter.'
                }
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="section-gap">
          {filtered.map((item, idx) => (
            <div key={idx} className="card animate-fade-in">

              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  <span className={`badge ${CLAIM_TYPE_BADGES[item.claimType] || 'badge-muted'}`}>
                    {CLAIM_TYPE_LABELS[item.claimType] || item.claimType}
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1875rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.015em' }}>
                    {item.publicClaim}
                  </h3>
                </div>
                <span className="badge badge-green" style={{ fontSize: '0.6875rem' }}>
                  <CheckCircle2 style={{ width: 11, height: 11 }} />
                  STATUS: VALID
                </span>
              </div>

              <div className="divider" style={{ marginBottom: 'var(--sp-5)' }} />

              {/* Two-column: public vs private */}
              <div className="grid-2" style={{ gap: 'var(--sp-4)' }}>
                {/* Public */}
                <div className="card-raised" style={{ borderRadius: 'var(--r-lg)', padding: 'var(--sp-5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)', paddingBottom: 'var(--sp-3)', borderBottom: '1px solid var(--border)' }}>
                    <span className="section-label">Disclosed (Public)</span>
                    <span className="badge badge-green" style={{ fontSize: '0.5625rem' }}>Verifiable</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                    {Object.entries(item.disclosedData).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--sp-3)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-4)' }}>{k}</span>
                        <span style={{ color: 'var(--text-1)', fontWeight: 600, textAlign: 'right' }}>{String(v)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--sp-3)', fontSize: '0.875rem', paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock style={{ width: 12, height: 12 }} /> Timestamp
                      </span>
                      <span style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Private */}
                <div className="card-raised card-cyan" style={{ borderRadius: 'var(--r-lg)', padding: 'var(--sp-5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)', paddingBottom: 'var(--sp-3)', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <Lock style={{ width: 13, height: 13, color: 'var(--cyan)' }} />
                      <span className="section-label">Protected Fields</span>
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.5625rem' }}>Shielded</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                    {item.undisclosedPrivateFields.map((field, fi) => (
                      <div key={fi} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-3)', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-3)' }}>{field.split('(')[0].trim()}</span>
                        <span className="badge badge-cyan" style={{ fontSize: '0.5625rem' }}>🔒 Private</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cryptographic footer */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--sp-4) var(--sp-5)',
                marginTop: 'var(--sp-4)',
                background: 'var(--bg-raised)',
                borderRadius: 'var(--r-md)',
                gap: 'var(--sp-4)', flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', minWidth: 0, flex: 1 }}>
                  <Hash style={{ width: 14, height: 14, color: 'var(--violet-light)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-4)', fontSize: '0.8125rem', flexShrink: 0 }}>ZK Commitment:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.proofHash}
                  </span>
                  <button
                    onClick={() => copyHash(item.proofHash)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedHash === item.proofHash ? 'var(--green)' : 'var(--text-4)', flexShrink: 0, display: 'flex' }}
                  >
                    {copiedHash === item.proofHash ? <Check style={{ width: 13, height: 13 }} /> : <Copy style={{ width: 13, height: 13 }} />}
                  </button>
                </div>
                <span className="badge badge-green" style={{ fontSize: '0.5625rem', flexShrink: 0 }}>
                  <CheckCircle2 style={{ width: 10, height: 10 }} /> Cryptographically Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
