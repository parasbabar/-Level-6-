/**
 * PrivEstate - Transaction Metadata Extraction Utility
 *
 * Inspects Midnight transactions (balanced hex, serialized bytes, or runtime Transaction objects)
 * to safely extract authentic on-chain transaction hashes and identifiers for the Midnight Preprod Explorer.
 *
 * Never invents, hashes fake data, or derives mock transaction IDs.
 */

import { Transaction } from '@midnight-ntwrk/ledger-v8';

export interface ExtractedTxMetadata {
  txId: string;
  txHash: string;
  identifiers: string[];
}

/**
 * Safely extracts authentic transaction identifier and hash from a Midnight transaction object,
 * balanced transaction hex string, or Uint8Array binary.
 */
export function extractTxMetadata(tx: unknown): ExtractedTxMetadata {
  if (!tx) {
    return { txId: '', txHash: '', identifiers: [] };
  }

  let txBytes: Uint8Array | null = null;

  if (typeof tx === 'string') {
    const cleanHex = tx.trim();
    if (/^[0-9a-fA-F]+$/.test(cleanHex) && cleanHex.length % 2 === 0) {
      try {
        txBytes = Buffer.from(cleanHex, 'hex');
      } catch {
        txBytes = null;
      }
    }
  } else if (tx instanceof Uint8Array || Buffer.isBuffer(tx)) {
    txBytes = tx;
  } else if (typeof (tx as any)?.serialize === 'function') {
    try {
      txBytes = (tx as any).serialize();
    } catch {
      txBytes = null;
    }
  }

  // If the object already is an instantiated Transaction instance
  if (typeof (tx as any)?.transactionHash === 'function' || typeof (tx as any)?.identifiers === 'function') {
    try {
      let hash = '';
      let idents: string[] = [];
      if (typeof (tx as any)?.transactionHash === 'function') {
        try {
          const h = (tx as any).transactionHash();
          if (typeof h === 'string') hash = h.trim();
        } catch { /* ignore */ }
      }
      if (typeof (tx as any)?.identifiers === 'function') {
        try {
          const ids = (tx as any).identifiers();
          if (Array.isArray(ids)) {
            idents = ids.filter((id: any) => typeof id === 'string' && id.trim().length > 0);
          }
        } catch { /* ignore */ }
      }
      const primaryId = idents.length > 0 ? idents[0] : hash;
      if (primaryId || hash) {
        return {
          txId: primaryId || hash || '',
          txHash: hash || primaryId || '',
          identifiers: idents,
        };
      }
    } catch {
      // fallback to deserialization below
    }
  }

  if (txBytes && txBytes.length > 0) {
    // Attempt standard Midnight ledger-v8 deserialization marker combinations (all 18 combos)
    const signatureMarkers = ['signature', 'signature-erased'] as const;
    const proofMarkers = ['proof', 'pre-proof', 'no-proof'] as const;
    const bindingMarkers = ['binding', 'pre-binding', 'no-binding'] as const;

    for (const s of signatureMarkers) {
      for (const p of proofMarkers) {
        for (const b of bindingMarkers) {
          try {
            const deserialized = Transaction.deserialize(s, p, b, txBytes);
            if (deserialized) {
              let hash = '';
              let idents: string[] = [];
              try {
                const h = deserialized.transactionHash();
                if (typeof h === 'string') hash = h.trim();
              } catch {
                // ignore
              }
              try {
                const ids = deserialized.identifiers();
                if (Array.isArray(ids)) {
                  idents = ids.filter((id: any) => typeof id === 'string' && id.trim().length > 0);
                }
              } catch {
                // ignore
              }

              const primaryId = idents.length > 0 ? idents[0] : hash;
              if (primaryId || hash) {
                return {
                  txId: primaryId || hash || '',
                  txHash: hash || primaryId || '',
                  identifiers: idents,
                };
              }
            }
          } catch {
            // Try next marker combination
          }
        }
      }
    }
  }

  return { txId: '', txHash: '', identifiers: [] };
}
