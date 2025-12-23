import { sha256 } from '@noble/hashes/sha2';
import type { NetworkName } from '../types/index.js';

/**
 * Generate chain ID from network name using SHA256 hash
 * Follows the formula: fc::sha256::hash(chain_id_name)
 *
 * @param networkName - Network name to hash
 * @returns Hex string of the chain ID (without 0x prefix)
 */
export function generateChainId(networkName: NetworkName): string {
  const hash = sha256(new TextEncoder().encode(networkName));
  return Array.from(hash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
