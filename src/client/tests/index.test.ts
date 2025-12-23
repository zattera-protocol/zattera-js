import { describe, it, expect } from 'vitest';
import { ZatteraClient } from '../index.js';
import { generateChainId } from '../../utils/chain-id.js';

describe('ZatteraClient', () => {
  describe('Configuration', () => {
    it('should create client with endpoint only and default to zattera network', () => {
      const client = new ZatteraClient({
        endpoint: 'https://rpc.zattera.network',
      });

      expect(client).toBeDefined();
      expect(client.getChainId()).toBe(generateChainId('zattera'));
    });

    it('should create client with network name zattera', () => {
      const client = new ZatteraClient({
        endpoint: 'https://rpc.zattera.network',
        networkName: 'zattera',
      });

      expect(client).toBeDefined();
      expect(client.getChainId()).toBe(generateChainId('zattera'));
    });

    it('should create client with network name testnet', () => {
      const client = new ZatteraClient({
        endpoint: 'https://rpc.zattera.network',
        networkName: 'testnet',
      });

      expect(client).toBeDefined();
      expect(client.getChainId()).toBe(generateChainId('testnet'));
    });

    it('should create client with all config options', () => {
      const client = new ZatteraClient({
        endpoint: 'https://rpc.zattera.network',
        networkName: 'testnet',
        timeout: 5000,
        retries: 5,
      });

      expect(client).toBeDefined();
      expect(client.getChainId()).toBe(generateChainId('testnet'));
    });
  });
});
