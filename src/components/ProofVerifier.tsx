import React from 'react';
import { CheckCircle2, Shield, Lock, FileCheck, Hash, Clock } from 'lucide-react';
import type { VerificationResult } from '../utils/contract';

interface ProofVerifierProps {
  verificationHistory: VerificationResult[];
}

export const ProofVerifier: React.FC<ProofVerifierProps> = ({ verificationHistory }) => {
  const [filterType, setFilterType] = React.useState<'ALL' | 'OWNERSHIP_THRESHOLD' | 'COMPLIANCE_MINIMUM' | 'RENTAL_YIELD'>('ALL');

  const filteredHistory = verificationHistory.filter(
    (item) => filterType === 'ALL' || item.claimType === filterType
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Auditor & Regulator Proof Verifier</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify cryptographic claims without accessing sensitive investor records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero-Knowledge Verification Active</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      {verificationHistory.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium">
          <span className="text-slate-400 font-semibold mr-1">Filter Claims:</span>
          {[
            { id: 'ALL', label: `All Proofs (${verificationHistory.length})` },
            { id: 'OWNERSHIP_THRESHOLD', label: 'Ownership Claims' },
            { id: 'COMPLIANCE_MINIMUM', label: 'Compliance Claims' },
            { id: 'RENTAL_YIELD', label: 'Rental Yield Claims' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* History / Audit Log */}
      {filteredHistory.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-3">
          <Shield className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
          <h3 className="text-base font-semibold text-slate-200">No Verifications Found</h3>
          <p className="text-xs max-w-md mx-auto text-slate-400">
            {verificationHistory.length === 0
              ? 'Generate an ownership proof or compliance proof from the marketplace or portfolio tab to see live auditor verification logs here.'
              : 'No verified proof records match the selected claim filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
            Verified Audit Logs ({filteredHistory.length})
          </h3>

          {filteredHistory.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-5 hover:border-slate-700 transition"
            >
              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {item.claimType}
                  </span>
                  <h4 className="text-base font-bold text-white mt-1">{item.publicClaim}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>STATUS: VALID</span>
                  </span>
                </div>
              </div>

              {/* Auditor Grid: Public vs Private Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: What the Auditor Learns (PUBLIC CLAIMS) */}
                <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Publicly Disclosed Audit Data
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">VERIFIABLE</span>
                  </div>

                  {Object.entries(item.disclosedData).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{key}:</span>
                      <span className="font-semibold text-white font-mono">{val}</span>
                    </div>
                  ))}

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Right: What Remains Strictly Hidden (PRIVATE DATA) */}
                <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      Protected Private Fields
                    </span>
                    <span className="text-[10px] text-indigo-300 font-mono">SHIELDED</span>
                  </div>

                  <ul className="space-y-2 text-xs">
                    {item.undisclosedPrivateFields.map((field, fIdx) => (
                      <li key={fIdx} className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">{field.split('(')[0].trim()}:</span>
                        <span className="font-bold font-mono text-[11px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          🔒 PRIVATE
                        </span>
                      </li>
                    ))}
                    <li className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Rental Income Details:</span>
                      <span className="font-bold font-mono text-[11px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        🔒 NOT DISCLOSED
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Cryptographic Proof Verification Footer */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-400 truncate">
                  <Hash className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>ZK Commitment:</span>
                  <span className="text-slate-200 truncate">{item.proofHash}</span>
                </div>
                <div className="text-emerald-400 text-[11px] shrink-0 font-semibold">
                  ✓ Cryptographically Verified on Midnight
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
