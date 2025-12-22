import type {
  ZatteraClientConfig,
  JsonRpcRequest,
  JsonRpcResponse,
  DynamicGlobalProperties,
  ChainConfig,
  WitnessSchedule,
  HardforkProperties,
  RewardFund,
  PriceFeed,
  FeedHistory,
  Account,
  Witness,
  Comment,
  SignedBlock,
  SignedTransaction,
  ListAccountsParams,
  FindAccountsParams,
  ListWitnessesParams,
  GetAccountHistoryParams,
  GetOpsInBlockParams,
  DiscussionQuery,
  GetFollowersParams,
  GetFollowingParams,
  BroadcastTransactionResult,
  VerifyAuthorityResult,
  GetTransactionResult,
  AccountHistoryEntry,
  Ticker,
  Volume,
  TradeHistory,
  MarketHistory,
  OrderBook,
  LimitOrder,
  ActiveVote,
  AccountName,
  PublicKey,
  TransactionId,
  OwnerHistory,
  AccountRecoveryRequest,
  Escrow,
  VestingDelegation,
  ConversionRequest,
  Vote,
  WitnessVote,
} from '../types/index.js';

/**
 * Zattera RPC Client
 *
 * Provides type-safe access to all Zattera blockchain RPC APIs
 * following JSON-RPC 2.0 specification
 */
export class ZatteraClient {
  private endpoint: string;
  private timeout: number;
  private retries: number;
  private requestId: number;

  constructor(config: ZatteraClientConfig) {
    this.endpoint = config.endpoint;
    this.timeout = config.timeout ?? 30000;
    this.retries = config.retries ?? 3;
    this.requestId = 0;
  }

  private getNextId(): number {
    return ++this.requestId;
  }

  /**
   * Internal method to make JSON-RPC 2.0 requests with retry logic
   */
  private async request<T>(
    method: string,
    params: unknown[] | Record<string, unknown> = {}
  ): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.getNextId(),
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as JsonRpcResponse<T>;

        if (data.error) {
          throw new Error(
            `RPC error ${data.error.code}: ${data.error.message}`
          );
        }

        if (data.result === undefined) {
          throw new Error('No result in RPC response');
        }

        return data.result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.retries) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError ?? new Error('Request failed');
  }

  /**
   * Make batch JSON-RPC requests
   */
  async batch<T = unknown>(
    requests: Array<{ method: string; params?: unknown[] | Record<string, unknown> }>
  ): Promise<T[]> {
    const batchRequest = requests.map((req) => ({
      jsonrpc: '2.0' as const,
      method: req.method,
      params: req.params ?? {},
      id: this.getNextId(),
    }));

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batchRequest),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as JsonRpcResponse<T>[];

        return data.map((item) => {
          if (item.error) {
            throw new Error(
              `RPC error ${item.error.code}: ${item.error.message}`
            );
          }
          if (item.result === undefined) {
            throw new Error('No result in RPC response');
          }
          return item.result;
        });
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));

        if (attempt < this.retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError ?? new Error('Batch request failed');
  }

  // ============================================================================
  // Generic RPC Call
  // ============================================================================

  /**
   * Generic RPC call method for custom or new API methods
   */
  async call<T>(method: string, params: unknown[] | Record<string, unknown> = {}): Promise<T> {
    return this.request<T>(method, params);
  }

  // ============================================================================
  // Database API - Global Properties
  // ============================================================================

  /**
   * Get compile-time chain configuration constants
   */
  async getConfig(): Promise<ChainConfig> {
    return this.request<ChainConfig>('database_api.get_config', {});
  }

  /**
   * Get current dynamic global properties (head block, supply, etc.)
   */
  async getDynamicGlobalProperties(): Promise<DynamicGlobalProperties> {
    return this.request<DynamicGlobalProperties>(
      'database_api.get_dynamic_global_properties',
      {}
    );
  }

  /**
   * Get active witness schedule
   */
  async getWitnessSchedule(): Promise<WitnessSchedule> {
    return this.request<WitnessSchedule>(
      'database_api.get_witness_schedule',
      {}
    );
  }

  /**
   * Get hardfork properties and version information
   */
  async getHardforkProperties(): Promise<HardforkProperties> {
    return this.request<HardforkProperties>(
      'database_api.get_hardfork_properties',
      {}
    );
  }

  /**
   * Get reward fund details
   */
  async getRewardFunds(): Promise<RewardFund[]> {
    const result = await this.request<{ funds: RewardFund[] }>('database_api.get_reward_funds', {});
    return result.funds;
  }

  /**
   * Get current median price feed
   */
  async getCurrentPriceFeed(): Promise<PriceFeed> {
    return this.request<PriceFeed>(
      'database_api.get_current_price_feed',
      {}
    );
  }

  /**
   * Get price feed history
   */
  async getFeedHistory(): Promise<FeedHistory> {
    return this.request<FeedHistory>('database_api.get_feed_history', {});
  }

  // ============================================================================
  // Database API - Witnesses
  // ============================================================================

  /**
   * List witnesses by specified order
   */
  async listWitnesses(params: ListWitnessesParams): Promise<Witness[]> {
    const result = await this.request<{ witnesses: Witness[] }>('database_api.list_witnesses', params);
    return result.witnesses;
  }

  /**
   * Find specific witnesses by account names
   */
  async findWitnesses(owners: AccountName[]): Promise<Witness[]> {
    const result = await this.request<{ witnesses: Witness[] }>('database_api.find_witnesses', {
      owners,
    });
    return result.witnesses;
  }

  /**
   * List witness votes
   */
  async listWitnessVotes(
    start: [AccountName, AccountName] | null,
    limit: number,
    order: string
  ): Promise<WitnessVote[]> {
    return this.request<WitnessVote[]>('database_api.list_witness_votes', {
      start,
      limit,
      order,
    });
  }

  /**
   * Get currently active witnesses
   */
  async getActiveWitnesses(): Promise<AccountName[]> {
    const result = await this.request<{ witnesses: AccountName[] }>(
      'database_api.get_active_witnesses',
      {}
    );
    return result.witnesses;
  }

  // ============================================================================
  // Database API - Accounts
  // ============================================================================

  /**
   * List accounts by specified order
   */
  async listAccounts(params: ListAccountsParams): Promise<Account[]> {
    const result = await this.request<{ accounts: Account[] }>('database_api.list_accounts', params);
    return result.accounts;
  }

  /**
   * Find specific accounts by names
   */
  async findAccounts(params: FindAccountsParams): Promise<Account[]> {
    const result = await this.request<{ accounts: Account[] }>('database_api.find_accounts', params);
    return result.accounts;
  }

  /**
   * List account owner authority change history
   */
  async listOwnerHistories(
    start: [AccountName, string] | null,
    limit: number
  ): Promise<OwnerHistory[]> {
    return this.request<OwnerHistory[]>(
      'database_api.list_owner_histories',
      { start, limit }
    );
  }

  /**
   * Find owner history for specific account
   */
  async findOwnerHistories(owner: AccountName): Promise<OwnerHistory[]> {
    return this.request<OwnerHistory[]>(
      'database_api.find_owner_histories',
      { owner }
    );
  }

  /**
   * List account recovery requests
   */
  async listAccountRecoveryRequests(
    start: AccountName | null,
    limit: number,
    order: string
  ): Promise<AccountRecoveryRequest[]> {
    return this.request<AccountRecoveryRequest[]>(
      'database_api.list_account_recovery_requests',
      { start, limit, order }
    );
  }

  /**
   * Find account recovery requests
   */
  async findAccountRecoveryRequests(
    accounts: AccountName[]
  ): Promise<AccountRecoveryRequest[]> {
    return this.request<AccountRecoveryRequest[]>(
      'database_api.find_account_recovery_requests',
      { accounts }
    );
  }

  /**
   * List escrows
   */
  async listEscrows(
    start: [AccountName, number] | null,
    limit: number,
    order: string
  ): Promise<Escrow[]> {
    return this.request<Escrow[]>('database_api.list_escrows', {
      start,
      limit,
      order,
    });
  }

  /**
   * Find escrows
   */
  async findEscrows(from: AccountName): Promise<Escrow[]> {
    return this.request<Escrow[]>('database_api.find_escrows', { from });
  }

  /**
   * List vesting delegations
   */
  async listVestingDelegations(
    start: [AccountName, AccountName] | null,
    limit: number,
    order: string
  ): Promise<VestingDelegation[]> {
    return this.request<VestingDelegation[]>(
      'database_api.list_vesting_delegations',
      { start, limit, order }
    );
  }

  /**
   * Find vesting delegations
   */
  async findVestingDelegations(
    account: AccountName
  ): Promise<VestingDelegation[]> {
    return this.request<VestingDelegation[]>(
      'database_api.find_vesting_delegations',
      { account }
    );
  }

  /**
   * List SBD conversion requests
   */
  async listDollarConversionRequests(
    start: [AccountName, number] | null,
    limit: number,
    order: string
  ): Promise<ConversionRequest[]> {
    return this.request<ConversionRequest[]>(
      'database_api.list_dollar_conversion_requests',
      { start, limit, order }
    );
  }

  /**
   * Find SBD conversion requests
   */
  async findDollarConversionRequests(
    account: AccountName
  ): Promise<ConversionRequest[]> {
    return this.request<ConversionRequest[]>(
      'database_api.find_dollar_conversion_requests',
      { account }
    );
  }

  // ============================================================================
  // Database API - Comments
  // ============================================================================

  /**
   * List comments by specified order
   */
  async listComments(
    start: [AccountName, string] | null,
    limit: number,
    order: string
  ): Promise<Comment[]> {
    return this.request<Comment[]>('database_api.list_comments', {
      start,
      limit,
      order,
    });
  }

  /**
   * Find specific comments
   */
  async findComments(
    comments: Array<[AccountName, string]>
  ): Promise<Comment[]> {
    return this.request<Comment[]>('database_api.find_comments', {
      comments,
    });
  }

  /**
   * List votes
   */
  async listVotes(
    start: [AccountName, AccountName, string] | null,
    limit: number,
    order: string
  ): Promise<Vote[]> {
    return this.request<Vote[]>('database_api.list_votes', {
      start,
      limit,
      order,
    });
  }

  /**
   * Find specific votes
   */
  async findVotes(
    author: AccountName,
    permlink: string
  ): Promise<Vote[]> {
    return this.request<Vote[]>('database_api.find_votes', {
      author,
      permlink,
    });
  }

  // ============================================================================
  // Database API - Market
  // ============================================================================

  /**
   * List limit orders
   */
  async listLimitOrders(
    start: [AccountName, number] | null,
    limit: number,
    order: string
  ): Promise<LimitOrder[]> {
    return this.request<LimitOrder[]>('database_api.list_limit_orders', {
      start,
      limit,
      order,
    });
  }

  /**
   * Find limit orders
   */
  async findLimitOrders(account: AccountName): Promise<LimitOrder[]> {
    return this.request<LimitOrder[]>('database_api.find_limit_orders', {
      account,
    });
  }

  /**
   * Get current order book
   */
  async getOrderBook(limit: number = 50): Promise<OrderBook> {
    return this.request<OrderBook>('database_api.get_order_book', {
      limit,
    });
  }

  // ============================================================================
  // Database API - Authority & Validation
  // ============================================================================

  /**
   * Get transaction as hex string
   */
  async getTransactionHex(trx: SignedTransaction): Promise<string> {
    return this.request<string>('database_api.get_transaction_hex', { trx });
  }

  /**
   * Get required signatures for transaction
   */
  async getRequiredSignatures(
    trx: SignedTransaction,
    availableKeys: PublicKey[]
  ): Promise<PublicKey[]> {
    return this.request<PublicKey[]>(
      'database_api.get_required_signatures',
      { trx, available_keys: availableKeys }
    );
  }

  /**
   * Get all potential signatures for transaction
   */
  async getPotentialSignatures(
    trx: SignedTransaction
  ): Promise<PublicKey[]> {
    return this.request<PublicKey[]>(
      'database_api.get_potential_signatures',
      { trx }
    );
  }

  /**
   * Verify transaction has required authority
   */
  async verifyAuthority(trx: SignedTransaction): Promise<VerifyAuthorityResult> {
    return this.request<VerifyAuthorityResult>(
      'database_api.verify_authority',
      { trx }
    );
  }

  /**
   * Verify account has authority from signers
   */
  async verifyAccountAuthority(
    account: AccountName,
    signers: PublicKey[]
  ): Promise<VerifyAuthorityResult> {
    return this.request<VerifyAuthorityResult>(
      'database_api.verify_account_authority',
      { account, signers }
    );
  }

  /**
   * Verify arbitrary signatures
   */
  async verifySignatures(
    hash: string,
    signatures: string[],
    requiredOwner: AccountName[],
    requiredActive: AccountName[],
    requiredPosting: AccountName[],
    requiredOther: PublicKey[]
  ): Promise<VerifyAuthorityResult> {
    return this.request<VerifyAuthorityResult>(
      'database_api.verify_signatures',
      {
        hash,
        signatures,
        required_owner: requiredOwner,
        required_active: requiredActive,
        required_posting: requiredPosting,
        required_other: requiredOther,
      }
    );
  }

  // ============================================================================
  // Network Broadcast API
  // ============================================================================

  /**
   * Broadcast transaction to the network
   */
  async broadcastTransaction(
    trx: SignedTransaction,
    maxBlockAge: number = -1
  ): Promise<BroadcastTransactionResult> {
    return this.request<BroadcastTransactionResult>(
      'network_broadcast_api.broadcast_transaction',
      { trx, max_block_age: maxBlockAge }
    );
  }

  /**
   * Broadcast block to the network
   */
  async broadcastBlock(block: SignedBlock): Promise<void> {
    return this.request<void>('network_broadcast_api.broadcast_block', {
      block,
    });
  }

  // ============================================================================
  // Block API
  // ============================================================================

  /**
   * Get block header by block number
   */
  async getBlockHeader(blockNum: number): Promise<SignedBlock> {
    const result = await this.request<{ header: SignedBlock }>('block_api.get_block_header', {
      block_num: blockNum,
    });
    return result.header;
  }

  /**
   * Get full block by block number
   */
  async getBlock(blockNum: number): Promise<SignedBlock> {
    const result = await this.request<{ block: SignedBlock }>('block_api.get_block', {
      block_num: blockNum,
    });
    return result.block;
  }

  // ============================================================================
  // Account History API
  // ============================================================================

  /**
   * Get operations in a specific block
   */
  async getOpsInBlock(params: GetOpsInBlockParams): Promise<unknown[]> {
    return this.request<unknown[]>('account_history_api.get_ops_in_block', params);
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(id: TransactionId): Promise<GetTransactionResult> {
    return this.request<GetTransactionResult>(
      'account_history.get_transaction',
      { id }
    );
  }

  /**
   * Get account operation history
   */
  async getAccountHistory(
    params: GetAccountHistoryParams
  ): Promise<Record<number, AccountHistoryEntry>> {
    return this.request<Record<number, AccountHistoryEntry>>(
      'account_history.get_account_history',
      params
    );
  }

  /**
   * Enumerate virtual operations in block range
   */
  async enumVirtualOps(
    blockRangeBegin: number,
    blockRangeEnd: number
  ): Promise<unknown[]> {
    return this.request<unknown[]>('account_history_api.enum_virtual_ops', {
      block_range_begin: blockRangeBegin,
      block_range_end: blockRangeEnd,
    });
  }

  // ============================================================================
  // Tags/Discussion API
  // ============================================================================

  /**
   * Get trending tags
   */
  async getTrendingTags(
    startTag: string = '',
    limit: number = 100
  ): Promise<unknown[]> {
    const result = await this.request<{ tags: unknown[] }>('tags_api.get_trending_tags', {
      start_tag: startTag,
      limit,
    });
    return result.tags;
  }

  /**
   * Get tags used by author
   */
  async getTagsUsedByAuthor(author: AccountName): Promise<unknown[]> {
    return this.request<unknown[]>('tags_api.get_tags_used_by_author', {
      author,
    });
  }

  /**
   * Get single discussion/post
   */
  async getDiscussion(
    author: AccountName,
    permlink: string
  ): Promise<Comment> {
    return this.request<Comment>('tags_api.get_discussion', {
      author,
      permlink,
    });
  }

  /**
   * Get replies to a post
   */
  async getContentReplies(
    author: AccountName,
    permlink: string
  ): Promise<Comment[]> {
    const result = await this.request<{ discussions: Comment[] }>('tags_api.get_content_replies', {
      author,
      permlink,
    });
    return result.discussions;
  }

  /**
   * Get discussions by trending
   */
  async getDiscussionsByTrending(
    query: DiscussionQuery
  ): Promise<Comment[]> {
    return this.request<Comment[]>('tags_api.get_discussions_by_trending', query);
  }

  /**
   * Get discussions by creation time
   */
  async getDiscussionsByCreated(query: DiscussionQuery): Promise<Comment[]> {
    return this.request<Comment[]>('tags_api.get_discussions_by_created', query);
  }

  /**
   * Get discussions by activity
   */
  async getDiscussionsByActive(query: DiscussionQuery): Promise<Comment[]> {
    return this.request<Comment[]>('tags_api.get_discussions_by_active', query);
  }

  /**
   * Get discussions by cashout time
   */
  async getDiscussionsByCashout(query: DiscussionQuery): Promise<Comment[]> {
    return this.request<Comment[]>('tags_api.get_discussions_by_cashout', query);
  }

  /**
   * Get discussions by votes
   */
  async getDiscussionsByVotes(query: DiscussionQuery): Promise<Comment[]> {
    return this.request<Comment[]>('tags_api.get_discussions_by_votes', query);
  }

  /**
   * Get discussions by children count
   */
  async getDiscussionsByChildren(query: DiscussionQuery): Promise<Comment[]> {
    return this.request<Comment[]>('tags_api.get_discussions_by_children', query);
  }

  /**
   * Get hot discussions
   */
  async getDiscussionsByHot(query: DiscussionQuery): Promise<Comment[]> {
    return this.request<Comment[]>('tags_api.get_discussions_by_hot', query);
  }

  /**
   * Get discussions from follower feed
   */
  async getDiscussionsByFeed(query: DiscussionQuery): Promise<Comment[]> {
    return this.request<Comment[]>('tags_api.get_discussions_by_feed', query);
  }

  /**
   * Get discussions from blog
   */
  async getDiscussionsByBlog(query: DiscussionQuery): Promise<Comment[]> {
    return this.request<Comment[]>('tags_api.get_discussions_by_blog', query);
  }

  /**
   * Get discussions by comment count
   */
  async getDiscussionsByComments(query: DiscussionQuery): Promise<Comment[]> {
    return this.request<Comment[]>('tags_api.get_discussions_by_comments', query);
  }

  /**
   * Get promoted discussions
   */
  async getDiscussionsByPromoted(query: DiscussionQuery): Promise<Comment[]> {
    return this.request<Comment[]>('tags_api.get_discussions_by_promoted', query);
  }

  /**
   * Get active votes on a post
   */
  async getActiveVotes(
    author: AccountName,
    permlink: string
  ): Promise<ActiveVote[]> {
    return this.request<ActiveVote[]>('tags_api.get_active_votes', {
      author,
      permlink,
    });
  }

  // ============================================================================
  // Follow API
  // ============================================================================

  /**
   * Get followers of an account
   */
  async getFollowers(params: GetFollowersParams): Promise<unknown[]> {
    const result = await this.request<{ followers: unknown[] }>('follow_api.get_followers', params);
    return result.followers;
  }

  /**
   * Get accounts that an account is following
   */
  async getFollowing(params: GetFollowingParams): Promise<unknown[]> {
    const result = await this.request<{ following: unknown[] }>('follow_api.get_following', params);
    return result.following;
  }

  /**
   * Get follower and following counts
   */
  async getFollowCount(account: AccountName): Promise<{
    account: AccountName;
    follower_count: number;
    following_count: number;
  }> {
    return this.request('follow_api.get_follow_count', { account });
  }

  /**
   * Get feed entries
   */
  async getFeedEntries(
    account: AccountName,
    startEntryId: number = 0,
    limit: number = 100
  ): Promise<unknown[]> {
    return this.request<unknown[]>('follow_api.get_feed_entries', {
      account,
      start_entry_id: startEntryId,
      limit,
    });
  }

  /**
   * Get feed with full comments
   */
  async getFeed(
    account: AccountName,
    startEntryId: number = 0,
    limit: number = 100
  ): Promise<Comment[]> {
    return this.request<Comment[]>('follow_api.get_feed', {
      account,
      start_entry_id: startEntryId,
      limit,
    });
  }

  /**
   * Get blog entries
   */
  async getBlogEntries(
    account: AccountName,
    startEntryId: number = 0,
    limit: number = 100
  ): Promise<unknown[]> {
    return this.request<unknown[]>('follow_api.get_blog_entries', {
      account,
      start_entry_id: startEntryId,
      limit,
    });
  }

  /**
   * Get blog with full comments
   */
  async getBlog(
    account: AccountName,
    startEntryId: number = 0,
    limit: number = 100
  ): Promise<Comment[]> {
    return this.request<Comment[]>('follow_api.get_blog', {
      account,
      start_entry_id: startEntryId,
      limit,
    });
  }

  /**
   * Get account reputation scores
   */
  async getAccountReputations(
    accountLowerBound: AccountName = '',
    limit: number = 100
  ): Promise<unknown[]> {
    return this.request<unknown[]>('follow_api.get_account_reputations', {
      account_lower_bound: accountLowerBound,
      limit,
    });
  }

  /**
   * Get accounts that reblogged a post
   */
  async getRebloggedBy(
    author: AccountName,
    permlink: string
  ): Promise<AccountName[]> {
    return this.request<AccountName[]>('follow_api.get_reblogged_by', {
      author,
      permlink,
    });
  }

  /**
   * Get blog author statistics
   */
  async getBlogAuthors(blogAccount: AccountName): Promise<unknown[]> {
    return this.request<unknown[]>('follow_api.get_blog_authors', {
      blog_account: blogAccount,
    });
  }

  // ============================================================================
  // Market History API
  // ============================================================================

  /**
   * Get market ticker
   */
  async getTicker(): Promise<Ticker> {
    return this.request<Ticker>('market_history_api.get_ticker', {});
  }

  /**
   * Get market volume
   */
  async getVolume(): Promise<Volume> {
    return this.request<Volume>('market_history_api.get_volume', {});
  }

  /**
   * Get market order book
   */
  async getMarketOrderBook(limit: number = 50): Promise<OrderBook> {
    return this.request<OrderBook>('market_history_api.get_order_book', {
      limit,
    });
  }

  /**
   * Get trade history
   */
  async getTradeHistory(
    start: string,
    end: string,
    limit: number = 100
  ): Promise<TradeHistory[]> {
    return this.request<TradeHistory[]>('market_history_api.get_trade_history', {
      start,
      end,
      limit,
    });
  }

  /**
   * Get recent trades
   */
  async getRecentTrades(limit: number = 100): Promise<TradeHistory[]> {
    return this.request<TradeHistory[]>('market_history_api.get_recent_trades', {
      limit,
    });
  }

  /**
   * Get market history buckets
   */
  async getMarketHistory(
    bucketSeconds: number,
    start: string,
    end: string
  ): Promise<MarketHistory[]> {
    return this.request<MarketHistory[]>(
      'market_history_api.get_market_history',
      {
        bucket_seconds: bucketSeconds,
        start,
        end,
      }
    );
  }

  /**
   * Get available bucket sizes
   */
  async getMarketHistoryBuckets(): Promise<number[]> {
    const result = await this.request<{ bucket_sizes: number[] }>(
      'market_history_api.get_market_history_buckets',
      {}
    );
    return result.bucket_sizes;
  }

  // ============================================================================
  // Account By Key API
  // ============================================================================

  /**
   * Get accounts that can sign with given public keys
   */
  async getKeyReferences(keys: PublicKey[]): Promise<AccountName[][]> {
    return this.request<AccountName[][]>('account_by_key_api.get_key_references', {
      keys,
    });
  }

  // ============================================================================
  // JSON-RPC Meta API
  // ============================================================================

  /**
   * Get list of all available RPC methods
   */
  async getMethods(): Promise<string[]> {
    return this.request<string[]>('jsonrpc.get_methods', {});
  }

  /**
   * Get signature (parameters and return type) for an RPC method
   */
  async getSignature(method: string): Promise<unknown> {
    return this.request<unknown>('jsonrpc.get_signature', { method });
  }
}
