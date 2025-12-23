import { describe, it, expect } from 'vitest';
import { generateChainId } from '../chain-id.js';

describe('chain-id utilities', () => {
  describe('generateChainId', () => {
    it('should generate SHA256 hash of network name', () => {
      const chainId = generateChainId('zattera');
      expect(chainId).toBeDefined();
      expect(chainId).toHaveLength(64); // SHA256 produces 64 hex characters
      expect(chainId).toMatch(/^[0-9a-f]{64}$/); // Only hex characters
    });

    it('should produce different hashes for different network names', () => {
      const zatteraHash = generateChainId('zattera');
      const testnetHash = generateChainId('testnet');

      expect(zatteraHash).not.toBe(testnetHash);
    });

    it('should produce consistent hashes', () => {
      const hash1 = generateChainId('zattera');
      const hash2 = generateChainId('zattera');

      expect(hash1).toBe(hash2);
    });
  });
});
