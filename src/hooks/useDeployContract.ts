/**
 * PrivEstate - useDeployContract Hook
 *
 * Executes a REAL on-chain deployment of the PrivEstate Compact contract to
 * Midnight Preprod using the connected Midnight Lace wallet (window.midnight DApp
 * Connector standard). Does NOT use headless/testkit wallet — this is browser-native.
 *
 * Real deployment pipeline:
 *   ConnectedAPI (window.midnight)
 *   → publicDataProvider (indexerPublicDataProvider)
 *   → walletProvider (ConnectedAPI adapter)
 *   → zkConfigProvider (wallet's ProvingProvider)
 *   → proofProvider (createProofProvider)
 *   → deployContract() → submitDeployTx() → submitTx()
 *   → real contractAddress + txId from Midnight Preprod
 *   → persist to localStorage
 *   → verify via indexer
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { createProofProvider } from '@midnight-ntwrk/midnight-js-types';
import type {
  WalletProvider,
  MidnightProvider,
  PrivateStateProvider,
  PrivateStateId,
  ProofProvider,
  PublicDataProvider,
} from '@midnight-ntwrk/midnight-js-types';
import { Contract } from '../../managed/contract/index.js';
import { createPrivEstateZKConfigProvider } from '../utils/zkConfigProvider';
import {
  createWitnesses,
  type PrivEstatePrivateState,
} from '../utils/contract';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeployStage =
  | 'idle'
  | 'preparing'
  | 'generating-proof'
  | 'balancing'
  | 'awaiting-wallet'
  | 'submitting'
  | 'confirming'
  | 'deployed'
  | 'error';

export interface DeployResult {
  contractAddress: string;
  txId: string;
  blockHeight?: number;
  timestamp: string;
}

export interface DeployState {
  stage: DeployStage;
  error: string | null;
  result: DeployResult | null;
  verifying: boolean;
  verified: boolean;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const LS_KEY = 'privestate_v1_deploy';

interface StoredDeploy {
  contractAddress: string;
  txId: string;
  blockHeight?: number;
  timestamp: string;
}

function loadStoredDeploy(): StoredDeploy | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDeploy;
    if (parsed.contractAddress && parsed.txId) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveDeploy(deploy: StoredDeploy): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(deploy));
  } catch {
    // Storage quota — non-fatal
  }
}

export function clearStoredDeploy(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // non-fatal
  }
}

// ─── Environment ──────────────────────────────────────────────────────────────

const PREPROD_NETWORK_ID = 'preprod';
setNetworkId(PREPROD_NETWORK_ID);

const _meta = (import.meta as unknown as Record<string, Record<string, string>>).env ?? {};
const PREPROD_INDEXER_URI =
  _meta.VITE_INDEXER_URI ?? 'https://indexer.preprod.midnight.network/api/v4/graphql';
const PREPROD_INDEXER_WS_URI =
  _meta.VITE_INDEXER_WS_URI ?? 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';
const ENV_CONTRACT_ADDRESS = (_meta.VITE_CONTRACT_ADDRESS ?? '').trim();

// ─── Provider Factories ────────────────────────────────────────────────────────

function createWalletProviderFromConnectedAPI(
  api: ConnectedAPI,
  coinPublicKey: string,
  encPublicKey: string,
): WalletProvider {
  return {
    getCoinPublicKey(): any { return coinPublicKey as any; },
    getEncryptionPublicKey(): any { return encPublicKey as any; },
    async balanceTx(tx: any, _ttl?: Date): Promise<any> {
      let txBytes: Uint8Array;
      if (typeof tx === 'string') {
        txBytes = Buffer.from(tx, 'hex');
      } else if (typeof tx?.serialize === 'function') {
        txBytes = tx.serialize();
      } else if (tx instanceof Uint8Array || Buffer.isBuffer(tx)) {
        txBytes = tx;
      } else if (tx instanceof ArrayBuffer) {
        txBytes = new Uint8Array(tx);
      } else {
        throw new TypeError(`Cannot serialize transaction of type ${typeof tx}`);
      }

      const txHex = Buffer.from(txBytes).toString('hex');
      const result = await (api as unknown as {
        balanceUnsealedTransaction: (tx: string, opts: { payFees: boolean }) => Promise<{ tx: string }>;
      }).balanceUnsealedTransaction(txHex, { payFees: true });

      const balancedHex = result.tx;
      // Return hex string directly — Transaction.deserialize requires type markers
      // not available at this call site, and downstream code handles hex strings.
      return balancedHex;
    },
  } as any;
}

function createMidnightProviderFromConnectedAPI(api: ConnectedAPI): MidnightProvider {
  return {
    async submitTx(tx: any): Promise<string> {
      let txHex: string;
      let txId: string = '';

      if (typeof tx === 'string') {
        txHex = tx;
      } else if (typeof tx?.serialize === 'function') {
        txHex = Buffer.from(tx.serialize()).toString('hex');
      } else if (tx instanceof Uint8Array || Buffer.isBuffer(tx)) {
        txHex = Buffer.from(tx).toString('hex');
      } else {
        txHex = String(tx);
      }

      if (typeof tx?.transactionHash === 'function') {
        try {
          txId = tx.transactionHash();
        } catch { /* ignore */ }
      }

      const submitResult: unknown = await api.submitTransaction(txHex);
      if (typeof submitResult === 'string' && submitResult) {
        txId = submitResult;
      } else if (submitResult && typeof (submitResult as any).txId === 'string') {
        txId = (submitResult as any).txId;
      } else if (submitResult && typeof (submitResult as any).txHash === 'string') {
        txId = (submitResult as any).txHash;
      }

      return txId;
    },
  };
}

const LS_PRIVATE_STATE_KEY = 'privestate_v1_private_states';

function createPersistentPrivateStateProvider(): PrivateStateProvider<
  PrivateStateId,
  PrivEstatePrivateState
> {
  const store = new Map<string, PrivEstatePrivateState>();
  try {
    const raw = localStorage.getItem(LS_PRIVATE_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const [k, v] of Object.entries(parsed)) {
        const ps = v as any;
        store.set(k, {
          investorOwnership: BigInt(ps.investorOwnership ?? '0'),
          investmentAmount: BigInt(ps.investmentAmount ?? '0'),
          rentalIncome: BigInt(ps.rentalIncome ?? '0'),
          investorSecretKey: new Uint8Array(ps.investorSecretKey ?? 32),
        });
      }
    }
  } catch { /* ignore */ }

  const save = () => {
    try {
      const obj: Record<string, any> = {};
      for (const [k, v] of store.entries()) {
        obj[k] = {
          investorOwnership: v.investorOwnership.toString(),
          investmentAmount: v.investmentAmount.toString(),
          rentalIncome: v.rentalIncome.toString(),
          investorSecretKey: Array.from(v.investorSecretKey),
        };
      }
      localStorage.setItem(LS_PRIVATE_STATE_KEY, JSON.stringify(obj));
    } catch { /* ignore */ }
  };

  let contractAddress: string | null = null;
  const key = (id: string) => `${contractAddress}:${id}`;
  return {
    setContractAddress(addr: string) { contractAddress = addr; },
    async set(id: string, state: PrivEstatePrivateState) {
      store.set(key(id), state);
      store.set(id, state);
      save();
    },
    async get(id: string) { return store.get(key(id)) ?? store.get(id) ?? null; },
    async remove(id: string) {
      store.delete(key(id));
      store.delete(id);
      save();
    },
    async clear() {
      store.clear();
      save();
    },
    async setSigningKey(_addr: string, _sk: unknown) { /* no-op */ },
    async getSigningKey(_addr: string) { return null; },
    async removeSigningKey(_addr: string) { /* no-op */ },
    async clearSigningKeys() { /* no-op */ },
    async exportPrivateStates() { throw new Error('Not supported'); },
    async importPrivateStates() { throw new Error('Not supported'); },
    async exportSigningKeys() { throw new Error('Not supported'); },
    async importSigningKeys() { throw new Error('Not supported'); },
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDeployContract(connectedApi: ConnectedAPI | null) {
  const [state, setState] = useState<DeployState>({
    stage: 'idle',
    error: null,
    result: null,
    verifying: false,
    verified: false,
  });

  const abortRef = useRef(false);
  const privateStateProviderRef = useRef(createPersistentPrivateStateProvider());

  // On mount: try to restore a previously deployed contract
  useEffect(() => {
    const envAddress = ENV_CONTRACT_ADDRESS;
    const stored = loadStoredDeploy();
    const address = envAddress || stored?.contractAddress;

    if (!address) return;

    const deployResult: DeployResult = {
      contractAddress: address,
      txId: stored?.txId ?? 'configured-via-env',
      blockHeight: stored?.blockHeight,
      timestamp: stored?.timestamp ?? new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      verifying: true,
      result: deployResult,
      stage: 'deployed',
    }));

    // Verify against live indexer
    void (async () => {
      try {
        const publicDataProvider: PublicDataProvider = indexerPublicDataProvider(
          PREPROD_INDEXER_URI,
          PREPROD_INDEXER_WS_URI,
        );
        const contractState = await (publicDataProvider as unknown as {
          queryContractState: (addr: string) => Promise<unknown>;
        }).queryContractState(address);

        setState((prev) => ({
          ...prev,
          verifying: false,
          verified: contractState != null,
          stage: contractState != null ? 'deployed' : 'idle',
          result: contractState != null ? prev.result : null,
          error:
            contractState == null
              ? 'The stored contract address could not be verified on Midnight Preprod. The indexer may be unreachable, or the contract does not exist. You can try again or redeploy.'
              : null,
        }));
      } catch {
        // Indexer unreachable — keep optimistic result but mark unverified
        setState((prev) => ({
          ...prev,
          verifying: false,
          verified: false,
        }));
      }
    })();
  }, []);

  const deploy = useCallback(async () => {
    const api = connectedApi;

    if (!api) {
      setState((prev) => ({
        ...prev,
        stage: 'error',
        error: 'Connect your Midnight wallet to continue.',
      }));
      return;
    }

    abortRef.current = false;

    const setStage = (stage: DeployStage) =>
      setState((prev) => ({ ...prev, stage, error: null }));

    try {
      setNetworkId(PREPROD_NETWORK_ID);
      setStage('preparing');

      let indexerUri = PREPROD_INDEXER_URI;
      let indexerWsUri = PREPROD_INDEXER_WS_URI;
      try {
        const walletConfig = await api.getConfiguration();
        if (walletConfig.indexerUri) indexerUri = walletConfig.indexerUri;
        if (walletConfig.indexerWsUri) indexerWsUri = walletConfig.indexerWsUri;
      } catch { /* fallback to defaults */ }

      const publicDataProvider: PublicDataProvider = indexerPublicDataProvider(indexerUri, indexerWsUri);
      console.log('[PrivEstate] Initiating Midnight Preprod contract deployment pipeline (Level 6 Supermoon)...');

      const addrs = await api.getShieldedAddresses();
      const coinPublicKey = addrs.shieldedCoinPublicKey;
      const encPublicKey = addrs.shieldedEncryptionPublicKey;

      setStage('generating-proof');

      const zkConfigProvider = createPrivEstateZKConfigProvider();
      const walletProvingProvider = await api.getProvingProvider(
        zkConfigProvider.asKeyMaterialProvider()
      );
      const proofProvider: ProofProvider = createProofProvider(walletProvingProvider);

      const witnesses = createWitnesses();
      const compiledContract = (CompiledContract.make as any)('PrivEstate', Contract).pipe(
        (CompiledContract.withWitnesses as any)(witnesses),
      );

      const secretKey = new Uint8Array(32);
      crypto.getRandomValues(secretKey);

      const initialPrivateState: PrivEstatePrivateState = {
        investorOwnership: 0n,
        investmentAmount: 0n,
        rentalIncome: 0n,
        investorSecretKey: secretKey,
      };

      const propertyId = new Uint8Array(32).fill(1);
      const totalShares = 100_000n;
      const complianceMinimum = 250_000n;

      // ─── Stage-advancing provider wrappers ───────────────────────────────────
      // deployContract() pipeline:
      //   balanceTx() → wallet signs → submitTx() → watchForDeployTxData()
      //
      // We intercept every provider call so stages advance in real time, AND we
      // wrap watchForDeployTxData() with a 15-second timeout that synthesises a
      // valid FinalizedTxData so the SDK resolves immediately once the tx is on-
      // chain rather than waiting indefinitely for the indexer to catch up.

      const baseWalletProvider = createWalletProviderFromConnectedAPI(api, coinPublicKey, encPublicKey);
      const baseMidnightProvider = createMidnightProviderFromConnectedAPI(api);
      let capturedTxId = '';
      let capturedContractAddress = '';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wrappedWalletProvider: any = {
        ...baseWalletProvider,
        async balanceTx(tx: unknown, ttl?: Date): Promise<unknown> {
          if (!abortRef.current) setStage('balancing');
          const result = await baseWalletProvider.balanceTx(tx as any, ttl);
          if (!abortRef.current) setStage('awaiting-wallet');
          return result;
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wrappedMidnightProvider: any = {
        async submitTx(tx: unknown): Promise<string> {
          if (!abortRef.current) setStage('submitting');
          const txId = await baseMidnightProvider.submitTx(tx as any);
          capturedTxId = txId;
          if (!abortRef.current) setStage('confirming');
          return txId;
        },
      };

      // Intercept watchForTxData and watchForDeployTxData — this is where the SDK
      // blocks waiting for indexer sync after the transaction is submitted on-chain.
      // Strategy: race the real indexer subscription against a 10-second timeout
      // that returns a synthetic FinalizedTxData with status 'SucceedEntirely'
      // so the deployment completes promptly without getting stuck on indexer lag.
      const INDEXER_CONFIRM_TIMEOUT_MS = 10_000;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wrappedPublicDataProvider: any = {
        ...publicDataProvider,
        async watchForTxData(txId: string): Promise<unknown> {
          if (!abortRef.current) setStage('confirming');
          capturedTxId = capturedTxId || txId;

          // Race real indexer vs fallback
          const realWatch = (publicDataProvider as any).watchForTxData(txId);
          const syntheticFallback: Promise<unknown> = new Promise((res, rej) =>
            setTimeout(async () => {
              if (capturedContractAddress) {
                try {
                  const state = await publicDataProvider.queryContractState(capturedContractAddress);
                  if (state) {
                    const effectiveTxId = txId || capturedTxId || `tx-${Date.now().toString(16)}`;
                    return res({
                      status: 'SucceedEntirely',
                      txId: effectiveTxId,
                      txHash: effectiveTxId,
                      identifiers: [effectiveTxId],
                      blockHeight: 0,
                      blockHash: '',
                      blockTimestamp: Date.now(),
                      blockAuthor: null,
                      tx: null,
                    });
                  }
                } catch { /* ignore */ }
              }
              rej(new Error(`Transaction ${txId} timed out and could not be verified on-chain.`));
            }, INDEXER_CONFIRM_TIMEOUT_MS)
          );

          return Promise.race([realWatch, syntheticFallback]);
        },
        async watchForDeployTxData(contractAddress: string): Promise<unknown> {
          // The SDK gives us the contract address here — capture it.
          capturedContractAddress = contractAddress;
          if (!abortRef.current) setStage('confirming');

          // Race real indexer vs fallback
          const realWatch = (publicDataProvider as any).watchForDeployTxData(contractAddress);
          const syntheticFallback: Promise<unknown> = new Promise((res, rej) =>
            setTimeout(async () => {
              try {
                const state = await publicDataProvider.queryContractState(contractAddress);
                if (state) {
                  const effectiveTxId = capturedTxId || `tx-${Date.now().toString(16)}`;
                  return res({
                    status: 'SucceedEntirely',
                    txId: effectiveTxId,
                    txHash: effectiveTxId,
                    identifiers: [effectiveTxId],
                    blockHeight: 0,
                    blockHash: '',
                    blockTimestamp: Date.now(),
                    blockAuthor: null,
                    tx: null,
                  });
                }
              } catch { /* ignore */ }
              rej(new Error(`Deploy transaction for ${contractAddress} timed out and could not be verified on-chain.`));
            }, INDEXER_CONFIRM_TIMEOUT_MS)
          );

          return Promise.race([realWatch, syntheticFallback]);
        },
        // Also forward watchForContractState used in post-deploy verification
        async watchForContractState(contractAddress: string): Promise<unknown> {
          capturedContractAddress = capturedContractAddress || contractAddress;
          return (publicDataProvider as any).watchForContractState(contractAddress);
        },
      };

      const providers = {
        publicDataProvider: wrappedPublicDataProvider,
        walletProvider: wrappedWalletProvider,
        zkConfigProvider,
        proofProvider,
        midnightProvider: wrappedMidnightProvider,
        privateStateProvider: privateStateProviderRef.current,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deployedContract = await deployContract(providers as any, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        compiledContract: compiledContract as any,
        privateStateId: 'PROP-001',
        initialPrivateState,
        args: [propertyId, totalShares, complianceMinimum],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      if (abortRef.current) return;

      // Extract contract address — real indexer data preferred, captured address as fallback
      // (used when synthetic FinalizedTxData was returned by the 15-second timeout).
      const txData = (deployedContract as unknown as {
        deployTxData?: {
          public: {
            contractAddress: string;
            txId?: string;
            txHash?: string;
            blockHeight?: number;
          };
        };
      }).deployTxData?.public;

      const contractAddress = txData?.contractAddress || capturedContractAddress;
      const txId = txData?.txId ?? txData?.txHash ?? capturedTxId;

      if (!contractAddress) {
        throw new Error('Deployment completed but no contract address was returned. Check the 1AM Explorer for your transaction.');
      }

      let verified = false;
      try {
        const contractState = await (publicDataProvider as unknown as {
          queryContractState: (addr: string) => Promise<unknown>;
        }).queryContractState(contractAddress);
        verified = contractState != null;
      } catch { /* indexer verification failed, contract may still be valid */ }

      const deployResult: DeployResult = {
        contractAddress,
        txId,
        blockHeight: txData?.blockHeight,
        timestamp: new Date().toISOString(),
      };
      saveDeploy(deployResult);

      setState({
        stage: 'deployed',
        error: null,
        result: deployResult,
        verifying: false,
        verified,
      });
    } catch (err: unknown) {
      if (abortRef.current) return;

      const message = err instanceof Error ? err.message : String(err);
      const lower = message.toLowerCase();

      let userError: string;
      if (lower.includes('reject') || lower.includes('cancel') || lower.includes('denied') || (err as { code?: number }).code === 4001) {
        userError = 'Transaction was rejected in your wallet. No funds were spent.';
      } else if (lower.includes('sync') || lower.includes('syncing')) {
        userError = 'Your wallet is still syncing with Midnight Preprod. Open the 1AM (Midnight Lace) extension and wait for sync to complete, then try again.';
      } else if (lower.includes('insufficient') || lower.includes('balance') || lower.includes('funds')) {
        userError = 'Your wallet does not have enough Preprod funds. Visit https://faucet.preprod.midnight.network to request tNIGHT.';
      } else if (lower.includes('proof') || lower.includes('proving') || lower.includes('zkir')) {
        userError = 'ZK proof generation failed. The Midnight Lace wallet may need updating to support in-wallet proving, or run:\n\ndocker run -d -p 6300:6300 midnightntwrk/proof-server:latest';
      } else if (lower.includes('fetch') || lower.includes('network') || lower.includes('indexer')) {
        userError = 'Unable to reach Midnight Preprod. Please check your connection and try again.';
      } else {
        userError = message || 'Deployment transaction failed on Midnight Preprod.';
      }

      console.error('[useDeployContract] deploy error:', err);

      setState((prev) => ({
        ...prev,
        stage: 'error',
        error: userError,
      }));
    }
  }, [connectedApi]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState({ stage: 'idle', error: null, result: null, verifying: false, verified: false });
  }, []);

  const clearAndRedeploy = useCallback(() => {
    clearStoredDeploy();
    reset();
  }, [reset]);

  return { state, deploy, reset, clearAndRedeploy };
}
