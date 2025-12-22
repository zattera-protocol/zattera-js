import { describe, it, expect, beforeAll } from 'vitest';
import { ZatteraClient } from '../src/client/index.js';
import { ListOrder } from '../src/types/index.js';

const TEST_RPC_ENDPOINT = 'http://3.36.98.253:8090';

describe('ZatteraClient - Integration Tests', () => {
  let client: ZatteraClient;

  beforeAll(() => {
    client = new ZatteraClient({
      endpoint: TEST_RPC_ENDPOINT,
      timeout: 10000,
      retries: 2,
    });
  });

  describe('constructor', () => {
    it('should create instance with config', () => {
      expect(client).toBeInstanceOf(ZatteraClient);
    });

    it('should use default timeout and retries if not provided', () => {
      const defaultClient = new ZatteraClient({
        endpoint: TEST_RPC_ENDPOINT,
      });
      expect(defaultClient).toBeInstanceOf(ZatteraClient);
    });
  });

  describe('Database API - Global Properties', () => {
    it('should get chain config', async () => {
      const result = await client.getConfig();
      expect(result).toBeDefined();
      expect(result.ZATTERA_CHAIN_ID_NAME).toBeDefined();
      expect(result.ZATTERA_ADDRESS_PREFIX).toBeDefined();
      expect(result.ZATTERA_BLOCK_INTERVAL).toBeDefined();
    });

    it('should get dynamic global properties', async () => {
      const result = await client.getDynamicGlobalProperties();
      expect(result).toBeDefined();
      expect(result.head_block_number).toBeGreaterThan(0);
      expect(result.head_block_id).toBeDefined();
      expect(result.time).toBeDefined();
    });

    it('should get witness schedule', async () => {
      const result = await client.getWitnessSchedule();
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should get hardfork properties', async () => {
      const result = await client.getHardforkProperties();
      expect(result).toBeDefined();
    });

    it('should get reward funds', async () => {
      const result = await client.getRewardFunds();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get current price feed', async () => {
      const result = await client.getCurrentPriceFeed();
      expect(result).toBeDefined();
    });

    it('should get feed history', async () => {
      const result = await client.getFeedHistory();
      expect(result).toBeDefined();
    });
  });

  describe('Database API - Accounts', () => {
    it('should list accounts', async () => {
      const result = await client.listAccounts({
        start: null,
        limit: 10,
        order: ListOrder.BY_NAME,
      });

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('id');
      }
    });

    it('should find specific accounts', async () => {
      const result = await client.findAccounts({ accounts: ['genesis'] });
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].name).toBe('genesis');
      }
    });
  });

  describe('Database API - Witnesses', () => {
    it('should list witnesses', async () => {
      const result = await client.listWitnesses({
        start: null,
        limit: 10,
        order: ListOrder.BY_NAME,
      });

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('owner');
      }
    });

    it('should get active witnesses', async () => {
      const result = await client.getActiveWitnesses();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should find specific witnesses', async () => {
      const activeWitnesses = await client.getActiveWitnesses();
      if (activeWitnesses.length > 0) {
        const result = await client.findWitnesses([activeWitnesses[0]]);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Block API', () => {
    it('should get block by number', async () => {
      const props = await client.getDynamicGlobalProperties();
      const blockNum = props.head_block_number - 10; // Get a block that definitely exists

      const result = await client.getBlock(blockNum);
      expect(result).toBeDefined();
      expect(result.witness).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);
    });

    it('should get block header', async () => {
      const props = await client.getDynamicGlobalProperties();
      const blockNum = props.head_block_number - 10;

      const result = await client.getBlockHeader(blockNum);
      expect(result).toBeDefined();
      expect(result.witness).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe.skip('Account History API (not enabled on test RPC)', () => {
    it('should get account history', async () => {
      const result = await client.getAccountHistory({
        account: 'genesis',
        start: -1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(typeof result === 'object').toBe(true);
    });

    it('should get ops in block', async () => {
      const props = await client.getDynamicGlobalProperties();
      const blockNum = props.head_block_number - 10;

      const result = await client.getOpsInBlock({
        block_num: blockNum,
        only_virtual: false,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Follow API', () => {
    it('should get followers', async () => {
      const result = await client.getFollowers({
        account: 'genesis',
        start: null,
        type: 'blog',
        limit: 10,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should get following', async () => {
      const result = await client.getFollowing({
        account: 'genesis',
        start: null,
        type: 'blog',
        limit: 10,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should get follow count', async () => {
      const result = await client.getFollowCount('genesis');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('account');
      expect(result).toHaveProperty('follower_count');
      expect(result).toHaveProperty('following_count');
    });
  });

  describe('Market History API', () => {
    it('should get ticker', async () => {
      const result = await client.getTicker();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('latest');
    });

    it('should get volume', async () => {
      const result = await client.getVolume();
      expect(result).toBeDefined();
    });

    it('should get market order book', async () => {
      const result = await client.getMarketOrderBook(10);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('bids');
      expect(result).toHaveProperty('asks');
      expect(Array.isArray(result.bids)).toBe(true);
      expect(Array.isArray(result.asks)).toBe(true);
    });

    it('should get market history buckets', async () => {
      const result = await client.getMarketHistoryBuckets();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Tags/Discussion API', () => {
    it('should get trending tags', async () => {
      const result = await client.getTrendingTags('', 10);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get discussion', async () => {
      const result = await client.getDiscussion('genesis', 'test');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('author');
    });

    it('should get content replies', async () => {
      const result = await client.getContentReplies('genesis', 'test');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('JSON-RPC Meta API', () => {
    it('should get list of methods', async () => {
      const result = await client.getMethods();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should get method signature', async () => {
      const result = await client.getSignature('database_api.get_config');
      expect(result).toBeDefined();
    });
  });

  describe('Batch requests', () => {
    it('should make batch RPC requests', async () => {
      const results = await client.batch([
        { method: 'database_api.get_dynamic_global_properties' },
        { method: 'database_api.get_active_witnesses' },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
      // Second result is wrapped { witnesses: [...] }
      const witnessesResult = results[1] as { witnesses: string[] };
      expect(witnessesResult.witnesses).toBeDefined();
      expect(Array.isArray(witnessesResult.witnesses)).toBe(true);
    });
  });

  describe('Generic RPC call', () => {
    it('should make generic RPC call', async () => {
      const result = await client.call('database_api.get_config');
      expect(result).toBeDefined();
    });
  });
});
