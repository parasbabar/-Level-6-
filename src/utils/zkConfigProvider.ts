import {
  ZKConfigProvider,
  createProverKey,
  createVerifierKey,
  createZKIR,
  type KeyMaterialProvider,
  type ProverKey,
  type VerifierKey,
  type ZKIR,
  type ZKConfig,
} from '@midnight-ntwrk/midnight-js-types';
import { ZK_ARTIFACTS } from './zkArtifactsData';

function base64ToUint8Array(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const binaryString = atob(b64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Normalizes circuit ID or reference location string to circuit name.
 * e.g.:
 *   "PrivEstate#proveOwnershipThreshold" -> "proveOwnershipThreshold"
 *   "keys/proveCompliance.verifier"      -> "proveCompliance"
 *   "proveRentalClaim"                   -> "proveRentalClaim"
 */
export function resolveCircuitName(input: string): string {
  let name = input.includes('#') ? (input.split('#').pop() || input) : input;
  name = name.replace(/^.*[\\/]/, '');
  name = name.replace(/\.(prover|verifier|bzkir|zkir)$/, '');
  const cleanName = name.trim();
  console.debug(`[PrivEstate ZKConfig] Resolved circuit "${input}" -> "${cleanName}"`);
  return cleanName;
}

/**
 * In-memory ZKConfigProvider for browser DApp execution.
 * Delivers verified proving keys, verifier keys, and ZKIR binaries
 * for PrivEstate circuits without needing a local Node proof server.
 */
export class PrivEstateZKConfigProvider extends ZKConfigProvider<string> {
  private cache = new Map<string, { vk: VerifierKey; pk: ProverKey; zkir: ZKIR }>();

  private getArtifacts(circuitId: string) {
    const name = resolveCircuitName(circuitId);
    let cached = this.cache.get(name);
    if (cached) return cached;

    const raw = ZK_ARTIFACTS[name];
    if (!raw) {
      throw new Error(
        `PrivEstate ZK artifact not found for circuit "${circuitId}" (resolved as "${name}"). ` +
        `Available circuits: ${Object.keys(ZK_ARTIFACTS).join(', ')}`
      );
    }

    cached = {
      vk: createVerifierKey(base64ToUint8Array(raw.vk)),
      pk: createProverKey(base64ToUint8Array(raw.pk)),
      zkir: createZKIR(base64ToUint8Array(raw.zkir)),
    };
    this.cache.set(name, cached);
    return cached;
  }

  async getZKIR(circuitId: string): Promise<ZKIR> {
    return this.getArtifacts(circuitId).zkir;
  }

  async getProverKey(circuitId: string): Promise<ProverKey> {
    return this.getArtifacts(circuitId).pk;
  }

  async getVerifierKey(circuitId: string): Promise<VerifierKey> {
    return this.getArtifacts(circuitId).vk;
  }

  async getVerifierKeys(circuitIds: string[]): Promise<[string, VerifierKey][]> {
    return Promise.all(
      circuitIds.map(async (id) => [id, await this.getVerifierKey(id)] as [string, VerifierKey])
    );
  }

  async get(circuitId: string): Promise<ZKConfig<string>> {
    const { zkir, pk: proverKey, vk: verifierKey } = this.getArtifacts(circuitId);
    return { circuitId, zkir, proverKey, verifierKey };
  }

  asKeyMaterialProvider(): KeyMaterialProvider {
    return {
      getZKIR: async (loc: string) => this.getZKIR(loc),
      getProverKey: async (loc: string) => this.getProverKey(loc),
      getVerifierKey: async (loc: string) => this.getVerifierKey(loc),
    };
  }
}

/**
 * Creates an instance of PrivEstateZKConfigProvider.
 */
export function createPrivEstateZKConfigProvider(): PrivEstateZKConfigProvider {
  return new PrivEstateZKConfigProvider();
}
