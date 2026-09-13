import { describe, it, expect, beforeEach } from 'vitest';
import {
  type CircuitContext,
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext,
} from '@midnight-ntwrk/compact-runtime';
import {
  Contract,
  type Ledger,
  type Witnesses,
  ledger,
  pureCircuits,
} from '../managed/contract/index.js';
import {
  calculateAvailableShares,
  loadPropertiesFromStorage,
  savePropertiesToStorage,
  DEMO_PROPERTIES,
  type PropertyMetadata,
} from '../src/utils/contract';
import {
  getSafeWalletFingerprint,
  getDeterministicWalletId,
} from '../src/hooks/useMidnight';

export interface PrivEstatePrivateState {
  investorOwnership: bigint;
  investmentAmount: bigint;
  rentalIncome: bigint;
  investorSecretKey: Uint8Array;
}

const createWitnesses = (): Witnesses<PrivEstatePrivateState> => ({
  getInvestorOwnership: ({ privateState }: { privateState: PrivEstatePrivateState }) => [privateState, privateState.investorOwnership],
  getInvestmentAmount: ({ privateState }: { privateState: PrivEstatePrivateState }) => [privateState, privateState.investmentAmount],
  getRentalIncome: ({ privateState }: { privateState: PrivEstatePrivateState }) => [privateState, privateState.rentalIncome],
});

export class PrivEstateSimulator {
  readonly contract: Contract<PrivEstatePrivateState>;
  circuitContext: CircuitContext<PrivEstatePrivateState>;

  private constructor(
    contract: Contract<PrivEstatePrivateState>,
    circuitContext: CircuitContext<PrivEstatePrivateState>
  ) {
    this.contract = contract;
    this.circuitContext = circuitContext;
  }

  static async create(
    initialPrivateState: PrivEstatePrivateState,
    propertyId: Uint8Array,
    totalShares: bigint,
    complianceMinimum: bigint
  ): Promise<PrivEstateSimulator> {
    const witnesses = createWitnesses();
    const contract = new Contract<PrivEstatePrivateState>(witnesses);
    const constructorContext = createConstructorContext(
      initialPrivateState,
      '0'.repeat(64)
    );
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = await contract.initialState(
      constructorContext,
      propertyId,
      totalShares,
      complianceMinimum
    );

    const contractAddress = sampleContractAddress();
    const circuitContext = createCircuitContext(
      contractAddress,
      currentZswapLocalState.coinPublicKey,
      currentContractState.data,
      currentPrivateState
    );
    (circuitContext as any).callContext = circuitContext;

    return new PrivEstateSimulator(contract, circuitContext);
  }

  private get ctx(): any {
    return this.circuitContext;
  }

  public getLedger(): Ledger {
    return ledger(this.ctx.currentQueryContext.state);
  }

  public getPrivateState(): PrivEstatePrivateState {
    return this.ctx.currentPrivateState as PrivEstatePrivateState;
  }

  public setPrivateState(state: Partial<PrivEstatePrivateState>) {
    const prev = this.ctx.currentPrivateState as PrivEstatePrivateState;
    this.ctx.currentPrivateState = {
      ...prev,
      ...state,
    };
  }

  public async proveOwnershipThreshold(requiredShares: bigint): Promise<Ledger> {
    const result = await this.contract.impureCircuits.proveOwnershipThreshold(
      this.circuitContext,
      requiredShares
    );
    this.circuitContext = result.context;
    (this.circuitContext as any).callContext = this.circuitContext;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public async proveCompliance(minimumRequired: bigint): Promise<Ledger> {
    const result = await this.contract.impureCircuits.proveCompliance(
      this.circuitContext,
      minimumRequired
    );
    this.circuitContext = result.context;
    (this.circuitContext as any).callContext = this.circuitContext;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public async proveRentalClaim(minimumYield: bigint): Promise<Ledger> {
    const result = await this.contract.impureCircuits.proveRentalClaim(
      this.circuitContext,
      minimumYield
    );
    this.circuitContext = result.context;
    (this.circuitContext as any).callContext = this.circuitContext;
    return ledger(this.circuitContext.currentQueryContext.state);
  }
}

describe('PrivEstate Privacy Contract Test Suite', () => {
  const propertyId = new Uint8Array(32).fill(7); // Sample property identifier
  const totalShares = 100_000n; // 100,000 total tokenized shares
  const complianceMinimum = 250_000n; // $250,000 minimum accreditation requirement
  const investorSecretKey = new Uint8Array(32).fill(42);

  let simulator: PrivEstateSimulator;

  beforeEach(async () => {
    // Default investor holds 17,430 shares (17.43%), has invested $500,000, and receives $45,000 in rental income
    simulator = await PrivEstateSimulator.create(
      {
        investorOwnership: 17_430n,
        investmentAmount: 500_000n,
        rentalIncome: 45_000n,
        investorSecretKey,
      },
      propertyId,
      totalShares,
      complianceMinimum
    );
  });

  describe('Contract Initialization', () => {
    it('initializes public ledger state correctly while keeping investor data private', () => {
      const publicLedger = simulator.getLedger();
      expect(publicLedger.propertyId).toEqual(propertyId);
      expect(publicLedger.totalShares).toEqual(100_000n);
      expect(publicLedger.complianceMinimum).toEqual(250_000n);
      expect(publicLedger.verifiedOwnershipCount).toEqual(0n);
      expect(publicLedger.verifiedComplianceCount).toEqual(0n);
      expect(publicLedger.verifiedRentalYieldCount).toEqual(0n);
      expect(publicLedger.lastVerifiedThreshold).toEqual(0n);

      // Verify that the private state is held off-chain in private storage
      const privateState = simulator.getPrivateState();
      expect(privateState.investorOwnership).toEqual(17_430n);
      expect(privateState.investmentAmount).toEqual(500_000n);
      expect(privateState.rentalIncome).toEqual(45_000n);
    });
  });

  describe('Requirement 1: Valid Ownership Threshold Proof (PASS)', () => {
    it('successfully verifies proof when investor ownership satisfies the threshold', async () => {
      // Investor privately owns 17,430 shares (17.43%)
      // Public threshold required: 10,000 shares (10%)
      const requiredThreshold = 10_000n;
      const updatedLedger = await simulator.proveOwnershipThreshold(requiredThreshold);

      // Claim is verified, public counter increments, threshold is recorded
      expect(updatedLedger.verifiedOwnershipCount).toEqual(1n);
      expect(updatedLedger.lastVerifiedThreshold).toEqual(10_000n);

      // Crucial privacy guarantee: the investor's exact share count (17,430) is NOT in the ledger
      expect((updatedLedger as any).investorOwnership).toBeUndefined();
    });
  });

  describe('Requirement 2: Invalid Ownership Threshold Proof (FAIL)', () => {
    it('rejects proof and throws contract assertion error when ownership is below threshold', async () => {
      // Set investor ownership to 7,000 shares (7%)
      simulator.setPrivateState({ investorOwnership: 7_000n });

      // Required threshold: 10,000 shares (10%)
      const requiredThreshold = 10_000n;

      await expect(
        simulator.proveOwnershipThreshold(requiredThreshold)
      ).rejects.toThrow('Ownership threshold requirement not satisfied');

      // The public counter must NOT have incremented
      expect(simulator.getLedger().verifiedOwnershipCount).toEqual(0n);
    });
  });

  describe('Requirement 3: Eligibility & Compliance Condition (PASS & FAIL)', () => {
    it('successfully proves regulatory accreditation when investment meets or exceeds minimum', async () => {
      // Investor privately invested $500,000
      // Required minimum: $250,000
      const updatedLedger = await simulator.proveCompliance(250_000n);

      expect(updatedLedger.verifiedComplianceCount).toEqual(1n);

      // Crucial privacy guarantee: the exact investment amount ($500,000) is NOT in the ledger
      expect((updatedLedger as any).investmentAmount).toBeUndefined();
    });

    it('rejects compliance proof when investment is below minimum requirement', async () => {
      // Investor only invested $150,000
      simulator.setPrivateState({ investmentAmount: 150_000n });

      // Required minimum: $250,000
      await expect(
        simulator.proveCompliance(250_000n)
      ).rejects.toThrow('Investment does not meet minimum compliance threshold');

      expect(simulator.getLedger().verifiedComplianceCount).toEqual(0n);
    });
  });

  describe('Requirement 4: Confidential Rental Income Proof', () => {
    it('verifies rental yield claim without revealing private rental earnings', async () => {
      // Investor privately earns $45,000 rental income
      // Claim: Rental income >= $30,000
      const updatedLedger = await simulator.proveRentalClaim(30_000n);

      expect(updatedLedger.verifiedRentalYieldCount).toEqual(1n);
      expect((updatedLedger as any).rentalIncome).toBeUndefined();
    });

    it('rejects rental yield claim if earnings are below claimed benchmark', async () => {
      // Claim: Rental income >= $60,000 (actual is 45,000)
      await expect(
        simulator.proveRentalClaim(60_000n)
      ).rejects.toThrow('Rental income does not meet required yield threshold');

      expect(simulator.getLedger().verifiedRentalYieldCount).toEqual(0n);
    });
  });

  describe('Cryptographic Identity Commitment', () => {
    it('computes deterministic investor identity commitment without exposing secret key', () => {
      const commitment1 = pureCircuits.computeInvestorCommitment(investorSecretKey, propertyId);
      const commitment2 = pureCircuits.computeInvestorCommitment(investorSecretKey, propertyId);

      expect(commitment1).toEqual(commitment2);
      expect(commitment1.length).toBe(32);
    });
  });

  describe('Level 6: Property Share Transparency & Validation', () => {
    it('correctly calculates available shares using Available = Total - Acquired', () => {
      const total = 100_000n;
      const acquired = 32_500n;
      const available = calculateAvailableShares(total, acquired);
      expect(available).toEqual(67_500n);
      expect(total - acquired).toEqual(available);
    });

    it('clamps available shares to 0 when acquired shares equal or exceed total supply', () => {
      expect(calculateAvailableShares(50_000n, 50_000n)).toEqual(0n);
      expect(calculateAvailableShares(50_000n, 60_000n)).toEqual(0n);
    });

    it('verifies default demo properties have valid share transparency accounting', () => {
      DEMO_PROPERTIES.forEach((prop) => {
        expect(prop.totalShares).toBeGreaterThan(0n);
        expect(prop.availableShares).toEqual(prop.totalShares - prop.acquiredShares);
        expect(prop.availableShares).toBeGreaterThanOrEqual(0n);
      });
    });
  });

  describe('Level 6: Admin Property Management', () => {
    it('creates new RWA property asset with initial 100% share availability', () => {
      const newProperty: PropertyMetadata = {
        id: 'PROP-TEST-001',
        bytesId: new Uint8Array(32).fill(99),
        name: 'Skyline Innovation Center',
        location: 'Seattle, WA',
        assetType: 'Commercial Grade-A Office',
        totalValuationUsd: 8_000_000,
        totalShares: 160_000n,
        acquiredShares: 0n,
        availableShares: 160_000n,
        complianceMinimumUsd: 300_000n,
        projectedYieldApy: '9.1%',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
        status: 'Preprod Verified',
      };

      expect(newProperty.availableShares).toEqual(newProperty.totalShares);
      expect(calculateAvailableShares(newProperty.totalShares, newProperty.acquiredShares)).toEqual(160_000n);
    });

    it('returns default DEMO_PROPERTIES when local storage is empty', () => {
      const props = loadPropertiesFromStorage();
      expect(props.length).toBeGreaterThanOrEqual(3);
      expect(props[0].id).toEqual('PROP-001');
    });
  });

  describe('Level 6: Wallet Security & Fingerprint Helpers', () => {
    it('masks long wallet addresses cleanly for safe logging', () => {
      const fullAddr = 'mn_addr_preprod1cwtsm6mjm0ygeu4a8lankwhurgenflvsrhwkhyl9p4r8u9a9dxus95c8qd';
      const safe = getSafeWalletFingerprint(fullAddr);
      expect(safe).not.toEqual(fullAddr);
      expect(safe).toContain('...');
      expect(safe.startsWith('mn_addr_pr')).toBe(true);
    });

    it('returns "none" when wallet identity is empty or undefined', () => {
      expect(getSafeWalletFingerprint(null)).toEqual('none');
      expect(getSafeWalletFingerprint(undefined)).toEqual('none');
      expect(getSafeWalletFingerprint('')).toEqual('none');
    });

    it('derives deterministic wallet ID preferring coin public key over address', () => {
      const pk = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const addr = 'mn_addr_preprod12345';
      expect(getDeterministicWalletId(addr, pk)).toEqual(pk);
      expect(getDeterministicWalletId(addr, null)).toEqual(addr);
      expect(getDeterministicWalletId(null, null)).toBeNull();
    });
  });
});

