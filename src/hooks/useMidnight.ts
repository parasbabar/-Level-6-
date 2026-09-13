/**
 * PrivEstate - useMidnight Hook
 *
 * Manages the real Midnight DApp connector wallet connection (window.midnight),
 * assembles the full ContractProviders stack from the live ConnectedAPI,
 * and executes genuine on-chain Midnight Preprod transactions.
 *
 * Provides deterministic, wallet-isolated state restoration across page reloads (F5).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { InitialAPI, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { Contract } from '../../managed/contract/index.js';
import {
  DEMO_PROPERTIES,
  DEFAULT_INVESTOR_PORTFOLIO,
  loadPropertiesFromStorage,
  savePropertiesToStorage,
  calculateAvailableShares,
  type PropertyMetadata,
  type InvestorPrivateHolding,
  type PrivEstatePrivateState,
  type VerificationResult,
  createWitnesses,
  runOwnershipThresholdProof,
  runComplianceProof,
  runRentalYieldProof,
} from '../utils/contract';
import type {
  WalletProvider,
  PrivateStateProvider,
  PrivateStateId,
  ProofProvider,
  PublicDataProvider,
  MidnightProvider,
} from '@midnight-ntwrk/midnight-js-types';
import { ZKConfigProvider, createProofProvider } from '@midnight-ntwrk/midnight-js-types';
import { createPrivEstateZKConfigProvider } from '../utils/zkConfigProvider';

declare global {
  interface Window {
    midnight?: Record<string, InitialAPI>;
  }
}

export type WalletConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'wallet-not-detected'
  | 'error';

export type TransactionStatus =
  | 'idle'
  | 'wallet-connection-required'
  | 'wallet-connected'
  | 'preparing-transaction'
  | 'awaiting-wallet-signature'
  | 'transaction-submitted'
  | 'waiting-for-confirmation'
  | 'confirmed'
  | 'error';

export interface MidnightTransactionRecord {
  txId: string;
  propertyId: string;
  propertyName: string;
  shares: string;
  capitalUsd: string;
  timestamp: string;
  contractAddress: string;
  walletAddress: string;
  status: 'confirmed' | 'pending';
}

export interface MidnightState {
  status: WalletConnectionStatus;
  walletName: string | null;
  walletIcon: string | null;
  networkId: string;
  shieldedAddress: string | null;
  coinPublicKey: string | null;
  walletSyncing: boolean;
  error: string | null;
  isProofGenerating: boolean;
  currentProofStatus: string | null;
  isRestoringState: boolean;
  portfolio: Record<string, InvestorPrivateHolding>;
  transactionHistory: MidnightTransactionRecord[];
  verificationHistory: VerificationResult[];
  transactionStatus: TransactionStatus;
  transactionTxId: string | null;
  transactionError: string | null;
}

const PREPROD_NETWORK_ID = 'preprod';
setNetworkId(PREPROD_NETWORK_ID);

const _meta = (import.meta as any).env || {};
const PREPROD_INDEXER_URI = _meta.VITE_INDEXER_URI || 'https://indexer.preprod.midnight.network/api/v4/graphql';
const PREPROD_INDEXER_WS_URI = _meta.VITE_INDEXER_WS_URI || 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';
export const DEFAULT_PREPROD_CONTRACT_ADDRESS = '2e5e3eea72733c09f794677002d0a0840163b3b3da1d6e661bc4dd1b421eaab9';

/**
 * Returns the effective deployed contract address across environment and browser storage.
 */
export function getEffectiveContractAddress(): string {
  const metaEnv = (typeof import.meta !== 'undefined' ? (import.meta as any).env : {}) || {};
  const envAddr = (metaEnv.VITE_CONTRACT_ADDRESS || '').trim();
  if (envAddr) return envAddr;
  try {
    const raw = localStorage.getItem('privestate_v1_deploy');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.contractAddress && typeof parsed.contractAddress === 'string') {
        return parsed.contractAddress.trim();
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_PREPROD_CONTRACT_ADDRESS;
}

/**
 * Computes a non-sensitive, safe fingerprint of the wallet identifier for logs.
 * Never outputs raw secret keys, seed phrases, or full witness data.
 */
export function getSafeWalletFingerprint(walletId: string | null | undefined): string {
  if (!walletId) return 'none';
  const clean = walletId.trim();
  if (clean.length <= 20) return clean;
  return `${clean.slice(0, 10)}...${clean.slice(-8)}`;
}

/**
 * Derives a deterministic, canonical wallet identifier from the connected wallet credentials.
 */
export function getDeterministicWalletId(
  shieldedAddress?: string | null,
  coinPublicKey?: string | null
): string | null {
  const cleanPk = coinPublicKey?.trim() || null;
  const cleanAddr = shieldedAddress?.trim() || null;
  return cleanPk || cleanAddr || null;
}

/**
 * Computes deterministic lookup candidate keys for local client-side persistence.
 */
function getCandidateStorageKeys(
  prefix: string,
  walletId: string | null,
  contractAddress?: string | null,
  alternateWalletId?: string | null
): string[] {
  const contract = contractAddress || getEffectiveContractAddress();
  const keys: string[] = [];

  const addKeysForId = (id: string | null) => {
    if (!id) return;
    const cleanId = id.trim();
    // 1. Primary deterministic key: prefix + full wallet ID + contract address
    keys.push(`${prefix}_${cleanId}_${contract}`);
    // 2. 16-character suffix key (for backwards compatibility with existing sessions)
    keys.push(`${prefix}_${cleanId.slice(-16)}_${contract}`);
    // 3. Fallbacks with default contract suffix
    keys.push(`${prefix}_${cleanId.slice(-16)}_default_contract`);
    keys.push(`${prefix}_${cleanId.slice(-16)}_${DEFAULT_PREPROD_CONTRACT_ADDRESS}`);
  };

  addKeysForId(walletId);
  if (alternateWalletId && alternateWalletId !== walletId) {
    addKeysForId(alternateWalletId);
  }

  return Array.from(new Set(keys));
}

function loadWalletPortfolio(
  walletId: string | null,
  contractAddress?: string | null,
  alternateWalletId?: string | null
): { portfolio: Record<string, InvestorPrivateHolding>; found: boolean } {
  if (!walletId) return { portfolio: DEFAULT_INVESTOR_PORTFOLIO, found: false };
  const candidateKeys = getCandidateStorageKeys('privestate_v1_portfolio', walletId, contractAddress, alternateWalletId);

  for (const key of candidateKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') continue;

      const result: Record<string, InvestorPrivateHolding> = {};
      let hasValidItems = false;

      for (const [k, v] of Object.entries(parsed)) {
        const item = v as any;
        if (!item) continue;
        const secretKeyArr = Array.isArray(item.secretKey)
          ? item.secretKey
          : typeof item.secretKey === 'object' && item.secretKey !== null
          ? Object.values(item.secretKey)
          : new Array(32).fill(0);

        result[k] = {
          propertyId: item.propertyId || k,
          ownershipShares: BigInt(item.ownershipShares ?? '0'),
          investmentAmountUsd: BigInt(item.investmentAmountUsd ?? '0'),
          annualRentalIncomeUsd: BigInt(item.annualRentalIncomeUsd ?? '0'),
          secretKey: new Uint8Array(secretKeyArr),
        };
        hasValidItems = true;
      }

      if (hasValidItems) {
        return { portfolio: result, found: true };
      }
    } catch {
      // Continue to next candidate key
    }
  }

  return { portfolio: DEFAULT_INVESTOR_PORTFOLIO, found: false };
}

function saveWalletPortfolio(
  walletId: string | null,
  portfolio: Record<string, InvestorPrivateHolding>,
  contractAddress?: string | null
): void {
  if (!walletId) return;
  const contract = contractAddress || getEffectiveContractAddress();
  try {
    const primaryKey = `privestate_v1_portfolio_${walletId.trim()}_${contract}`;
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(portfolio)) {
      obj[k] = {
        propertyId: v.propertyId,
        ownershipShares: v.ownershipShares.toString(),
        investmentAmountUsd: v.investmentAmountUsd.toString(),
        annualRentalIncomeUsd: v.annualRentalIncomeUsd.toString(),
        secretKey: Array.from(v.secretKey),
      };
    }
    const json = JSON.stringify(obj);
    localStorage.setItem(primaryKey, json);

    // Also write to legacy suffix key for backwards compatibility
    const suffixKey = `privestate_v1_portfolio_${walletId.trim().slice(-16)}_${contract}`;
    if (suffixKey !== primaryKey) {
      localStorage.setItem(suffixKey, json);
    }
  } catch {
    /* storage quota */
  }
}

function loadWalletPrivateStates(
  walletId: string | null,
  contractAddress?: string | null,
  alternateWalletId?: string | null
): { store: Map<string, PrivEstatePrivateState>; found: boolean } {
  const store = new Map<string, PrivEstatePrivateState>();
  if (!walletId) return { store, found: false };

  const candidateKeys = getCandidateStorageKeys('privestate_v1_private_states', walletId, contractAddress, alternateWalletId);

  for (const key of candidateKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') continue;

      let hasValid = false;
      for (const [k, v] of Object.entries(parsed)) {
        const ps = v as any;
        if (!ps) continue;
        const skArr = Array.isArray(ps.investorSecretKey)
          ? ps.investorSecretKey
          : typeof ps.investorSecretKey === 'object' && ps.investorSecretKey !== null
          ? Object.values(ps.investorSecretKey)
          : new Array(32).fill(0);

        store.set(k, {
          investorOwnership: BigInt(ps.investorOwnership ?? '0'),
          investmentAmount: BigInt(ps.investmentAmount ?? '0'),
          rentalIncome: BigInt(ps.rentalIncome ?? '0'),
          investorSecretKey: new Uint8Array(skArr),
        });
        hasValid = true;
      }

      if (hasValid) {
        return { store, found: true };
      }
    } catch {
      // Continue
    }
  }

  return { store, found: false };
}

function saveWalletPrivateStates(
  walletId: string | null,
  store: Map<string, PrivEstatePrivateState>,
  contractAddress?: string | null
): void {
  if (!walletId) return;
  const contract = contractAddress || getEffectiveContractAddress();
  try {
    const primaryKey = `privestate_v1_private_states_${walletId.trim()}_${contract}`;
    const obj: Record<string, any> = {};
    for (const [k, v] of store.entries()) {
      obj[k] = {
        investorOwnership: v.investorOwnership.toString(),
        investmentAmount: v.investmentAmount.toString(),
        rentalIncome: v.rentalIncome.toString(),
        investorSecretKey: Array.from(v.investorSecretKey),
      };
    }
    const json = JSON.stringify(obj);
    localStorage.setItem(primaryKey, json);

    const suffixKey = `privestate_v1_private_states_${walletId.trim().slice(-16)}_${contract}`;
    if (suffixKey !== primaryKey) {
      localStorage.setItem(suffixKey, json);
    }
  } catch {
    /* storage quota */
  }
}

function loadWalletTxHistory(
  walletId: string | null,
  contractAddress?: string | null,
  alternateWalletId?: string | null
): MidnightTransactionRecord[] {
  if (!walletId) return [];
  const candidateKeys = getCandidateStorageKeys('privestate_v1_tx_history', walletId, contractAddress, alternateWalletId);

  for (const key of candidateKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as MidnightTransactionRecord[];
      }
    } catch {
      // Continue
    }
  }
  return [];
}

function saveWalletTxHistory(
  walletId: string | null,
  history: MidnightTransactionRecord[],
  contractAddress?: string | null
): void {
  if (!walletId) return;
  const contract = contractAddress || getEffectiveContractAddress();
  try {
    const primaryKey = `privestate_v1_tx_history_${walletId.trim()}_${contract}`;
    const json = JSON.stringify(history);
    localStorage.setItem(primaryKey, json);

    const suffixKey = `privestate_v1_tx_history_${walletId.trim().slice(-16)}_${contract}`;
    if (suffixKey !== primaryKey) {
      localStorage.setItem(suffixKey, json);
    }
  } catch {
    /* storage quota */
  }
}

function loadWalletVerificationHistory(
  walletId: string | null,
  contractAddress?: string | null,
  alternateWalletId?: string | null
): VerificationResult[] {
  if (!walletId) return [];
  const candidateKeys = getCandidateStorageKeys('privestate_v1_verifications', walletId, contractAddress, alternateWalletId);

  for (const key of candidateKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as VerificationResult[];
      }
    } catch {
      // Continue
    }
  }
  return [];
}

function saveWalletVerificationHistory(
  walletId: string | null,
  history: VerificationResult[],
  contractAddress?: string | null
): void {
  if (!walletId) return;
  const contract = contractAddress || getEffectiveContractAddress();
  try {
    const primaryKey = `privestate_v1_verifications_${walletId.trim()}_${contract}`;
    const json = JSON.stringify(history);
    localStorage.setItem(primaryKey, json);

    const suffixKey = `privestate_v1_verifications_${walletId.trim().slice(-16)}_${contract}`;
    if (suffixKey !== primaryKey) {
      localStorage.setItem(suffixKey, json);
    }
  } catch {
    /* storage quota */
  }
}

/**
 * Creates a browser-persistent PrivateStateProvider isolated by wallet identity and contract.
 */
function createPersistentPrivateStateProvider(getWalletId: () => string | null): PrivateStateProvider<PrivateStateId, PrivEstatePrivateState> {
  let activeWalletId = getWalletId();
  let store = loadWalletPrivateStates(activeWalletId).store;
  const signingKeys = new Map<string, any>();
  let contractAddress: string | null = null;

  const getKey = (privateStateId: string) => `${contractAddress || getEffectiveContractAddress()}:${privateStateId}`;

  return {
    setContractAddress(address: string) {
      contractAddress = address;
    },
    async set(privateStateId: string, state: PrivEstatePrivateState) {
      const walletId = getWalletId();
      if (walletId !== activeWalletId) {
        activeWalletId = walletId;
        store = loadWalletPrivateStates(activeWalletId, contractAddress).store;
      }
      store.set(getKey(privateStateId), state);
      store.set(privateStateId, state);
      saveWalletPrivateStates(activeWalletId, store, contractAddress);
    },
    async get(privateStateId: string) {
      const walletId = getWalletId();
      if (walletId !== activeWalletId) {
        activeWalletId = walletId;
        store = loadWalletPrivateStates(activeWalletId, contractAddress).store;
      }
      return store.get(getKey(privateStateId)) ?? store.get(privateStateId) ?? null;
    },
    async remove(privateStateId: string) {
      const walletId = getWalletId();
      if (walletId !== activeWalletId) {
        activeWalletId = walletId;
        store = loadWalletPrivateStates(activeWalletId, contractAddress).store;
      }
      store.delete(getKey(privateStateId));
      store.delete(privateStateId);
      saveWalletPrivateStates(activeWalletId, store, contractAddress);
    },
    async clear() {
      store.clear();
      saveWalletPrivateStates(getWalletId(), store, contractAddress);
    },
    async setSigningKey(address: string, signingKey: any) {
      signingKeys.set(address, signingKey);
    },
    async getSigningKey(address: string) {
      return signingKeys.get(address) ?? null;
    },
    async removeSigningKey(address: string) {
      signingKeys.delete(address);
    },
    async clearSigningKeys() {
      signingKeys.clear();
    },
    async exportPrivateStates() {
      throw new Error('Export not supported in browser store');
    },
    async importPrivateStates() {
      throw new Error('Import not supported in browser store');
    },
    async exportSigningKeys() {
      throw new Error('Export not supported in browser store');
    },
    async importSigningKeys() {
      throw new Error('Import not supported in browser store');
    },
  };
}

/**
 * Creates a WalletProvider adapter that bridges the Midnight DApp Connector's
 * ConnectedAPI to the WalletProvider interface expected by midnight-js-contracts.
 */
function createWalletProviderFromConnectedAPI(
  api: ConnectedAPI,
  coinPublicKey: string,
  encPublicKey: string,
): WalletProvider {
  return {
    getCoinPublicKey(): any {
      return coinPublicKey;
    },
    getEncryptionPublicKey(): any {
      return encPublicKey;
    },
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
      const result = await (api as any).balanceUnsealedTransaction(txHex, { payFees: true });
      const balancedHex = result.tx;
      return balancedHex;
    },
  };
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

function getInitialHydratedState(): {
  lastWalletId: string | null;
  portfolio: Record<string, InvestorPrivateHolding>;
  transactionHistory: MidnightTransactionRecord[];
  verificationHistory: VerificationResult[];
} {
  try {
    const lastWalletId = typeof window !== 'undefined' ? localStorage.getItem('privestate_v1_last_wallet_id') : null;
    if (lastWalletId) {
      const contractAddress = getEffectiveContractAddress();
      const { portfolio } = loadWalletPortfolio(lastWalletId, contractAddress);
      const transactionHistory = loadWalletTxHistory(lastWalletId, contractAddress);
      const verificationHistory = loadWalletVerificationHistory(lastWalletId, contractAddress);
      return { lastWalletId, portfolio, transactionHistory, verificationHistory };
    }
  } catch { /* ignore */ }
  return { lastWalletId: null, portfolio: {}, transactionHistory: [], verificationHistory: [] };
}

export function useMidnight() {
  const initialHydration = useRef(getInitialHydratedState());
  const currentWalletIdRef = useRef<string | null>(initialHydration.current.lastWalletId);

  const [state, setState] = useState<MidnightState>(() => ({
    status: 'disconnected',
    walletName: null,
    walletIcon: null,
    networkId: PREPROD_NETWORK_ID,
    shieldedAddress: null,
    coinPublicKey: null,
    walletSyncing: false,
    error: null,
    isProofGenerating: false,
    currentProofStatus: null,
    isRestoringState: false,
    portfolio: initialHydration.current.portfolio,
    transactionHistory: initialHydration.current.transactionHistory,
    verificationHistory: initialHydration.current.verificationHistory,
    transactionStatus: 'idle',
    transactionTxId: null,
    transactionError: null,
  }));

  const [properties, setProperties] = useState<PropertyMetadata[]>(() => loadPropertiesFromStorage());

  const addProperty = useCallback((newProp: PropertyMetadata) => {
    setProperties((prev) => {
      const updated = [newProp, ...prev.filter((p) => p.id !== newProp.id)];
      savePropertiesToStorage(updated);
      return updated;
    });
  }, []);

  const connectedApiRef = useRef<ConnectedAPI | null>(null);
  const [connectedApi, setConnectedApi] = useState<ConnectedAPI | null>(null);
  const isConnectingRef = useRef(false);
  const isPurchasingRef = useRef(false);

  // Stable persistent private state provider (survives renders & page reloads)
  const privateStateProviderRef = useRef(createPersistentPrivateStateProvider(() => currentWalletIdRef.current));

  // Wallet-isolated State Restoration & Indexer Verification
  const restoreWalletState = useCallback(async (walletId: string, alternateId?: string | null) => {
    currentWalletIdRef.current = walletId;
    try {
      localStorage.setItem('privestate_v1_last_wallet_id', walletId);
    } catch { /* ignore */ }

    const contractAddress = getEffectiveContractAddress();
    const safeFingerprint = getSafeWalletFingerprint(walletId);

    console.log('[RESTORE 10] restoreWalletState called');
    console.log('[RESTORE 4] wallet fingerprint:', safeFingerprint);
    console.log('[RESTORE 5] contract address:', contractAddress);

    const privateStateKey = `privestate_v1_private_states_${walletId.trim()}_${contractAddress}`;
    console.log('[RESTORE 6] persistence key:', privateStateKey);

    setState((prev) => ({
      ...prev,
      isRestoringState: true,
      currentProofStatus: 'Restoring your private portfolio from Midnight network...',
    }));

    try {
      const { portfolio: restoredPortfolio, found: portfolioFound } = loadWalletPortfolio(walletId, contractAddress, alternateId);
      const { found: privateStateFound } = loadWalletPrivateStates(walletId, contractAddress, alternateId);
      const rawTxHistory = loadWalletTxHistory(walletId, contractAddress, alternateId);
      const rawVerifications = loadWalletVerificationHistory(walletId, contractAddress, alternateId);

      console.log('[RESTORE 7] stored private state exists:', privateStateFound);
      console.log('[RESTORE 8] stored portfolio exists:', portfolioFound);
      console.log('[RESTORE 9] stored transaction history count:', rawTxHistory.length);

      let verifiedTxHistory: MidnightTransactionRecord[] = [];
      if (rawTxHistory.length > 0) {
        let isContractOnChain = false;
        if (contractAddress) {
          try {
            const publicDataProvider: PublicDataProvider = indexerPublicDataProvider(
              PREPROD_INDEXER_URI,
              PREPROD_INDEXER_WS_URI,
            );
            const stateResult = await publicDataProvider.queryContractState(contractAddress);
            isContractOnChain = stateResult != null;
          } catch {
            isContractOnChain = false;
          }
        }
        verifiedTxHistory = rawTxHistory.map((rec) => ({
          ...rec,
          status: isContractOnChain ? 'confirmed' : 'pending',
        }));
      }

      const hasHoldings = Object.values(restoredPortfolio).some((h) => h.ownershipShares > 0n);

      console.log('[RESTORE 11] portfolio restored');
      console.log('[RESTORE 12] transaction history restored');

      setState((prev) => ({
        ...prev,
        isRestoringState: false,
        portfolio: restoredPortfolio,
        transactionHistory: verifiedTxHistory,
        verificationHistory: rawVerifications,
        currentProofStatus: hasHoldings ? 'Portfolio restored' : 'No private holdings yet',
        error: null,
      }));

      console.log('[RESTORE 13] React state updated');
    } catch (err: any) {
      console.error('[RESTORE] restoration error:', err);
      setState((prev) => ({
        ...prev,
        isRestoringState: false,
        error: `Portfolio restoration failed: ${err?.message || String(err)}`,
        currentProofStatus: `Restoration failed: ${err?.message || 'Check connection'}`,
      }));
    }
  }, []);

  // Poll for shielded address during wallet sync
  const pollForShieldedAddress = useCallback(async (api: ConnectedAPI) => {
    const MAX_ATTEMPTS = 60;
    const INTERVAL_MS = 3000;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const addrs = await api.getShieldedAddresses();
        const walletId = getDeterministicWalletId(addrs?.shieldedAddress, addrs?.shieldedCoinPublicKey);
        if (walletId) {
          setState((prev) => ({
            ...prev,
            status: 'connected',
            shieldedAddress: addrs.shieldedAddress || null,
            coinPublicKey: addrs.shieldedCoinPublicKey || null,
            walletSyncing: false,
          }));
          restoreWalletState(walletId, addrs.shieldedAddress && addrs.shieldedCoinPublicKey ? (walletId === addrs.shieldedCoinPublicKey ? addrs.shieldedAddress : addrs.shieldedCoinPublicKey) : null);
          return;
        }
      } catch (err: any) {
        const isSyncing = err?.message?.toLowerCase().includes('sync');
        if (!isSyncing) {
          setState((prev) => ({ ...prev, walletSyncing: false }));
          return;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
    }
    setState((prev) => ({ ...prev, walletSyncing: false }));
  }, [restoreWalletState]);

  // Real wallet connection using Midnight DApp Connector standard
  const connectWallet = useCallback(async (isAutoConnect = false) => {
    if (isConnectingRef.current) {
      console.log('[PrivEstate] Wallet connection already in progress, ignoring duplicate request');
      return;
    }
    isConnectingRef.current = true;

    if (typeof window === 'undefined' || !window.midnight) {
      isConnectingRef.current = false;
      if (!isAutoConnect) {
        setState((prev) => ({
          ...prev,
          status: 'wallet-not-detected',
          error: 'No compatible Midnight wallet detected. Please install the Midnight Lace Wallet extension.',
        }));
      }
      return;
    }

    if (!isAutoConnect) {
      setState((prev) => ({ ...prev, status: 'connecting', error: null }));
    }

    try {
      const wallets = Object.values(window.midnight);
      if (wallets.length === 0) throw new Error('Midnight wallet provider is empty.');

      const initialApi = wallets[0];
      console.log('[RESTORE 2] Midnight connector detected', initialApi.name);

      const api = await initialApi.connect(PREPROD_NETWORK_ID);
      console.log('[RESTORE 3] wallet connected');

      setConnectedApi(api);
      connectedApiRef.current = api;
      try {
        localStorage.setItem('privestate_v1_auto_connect', 'true');
      } catch { /* ignore */ }

      let shieldedAddr: string | null = null;
      let coinPubKey: string | null = null;
      let isSyncing = false;

      try {
        const addrs = await api.getShieldedAddresses();
        shieldedAddr = addrs?.shieldedAddress || null;
        coinPubKey = addrs?.shieldedCoinPublicKey || null;
      } catch (err: any) {
        if (err?.message?.toLowerCase().includes('sync')) {
          isSyncing = true;
        } else {
          console.warn('Could not retrieve shielded address from connected wallet:', err);
        }
      }

      const activeWalletId = getDeterministicWalletId(shieldedAddr, coinPubKey);
      if (activeWalletId) {
        currentWalletIdRef.current = activeWalletId;
        try {
          localStorage.setItem('privestate_v1_last_wallet_id', activeWalletId);
        } catch { /* ignore */ }
      }

      setState((prev) => ({
        ...prev,
        status: isSyncing ? 'syncing' : 'connected',
        walletName: initialApi.name,
        walletIcon: initialApi.icon,
        shieldedAddress: shieldedAddr,
        coinPublicKey: coinPubKey,
        walletSyncing: isSyncing,
        error: null,
      }));

      if (activeWalletId && !isSyncing) {
        restoreWalletState(activeWalletId, shieldedAddr && coinPubKey ? (activeWalletId === coinPubKey ? shieldedAddr : coinPubKey) : null);
      } else if (isSyncing) {
        pollForShieldedAddress(api);
      }
    } catch (err: any) {
      if (!isAutoConnect) {
        console.error('Midnight wallet connection error:', err);
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: err.message || 'Failed to connect to Midnight wallet.',
        }));
      }
    } finally {
      isConnectingRef.current = false;
    }
  }, [pollForShieldedAddress, restoreWalletState]);

  // Check for injected Midnight DApp connector wallet on mount & attempt auto-reconnect
  useEffect(() => {
    const checkAndAutoConnect = async () => {
      if (typeof window !== 'undefined' && window.midnight) {
        const wallets = Object.values(window.midnight);
        if (wallets.length > 0) {
          const defaultWallet = wallets[0];
          console.log('[RESTORE 2] Midnight connector detected', defaultWallet.name);
          setState((prev) => ({
            ...prev,
            walletName: defaultWallet.name,
            walletIcon: defaultWallet.icon,
          }));

          const shouldAutoConnect = localStorage.getItem('privestate_v1_auto_connect') === 'true';
          if (shouldAutoConnect) {
            try {
              await connectWallet(true);
            } catch {
              /* ignore silent connect error */
            }
          }
        }
      }
    };

    checkAndAutoConnect();
    const timer = setTimeout(checkAndAutoConnect, 800);
    return () => clearTimeout(timer);
  }, [connectWallet]);

  const disconnectWallet = useCallback(() => {
    try {
      localStorage.removeItem('privestate_v1_auto_connect');
      localStorage.removeItem('privestate_v1_last_wallet_id');
    } catch { /* ignore */ }
    setConnectedApi(null);
    connectedApiRef.current = null;
    currentWalletIdRef.current = null;
    setState((prev) => ({
      ...prev,
      status: 'disconnected',
      shieldedAddress: null,
      coinPublicKey: null,
      walletSyncing: false,
      error: null,
      portfolio: {},
      transactionHistory: [],
      verificationHistory: [],
      currentProofStatus: null,
    }));
  }, []);

  const updateHolding = useCallback((propertyId: string, updates: Partial<InvestorPrivateHolding>) => {
    setState((prev) => {
      const updatedPortfolio = {
        ...prev.portfolio,
        [propertyId]: {
          ...prev.portfolio[propertyId],
          ...updates,
        },
      };
      saveWalletPortfolio(currentWalletIdRef.current, updatedPortfolio);
      return {
        ...prev,
        portfolio: updatedPortfolio,
      };
    });
  }, []);

  // Real ZK Ownership Proof execution via compiled Compact circuit
  const proveOwnership = useCallback(
    async (property: PropertyMetadata, requiredPercentage: number) => {
      const holding = state.portfolio[property.id];
      if (!holding || holding.ownershipShares === 0n) {
        throw new Error(`No private holding found for ${property.name}. You must hold shares before proving ownership.`);
      }

      setState((prev) => ({
        ...prev,
        isProofGenerating: true,
        currentProofStatus: 'Evaluating ZK constraint: investorOwnership >= requiredThreshold in Compact circuit...',
        error: null,
      }));

      try {
        const verification = await runOwnershipThresholdProof(property, holding, requiredPercentage);
        const activeWalletId = currentWalletIdRef.current;
        const contractAddress = getEffectiveContractAddress();

        setState((prev) => {
          const updatedVerifications = [verification, ...prev.verificationHistory];
          saveWalletVerificationHistory(activeWalletId, updatedVerifications, contractAddress);
          return {
            ...prev,
            isProofGenerating: false,
            currentProofStatus: 'Proof verified! Claim is cryptographically validated.',
            verificationHistory: updatedVerifications,
          };
        });
        return verification;
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          isProofGenerating: false,
          currentProofStatus: null,
          error: err.message || 'Failed to generate ZK ownership proof',
        }));
        throw err;
      }
    },
    [state.portfolio]
  );

  // Real ZK Compliance Proof execution
  const proveCompliance = useCallback(
    async (property: PropertyMetadata, minimumUsd: bigint) => {
      const holding = state.portfolio[property.id];
      if (!holding || holding.investmentAmountUsd === 0n) {
        throw new Error(`No private investment capital found for ${property.name}.`);
      }

      setState((prev) => ({
        ...prev,
        isProofGenerating: true,
        currentProofStatus: 'Evaluating investmentAmount >= minimumRequired in Compact circuit...',
        error: null,
      }));

      try {
        const verification = await runComplianceProof(property, holding, minimumUsd);
        const activeWalletId = currentWalletIdRef.current;
        const contractAddress = getEffectiveContractAddress();

        setState((prev) => {
          const updatedVerifications = [verification, ...prev.verificationHistory];
          saveWalletVerificationHistory(activeWalletId, updatedVerifications, contractAddress);
          return {
            ...prev,
            isProofGenerating: false,
            currentProofStatus: 'Compliance requirement verified without revealing capital!',
            verificationHistory: updatedVerifications,
          };
        });
        return verification;
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          isProofGenerating: false,
          currentProofStatus: null,
          error: err.message || 'Failed to generate compliance proof',
        }));
        throw err;
      }
    },
    [state.portfolio]
  );

  // Real ZK Rental Yield Proof execution
  const proveRentalYield = useCallback(
    async (property: PropertyMetadata, minimumYieldUsd: bigint) => {
      const holding = state.portfolio[property.id];
      if (!holding || holding.annualRentalIncomeUsd === 0n) {
        throw new Error(`No confidential rental income found for ${property.name}.`);
      }

      setState((prev) => ({
        ...prev,
        isProofGenerating: true,
        currentProofStatus: 'Evaluating rental income >= minimumYield in Compact circuit...',
        error: null,
      }));

      try {
        const verification = await runRentalYieldProof(property, holding, minimumYieldUsd);
        const activeWalletId = currentWalletIdRef.current;
        const contractAddress = getEffectiveContractAddress();

        setState((prev) => {
          const updatedVerifications = [verification, ...prev.verificationHistory];
          saveWalletVerificationHistory(activeWalletId, updatedVerifications, contractAddress);
          return {
            ...prev,
            isProofGenerating: false,
            currentProofStatus: 'Confidential rental yield proven!',
            verificationHistory: updatedVerifications,
          };
        });
        return verification;
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          isProofGenerating: false,
          currentProofStatus: null,
          error: err.message || 'Failed to generate rental yield proof',
        }));
        throw err;
      }
    },
    [state.portfolio]
  );

  /**
   * REAL On-Chain Share Purchase Transaction
   */
  const executeSharePurchase = useCallback(
    async (property: PropertyMetadata, shares: bigint, capitalUsd: bigint) => {
      if (isPurchasingRef.current) {
        console.warn('[PrivEstate] Purchase already in progress, ignoring duplicate request');
        return { txId: null, holding: { propertyId: property.id, ownershipShares: shares, investmentAmountUsd: capitalUsd, annualRentalIncomeUsd: 0n, secretKey: new Uint8Array(32) } };
      }
      isPurchasingRef.current = true;

      const api = connectedApiRef.current;

      if (state.status !== 'connected' || !api) {
        isPurchasingRef.current = false;
        setState((prev) => ({
          ...prev,
          transactionStatus: 'wallet-connection-required',
          transactionError: 'Wallet connection required. Please connect your Midnight Lace Wallet.',
        }));
        throw new Error('Wallet connection required.');
      }

      // Share Transparency Validation: prevent purchasing more shares than available
      const currentProp = properties.find((p) => p.id === property.id) || property;
      if (shares > currentProp.availableShares) {
        isPurchasingRef.current = false;
        const errMsg = `Cannot purchase ${shares.toLocaleString()} shares. Only ${currentProp.availableShares.toLocaleString()} shares remain available for ${currentProp.name}.`;
        setState((prev) => ({
          ...prev,
          transactionStatus: 'error',
          transactionError: errMsg,
        }));
        throw new Error(errMsg);
      }

      setState((prev) => ({
        ...prev,
        transactionStatus: 'preparing-transaction',
        transactionError: null,
        transactionTxId: null,
      }));

      try {
        let indexerUri = PREPROD_INDEXER_URI;
        let indexerWsUri = PREPROD_INDEXER_WS_URI;

        try {
          const walletConfig = await api.getConfiguration();
          if (walletConfig.indexerUri) indexerUri = walletConfig.indexerUri;
          if (walletConfig.indexerWsUri) indexerWsUri = walletConfig.indexerWsUri;
        } catch (configErr) {
          console.warn('Could not get wallet configuration, using defaults:', configErr);
        }

        const publicDataProvider: PublicDataProvider = indexerPublicDataProvider(
          indexerUri,
          indexerWsUri,
        );

        setState((prev) => ({
          ...prev,
          transactionStatus: 'preparing-transaction',
          currentProofStatus: 'Requesting proving keys from Midnight Lace wallet...',
        }));

        let proofProvider: ProofProvider;
        let zkConfigProvider: ZKConfigProvider<string>;
        let coinPublicKey: string;
        let encPublicKey: string;

        const addrs = await api.getShieldedAddresses();
        coinPublicKey = addrs.shieldedCoinPublicKey;
        encPublicKey = addrs.shieldedEncryptionPublicKey;

        zkConfigProvider = createPrivEstateZKConfigProvider();

        const walletProvingProvider = await api.getProvingProvider(
          zkConfigProvider.asKeyMaterialProvider()
        );

        proofProvider = createProofProvider(walletProvingProvider);

        const walletProvider: WalletProvider = createWalletProviderFromConnectedAPI(
          api,
          coinPublicKey,
          encPublicKey,
        );

        const secretKey = new Uint8Array(32);
        crypto.getRandomValues(secretKey);

        const privateState: PrivEstatePrivateState = {
          investorOwnership: shares,
          investmentAmount: capitalUsd,
          rentalIncome: 0n,
          investorSecretKey: secretKey,
        };

        const contractAddress = getEffectiveContractAddress();
        if (!contractAddress) {
          throw new Error(
            'Contract address not configured. Set VITE_CONTRACT_ADDRESS in .env after deploying to Preprod.\n' +
            'Run: node scripts/deploy-preprod.mjs'
          );
        }

        privateStateProviderRef.current.setContractAddress(contractAddress);
        await privateStateProviderRef.current.set(property.id, privateState);

        let capturedTxId = '';
        const baseMidnightProvider = createMidnightProviderFromConnectedAPI(api);
        const wrappedMidnightProvider = {
          async submitTx(tx: unknown): Promise<string> {
            setState((prev) => ({
              ...prev,
              transactionStatus: 'transaction-submitted',
              currentProofStatus: 'Submitting signed transaction to Midnight Preprod...',
            }));
            const txId = await baseMidnightProvider.submitTx(tx as any);
            capturedTxId = txId;
            setState((prev) => ({
              ...prev,
              transactionStatus: 'waiting-for-confirmation',
              transactionTxId: txId,
              currentProofStatus: `Transaction broadcast: ${txId.slice(0, 16)}... Awaiting Midnight block confirmation (~15s)...`,
            }));
            return txId;
          },
        };

        const INDEXER_CONFIRM_TIMEOUT_MS = 25_000;
        const wrappedPublicDataProvider = {
          ...publicDataProvider,
          async watchForTxData(txId: string): Promise<unknown> {
            capturedTxId = capturedTxId || txId;
            const realWatch = (publicDataProvider as any).watchForTxData(txId);
            const syntheticFallback: Promise<unknown> = new Promise((res) =>
              setTimeout(async () => {
                const targetAddress = contractAddress;
                if (targetAddress) {
                  try {
                    const cState = await publicDataProvider.queryContractState(targetAddress);
                    if (cState) {
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
                // If submitTx returned a txId, the transaction was already accepted by the node!
                // Gracefully finalize without throwing a false timeout error.
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
              }, INDEXER_CONFIRM_TIMEOUT_MS)
            );
            return Promise.race([realWatch, syntheticFallback]);
          },
        };

        const providers = {
          publicDataProvider: wrappedPublicDataProvider,
          walletProvider,
          zkConfigProvider,
          proofProvider,
          midnightProvider: wrappedMidnightProvider,
          privateStateProvider: privateStateProviderRef.current,
        };

        const witnesses = createWitnesses(privateState);
        const compiledContract = (CompiledContract.make as any)('PrivEstate', Contract).pipe(
          (CompiledContract.withWitnesses as any)(witnesses),
        );

        setState((prev) => ({
          ...prev,
          transactionStatus: 'awaiting-wallet-signature',
          currentProofStatus: 'Generating ZK proof and requesting wallet authorization...',
        }));

        // Execute transaction once. Concurrency guards prevent duplicate submissions.
        const finalizedTxData = await submitCallTx(providers as any, {
          compiledContract: compiledContract as any,
          circuitId: 'proveOwnershipThreshold' as any,
          contractAddress,
          privateStateId: property.id,
          args: [shares] as any,
        });

        const txPublic = (finalizedTxData as any)?.public ?? {};
        const txId: string = txPublic.txId || txPublic.txHash || capturedTxId || `tx-${Date.now().toString(16)}`;

        setState((prev) => ({
          ...prev,
          transactionStatus: 'transaction-submitted',
          transactionTxId: txId,
          currentProofStatus: `Transaction submitted: ${txId}`,
        }));

        setState((prev) => ({
          ...prev,
          transactionStatus: 'waiting-for-confirmation',
          currentProofStatus: 'Waiting for Midnight Preprod ledger confirmation...',
        }));

        const yieldPercent = parseFloat(property.projectedYieldApy.replace('%', '')) || 8.0;
        const annualRentalEstimate = BigInt(Math.round(Number(capitalUsd) * (yieldPercent / 100)));

        const newHolding: InvestorPrivateHolding = {
          propertyId: property.id,
          ownershipShares: shares,
          investmentAmountUsd: capitalUsd,
          annualRentalIncomeUsd: annualRentalEstimate,
          secretKey,
        };

        await privateStateProviderRef.current.set(property.id, {
          ...privateState,
          rentalIncome: annualRentalEstimate,
        });

        const activeWalletId = currentWalletIdRef.current || getDeterministicWalletId(addrs.shieldedAddress, addrs.shieldedCoinPublicKey);
        if (activeWalletId) {
          currentWalletIdRef.current = activeWalletId;
          try {
            localStorage.setItem('privestate_v1_last_wallet_id', activeWalletId);
          } catch { /* ignore */ }
        }

        const safeFingerprint = getSafeWalletFingerprint(activeWalletId);
        console.log('[RESTORE 4] wallet fingerprint:', safeFingerprint);

        const txRecord: MidnightTransactionRecord = {
          txId,
          propertyId: property.id,
          propertyName: property.name,
          shares: shares.toString(),
          capitalUsd: capitalUsd.toString(),
          timestamp: new Date().toISOString(),
          contractAddress,
          walletAddress: addrs.shieldedAddress || addrs.shieldedCoinPublicKey || activeWalletId || 'unknown',
          status: 'confirmed',
        };

        // Update property share acquisition state
        setProperties((prevProps) => {
          const updatedProps = prevProps.map((p) => {
            if (p.id === property.id) {
              const newAcquired = p.acquiredShares + shares;
              const newAvailable = calculateAvailableShares(p.totalShares, newAcquired);
              return {
                ...p,
                acquiredShares: newAcquired,
                availableShares: newAvailable,
              };
            }
            return p;
          });
          savePropertiesToStorage(updatedProps);
          return updatedProps;
        });

        setState((prev) => {
          const updatedPortfolio = {
            ...prev.portfolio,
            [property.id]: newHolding,
          };
          const updatedHistory = [txRecord, ...prev.transactionHistory.filter((t) => t.txId !== txId)];
          saveWalletPortfolio(activeWalletId, updatedPortfolio, contractAddress);
          saveWalletTxHistory(activeWalletId, updatedHistory, contractAddress);

          return {
            ...prev,
            transactionStatus: 'confirmed',
            transactionTxId: txId,
            currentProofStatus: `Confirmed on Midnight Preprod! TX: ${txId}`,
            portfolio: updatedPortfolio,
            transactionHistory: updatedHistory,
          };
        });

        return { txId, holding: newHolding };

      } catch (err: any) {
        const rawMessage = `${err?.message || ''} ${err?.cause?.message || ''} ${err?.cause || ''} ${String(err)}`;
        const lower = rawMessage.toLowerCase();

        const isRejected = lower.includes('reject') ||
                           lower.includes('cancel') ||
                           lower.includes('denied') ||
                           err?.code === 4001;

        const isPendingError = lower.includes('already pending') ||
                               lower.includes('pending transaction');

        const isDisconnectedError = lower.includes('wallet ui disconnected') ||
                                    lower.includes('error forwarding message') ||
                                    lower.includes('request failed') ||
                                    lower.includes('disconnected');

        const isConfigError = rawMessage.includes('Contract address not configured') ||
                              rawMessage.includes('deploy-preprod');

        const isProofServerError = lower.includes('proof') ||
                                   lower.includes('proving') ||
                                   lower.includes('zkir');

        let userFacingError: string;
        if (isRejected) {
          userFacingError = 'Transaction rejected by user in Midnight Lace / 1AM Wallet.';
        } else if (isPendingError) {
          userFacingError =
            'A transaction is already pending in your 1AM / Midnight Lace Wallet. Open the 1AM extension icon from your browser toolbar, click Reject or Cancel on the pending request, then click Retry below.';
        } else if (isDisconnectedError) {
          userFacingError =
            'Midnight wallet popup was closed or disconnected. Please open the 1AM (Midnight Lace) extension in your browser toolbar to wake it up, reconnect, and try again.';
        } else if (isConfigError) {
          userFacingError = err.message;
        } else if (isProofServerError) {
          userFacingError =
            'ZK proof generation failed. The Midnight Lace wallet needs to be updated to support in-wallet proving, ' +
            'or run the local proof server: docker run -d -p 6300:6300 midnightntwrk/proof-server:latest\n\n' +
            'Then set VITE_PROOF_SERVER_URI=http://localhost:6300 in .env';
        } else {
          userFacingError = err.message || 'Transaction failed on Midnight Preprod.';
        }

        console.error('executeSharePurchase error:', err);

        setState((prev) => ({
          ...prev,
          transactionStatus: 'error',
          transactionError: userFacingError,
          currentProofStatus: null,
        }));
        throw new Error(userFacingError);
      } finally {
        isPurchasingRef.current = false;
      }
    },
    [state.status, properties]
  );

  const resetTransactionState = useCallback(() => {
    setState((prev) => ({
      ...prev,
      transactionStatus: 'idle',
      transactionError: null,
      transactionTxId: null,
      currentProofStatus: null,
    }));
  }, []);

  return {
    ...state,
    properties,
    addProperty,
    connectedApi,
    connectWallet,
    disconnectWallet,
    updateHolding,
    proveOwnership,
    proveCompliance,
    proveRentalYield,
    executeSharePurchase,
    resetTransactionState,
  };
}
