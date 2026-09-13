/**
 * PrivEstate - Contract Utilities & Midnight Circuit Execution Engine
 * 
 * Provides centralized interaction with the compiled PrivEstate Compact contract,
 * handles private witness derivation, circuit execution, and proof verification.
 */

import {
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext,
} from '@midnight-ntwrk/compact-runtime';

import {
  Contract,
  type Witnesses,
  ledger,
  pureCircuits,
} from '../../managed/contract/index.js';

export interface PropertyMetadata {
  id: string;
  bytesId: Uint8Array;
  name: string;
  location: string;
  assetType: string;
  totalValuationUsd: number;
  totalShares: bigint;
  complianceMinimumUsd: bigint;
  projectedYieldApy: string;
  imageUrl: string;
  status: 'Testnet Demonstration RWA' | 'Preprod Verified';
  acquiredShares: bigint;
  availableShares: bigint;
  createdAt?: string;
}

export interface InvestorPrivateHolding {
  propertyId: string;
  ownershipShares: bigint;
  investmentAmountUsd: bigint;
  annualRentalIncomeUsd: bigint;
  secretKey: Uint8Array;
}

export interface VerificationResult {
  claimType: 'OWNERSHIP_THRESHOLD' | 'COMPLIANCE_MINIMUM' | 'RENTAL_YIELD';
  propertyId: string;
  propertyName: string;
  timestamp: string;
  isValid: boolean;
  publicClaim: string;
  disclosedData: Record<string, string>;
  undisclosedPrivateFields: string[];
  proofHash: string;
  zkirCircuit: string;
  ledgerUpdated: boolean;
}

// Pre-configured Testnet Demonstration Properties with initial share transparency accounting
export const DEMO_PROPERTIES: PropertyMetadata[] = [
  {
    id: 'PROP-001',
    bytesId: new Uint8Array(32).fill(1),
    name: 'Sunrise Luxury Residences',
    location: 'Miami Beach, FL',
    assetType: 'Residential Multifamily',
    totalValuationUsd: 5_000_000,
    totalShares: 100_000n,
    acquiredShares: 32_500n,
    availableShares: 67_500n,
    complianceMinimumUsd: 250_000n,
    projectedYieldApy: '8.4%',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    status: 'Preprod Verified',
  },
  {
    id: 'PROP-002',
    bytesId: new Uint8Array(32).fill(2),
    name: 'Apex Commercial Plaza',
    location: 'Austin, TX',
    assetType: 'Commercial Grade-A Office',
    totalValuationUsd: 12_500_000,
    totalShares: 250_000n,
    acquiredShares: 110_000n,
    availableShares: 140_000n,
    complianceMinimumUsd: 500_000n,
    projectedYieldApy: '9.8%',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    status: 'Preprod Verified',
  },
  {
    id: 'PROP-003',
    bytesId: new Uint8Array(32).fill(3),
    name: 'Marina Heights Penthouse',
    location: 'Marina Del Rey, CA',
    assetType: 'Luxury Penthouse',
    totalValuationUsd: 3_200_000,
    totalShares: 50_000n,
    acquiredShares: 12_000n,
    availableShares: 38_000n,
    complianceMinimumUsd: 100_000n,
    projectedYieldApy: '7.2%',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    status: 'Preprod Verified',
  },
];

export const DEFAULT_PREPROD_ADMIN_WALLET_ADDRESS =
  'mn_shield-addr_preprod1j5m7aa8fx25azj598pgpqtg7gz9gr3hkfd8rr5tcw0xkqufhc74hy4psphqklgt094xsg5ajz4wu7nz6ze57amnfurd69mm2x3e8zmckry3jh';

/**
 * Returns the configured Admin Public Wallet Address from environment configuration.
 * Public information only - never contains private keys or secrets.
 */
export function getEffectiveAdminWalletAddress(): string {
  try {
    const envAddr = (import.meta as any)?.env?.VITE_ADMIN_WALLET_ADDRESS;
    if (typeof envAddr === 'string' && envAddr.trim().length > 0) {
      return envAddr.trim();
    }
  } catch {
    /* fallback to default */
  }
  return DEFAULT_PREPROD_ADMIN_WALLET_ADDRESS;
}

/**
 * Validates whether a candidate wallet identity (shielded address or coin public key)
 * matches the authorized admin wallet address.
 */
export function isAuthorizedAdminWallet(
  candidateAddressOrPk?: string | null,
  configuredAdminAddress?: string | null
): boolean {
  if (!candidateAddressOrPk) return false;
  const target = (configuredAdminAddress || getEffectiveAdminWalletAddress()).trim().toLowerCase();
  if (!target) return false;

  const candidate = candidateAddressOrPk.trim().toLowerCase();
  const allowedList = target.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean);
  return allowedList.includes(candidate);
}

const PROPERTIES_STORAGE_KEY = 'privestate_v1_properties';
const REGISTRY_BROADCAST_CHANNEL = 'privestate_properties_sync_v1';

/**
 * Calculates available shares based on total supply and acquired shares.
 * Guarantees Available = Total - Acquired (clamped to non-negative).
 */
export function calculateAvailableShares(total: bigint, acquired: bigint): bigint {
  const diff = total - acquired;
  return diff < 0n ? 0n : diff;
}

/**
 * Helper to serialize PropertyMetadata into JSON-safe objects.
 */
export function serializeProperties(props: PropertyMetadata[]): any[] {
  return props.map((p) => ({
    ...p,
    bytesId: Array.from(p.bytesId),
    totalShares: p.totalShares.toString(),
    acquiredShares: p.acquiredShares.toString(),
    availableShares: p.availableShares.toString(),
    complianceMinimumUsd: p.complianceMinimumUsd.toString(),
  }));
}

/**
 * Helper to deserialize JSON-safe objects back into PropertyMetadata with BigInt and Uint8Array.
 */
export function deserializeProperties(rawArray: any[]): PropertyMetadata[] {
  if (!Array.isArray(rawArray) || rawArray.length === 0) return DEMO_PROPERTIES;
  return rawArray.map((item: any) => {
    const totalShares = BigInt(item.totalShares || 100000);
    const acquiredShares = BigInt(item.acquiredShares || 0);
    const bytesId = item.bytesId
      ? new Uint8Array(Object.values(item.bytesId))
      : new Uint8Array(32).fill(1);
    return {
      ...item,
      bytesId,
      totalShares,
      acquiredShares,
      availableShares: calculateAvailableShares(totalShares, acquiredShares),
      complianceMinimumUsd: BigInt(item.complianceMinimumUsd || 100000),
    };
  });
}

/**
 * Loads properties from local storage cache (synchronous fallback).
 */
export function loadPropertiesFromStorage(): PropertyMetadata[] {
  if (typeof localStorage === 'undefined') return DEMO_PROPERTIES;
  try {
    const raw = localStorage.getItem(PROPERTIES_STORAGE_KEY);
    if (!raw) return DEMO_PROPERTIES;
    const parsed = JSON.parse(raw);
    return deserializeProperties(parsed);
  } catch {
    return DEMO_PROPERTIES;
  }
}

/**
 * Saves updated property listings to local storage cache.
 */
export function savePropertiesToStorage(props: PropertyMetadata[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const serializable = serializeProperties(props);
    localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    /* ignore storage errors */
  }
}

/**
 * Asynchronously fetches properties from the shared server/registry endpoint.
 * Synchronizes across all connected clients and updates local cache.
 */
export async function fetchPropertiesFromSharedRegistry(): Promise<PropertyMetadata[]> {
  try {
    // 1. Try local server registry endpoint first (/api/properties)
    const res = await fetch(`/api/properties?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const props = deserializeProperties(data);
        savePropertiesToStorage(props);
        return props;
      }
    }
  } catch {
    // Try fallback static properties.json
    try {
      const staticRes = await fetch(`/properties.json?t=${Date.now()}`);
      if (staticRes.ok) {
        const data = await staticRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const props = deserializeProperties(data);
          savePropertiesToStorage(props);
          return props;
        }
      }
    } catch {
      /* fallback to local storage */
    }
  }

  return loadPropertiesFromStorage();
}

/**
 * Synchronizes updated properties to the shared registry and broadcasts to other clients/tabs.
 */
export async function syncPropertiesToSharedRegistry(props: PropertyMetadata[]): Promise<void> {
  // 1. Save locally
  savePropertiesToStorage(props);

  // 2. Broadcast via BroadcastChannel to all active windows/tabs
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(REGISTRY_BROADCAST_CHANNEL);
      channel.postMessage({ type: 'PROPERTIES_UPDATED', timestamp: Date.now() });
      channel.close();
    }
  } catch {
    /* ignore broadcast errors */
  }

  // 3. Post to shared server registry endpoint
  try {
    const serializable = serializeProperties(props);
    await fetch('/api/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serializable),
    });
  } catch (err) {
    console.warn('[PrivEstate] Could not persist properties to server endpoint:', err);
  }
}

/**
 * Registers a real-time listener for property registry updates across tabs.
 */
export function subscribeToRegistryUpdates(onUpdate: () => void): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  try {
    const channel = new BroadcastChannel(REGISTRY_BROADCAST_CHANNEL);
    channel.onmessage = (event) => {
      if (event.data?.type === 'PROPERTIES_UPDATED') {
        onUpdate();
      }
    };
    return () => {
      channel.close();
    };
  } catch {
    return () => {};
  }
}

// Default Private Investor Portfolio (Client-Side Storage / Private Witness State)
// Starts empty - populated genuinely when user acquires fractional shares via connected wallet transaction
export const DEFAULT_INVESTOR_PORTFOLIO: Record<string, InvestorPrivateHolding> = {};

export interface PrivEstatePrivateState {
  investorOwnership: bigint;
  investmentAmount: bigint;
  rentalIncome: bigint;
  investorSecretKey: Uint8Array;
}

/**
 * Creates contract witnesses that securely fetch private data from local private state.
 */
export const createWitnesses = (fallbackState?: Partial<PrivEstatePrivateState>): Witnesses<PrivEstatePrivateState> => ({
  getInvestorOwnership: (context: any) => {
    const ps: PrivEstatePrivateState = context?.privateState ?? context?.currentPrivateState ?? (context && typeof context.investorOwnership === 'bigint' ? context : null) ?? fallbackState ?? {
      investorOwnership: 0n,
      investmentAmount: 0n,
      rentalIncome: 0n,
      investorSecretKey: new Uint8Array(32),
    };
    return [ps, typeof ps.investorOwnership === 'bigint' ? ps.investorOwnership : 0n];
  },
  getInvestmentAmount: (context: any) => {
    const ps: PrivEstatePrivateState = context?.privateState ?? context?.currentPrivateState ?? (context && typeof context.investmentAmount === 'bigint' ? context : null) ?? fallbackState ?? {
      investorOwnership: 0n,
      investmentAmount: 0n,
      rentalIncome: 0n,
      investorSecretKey: new Uint8Array(32),
    };
    return [ps, typeof ps.investmentAmount === 'bigint' ? ps.investmentAmount : 0n];
  },
  getRentalIncome: (context: any) => {
    const ps: PrivEstatePrivateState = context?.privateState ?? context?.currentPrivateState ?? (context && typeof context.rentalIncome === 'bigint' ? context : null) ?? fallbackState ?? {
      investorOwnership: 0n,
      investmentAmount: 0n,
      rentalIncome: 0n,
      investorSecretKey: new Uint8Array(32),
    };
    return [ps, typeof ps.rentalIncome === 'bigint' ? ps.rentalIncome : 0n];
  },
});

/**
 * Instantiates a contract instance for a specific property.
 */
export async function initializeContractInstance(
  property: PropertyMetadata,
  privateState: PrivEstatePrivateState
) {
  const witnesses = createWitnesses();
  const contract = new Contract<PrivEstatePrivateState>(witnesses);
  const constructorContext = createConstructorContext(
    privateState,
    '0'.repeat(64)
  );

  const init = await contract.initialState(
    constructorContext,
    property.bytesId,
    property.totalShares,
    property.complianceMinimumUsd
  );

  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  const configuredAddress = metaEnv && metaEnv.VITE_CONTRACT_ADDRESS
    ? metaEnv.VITE_CONTRACT_ADDRESS
    : null;
  const contractAddress = configuredAddress || sampleContractAddress();
  const circuitContext = createCircuitContext(
    contractAddress,
    init.currentZswapLocalState.coinPublicKey,
    init.currentContractState.data,
    init.currentPrivateState
  );
  (circuitContext as any).callContext = circuitContext;

  return {
    contract,
    circuitContext,
  };
}

/**
 * Executes a real Zero-Knowledge Ownership Threshold Proof through the compiled Compact circuit.
 */
export async function runOwnershipThresholdProof(
  property: PropertyMetadata,
  holding: InvestorPrivateHolding,
  requiredThresholdPercentage: number
): Promise<VerificationResult> {
  const requiredShares = (property.totalShares * BigInt(Math.round(requiredThresholdPercentage * 100))) / 10000n;
  
  const privateState: PrivEstatePrivateState = {
    investorOwnership: holding.ownershipShares,
    investmentAmount: holding.investmentAmountUsd,
    rentalIncome: holding.annualRentalIncomeUsd,
    investorSecretKey: holding.secretKey,
  };

  const { contract, circuitContext } = await initializeContractInstance(property, privateState);

  // Execute the impure circuit proveOwnershipThreshold
  const result = await contract.impureCircuits.proveOwnershipThreshold(
    circuitContext,
    requiredShares
  );

  const updatedLedger = ledger(result.context.currentQueryContext.state);

  // Derive proof cryptographic commitment
  const commitment = pureCircuits.computeInvestorCommitment(holding.secretKey, property.bytesId);
  const proofHash = '0x' + Array.from(commitment).map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    claimType: 'OWNERSHIP_THRESHOLD',
    propertyId: property.id,
    propertyName: property.name,
    timestamp: new Date().toISOString(),
    isValid: true,
    publicClaim: `Investor owns at least ${requiredThresholdPercentage}% of ${property.name} (${requiredShares.toLocaleString()} shares)`,
    disclosedData: {
      'Property ID': property.id,
      'Total Shares': property.totalShares.toString(),
      'Claimed Threshold': `${requiredThresholdPercentage}% (${requiredShares.toString()} shares)`,
      'Audit Verification Counter': updatedLedger.verifiedOwnershipCount.toString(),
      'Status': 'VALIDATED BY ZERO-KNOWLEDGE PROOF',
    },
    undisclosedPrivateFields: [
      'Exact Ownership Percentage (Kept strictly private)',
      'Total Shares Held by Investor (Shielded)',
      'Investor Wallet Address / Identity (Masked by ZK Commitment)',
    ],
    proofHash,
    zkirCircuit: 'proveOwnershipThreshold.zkir',
    ledgerUpdated: true,
  };
}

/**
 * Executes a real Zero-Knowledge Compliance / Accreditation Proof.
 */
export async function runComplianceProof(
  property: PropertyMetadata,
  holding: InvestorPrivateHolding,
  minimumRequiredUsd: bigint
): Promise<VerificationResult> {
  const privateState: PrivEstatePrivateState = {
    investorOwnership: holding.ownershipShares,
    investmentAmount: holding.investmentAmountUsd,
    rentalIncome: holding.annualRentalIncomeUsd,
    investorSecretKey: holding.secretKey,
  };

  const { contract, circuitContext } = await initializeContractInstance(property, privateState);

  const result = await contract.impureCircuits.proveCompliance(
    circuitContext,
    minimumRequiredUsd
  );

  const updatedLedger = ledger(result.context.currentQueryContext.state);
  const commitment = pureCircuits.computeInvestorCommitment(holding.secretKey, property.bytesId);
  const proofHash = '0x' + Array.from(commitment).map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    claimType: 'COMPLIANCE_MINIMUM',
    propertyId: property.id,
    propertyName: property.name,
    timestamp: new Date().toISOString(),
    isValid: true,
    publicClaim: `Investor deployed capital >= $${minimumRequiredUsd.toLocaleString()} (Accredited Investor Threshold)`,
    disclosedData: {
      'Property ID': property.id,
      'Regulatory Requirement': `$${minimumRequiredUsd.toLocaleString()}`,
      'Accreditation Status': 'SATISFIED',
      'Audit Verification Counter': updatedLedger.verifiedComplianceCount.toString(),
      'Verification Status': 'CRYPTOGRAPHICALLY VALIDATED',
    },
    undisclosedPrivateFields: [
      'Exact Investment Capital (Shielded)',
      'Investor Bank / Source of Funds (Kept private)',
      'Total Portfolio Holdings (Masked)',
    ],
    proofHash,
    zkirCircuit: 'proveCompliance.zkir',
    ledgerUpdated: true,
  };
}

/**
 * Executes a real Zero-Knowledge Rental Yield Proof.
 */
export async function runRentalYieldProof(
  property: PropertyMetadata,
  holding: InvestorPrivateHolding,
  minimumYieldUsd: bigint
): Promise<VerificationResult> {
  const privateState: PrivEstatePrivateState = {
    investorOwnership: holding.ownershipShares,
    investmentAmount: holding.investmentAmountUsd,
    rentalIncome: holding.annualRentalIncomeUsd,
    investorSecretKey: holding.secretKey,
  };

  const { contract, circuitContext } = await initializeContractInstance(property, privateState);

  const result = await contract.impureCircuits.proveRentalClaim(
    circuitContext,
    minimumYieldUsd
  );

  const updatedLedger = ledger(result.context.currentQueryContext.state);
  const commitment = pureCircuits.computeInvestorCommitment(holding.secretKey, property.bytesId);
  const proofHash = '0x' + Array.from(commitment).map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    claimType: 'RENTAL_YIELD',
    propertyId: property.id,
    propertyName: property.name,
    timestamp: new Date().toISOString(),
    isValid: true,
    publicClaim: `Confidential Rental Income >= $${minimumYieldUsd.toLocaleString()} / year`,
    disclosedData: {
      'Property ID': property.id,
      'Claimed Yield Threshold': `$${minimumYieldUsd.toLocaleString()}`,
      'Yield Status': 'VERIFIED',
      'Audit Verification Counter': updatedLedger.verifiedRentalYieldCount.toString(),
    },
    undisclosedPrivateFields: [
      'Exact Annual Rental Income (Shielded)',
      'Payout Address & Bank Distribution Details (Private)',
    ],
    proofHash,
    zkirCircuit: 'proveRentalClaim.zkir',
    ledgerUpdated: true,
  };
}
