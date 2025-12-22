# Zattera JS

TypeScript library for Zattera blockchain RPC calls. Works in both browser and Node.js environments with 100% ESM support.

## Features

- **100% TypeScript** with full type safety
- **Zero runtime dependencies** - uses native Fetch API
- **Cross-platform** - works in both browser and Node.js (18+)
- **ESM-only** - modern module system
- **Built with Vite** for optimal performance
- **JSON-RPC 2.0** protocol compliant
- **Automatic retry logic** with exponential backoff
- **Batch requests** support
- **Comprehensive test coverage** with Vitest
- **Complete Zattera RPC API** implementation

## Installation

```bash
npm install zattera-js
```

## Quick Start

### Node.js (ESM)

```typescript
import { ZatteraClient } from 'zattera-js';

const client = new ZatteraClient({
  endpoint: 'https://rpc.zattera.network',
  timeout: 30000,  // optional, default: 30000ms
  retries: 3,      // optional, default: 3
});

// Get dynamic global properties
const props = await client.getDynamicGlobalProperties();
console.log('Head block:', props.head_block_number);

// Get account information
const accounts = await client.findAccounts({ accounts: ['alice'] });
console.log('Account:', accounts[0]);

// Get block
const block = await client.getBlock(12345);
console.log('Block:', block);
```

### Browser

```typescript
import { ZatteraClient } from 'zattera-js';

const client = new ZatteraClient({
  endpoint: 'https://rpc.zattera.network',
});

const props = await client.getDynamicGlobalProperties();
console.log('Current block:', props.head_block_number);
```

## API Reference

### Constructor

```typescript
new ZatteraClient(config: ZatteraClientConfig)
```

**Config options:**
- `endpoint` (string, required): RPC endpoint URL
- `timeout` (number, optional): Request timeout in milliseconds (default: 30000)
- `retries` (number, optional): Number of retry attempts (default: 3)

### Core Methods

#### Generic RPC Call

```typescript
call<T>(method: string, params?: unknown[] | Record<string, unknown>): Promise<T>
```

Makes a generic JSON-RPC call with the specified method and parameters.

#### Batch Requests

```typescript
batch<T>(requests: Array<{method: string, params?: unknown[]}>): Promise<T[]>
```

Execute multiple RPC requests in a single batch call for better performance.

**Example:**
```typescript
const [props, witnesses] = await client.batch([
  { method: 'database_api.get_dynamic_global_properties' },
  { method: 'database_api.get_active_witnesses' }
]);
```

## Database API

### Global Properties

#### `getConfig(): Promise<ChainConfig>`

Get compile-time chain configuration constants.

#### `getDynamicGlobalProperties(): Promise<DynamicGlobalProperties>`

Get current dynamic global properties (head block, supply, etc.)

**Example:**
```typescript
const props = await client.getDynamicGlobalProperties();
console.log('Head block:', props.head_block_number);
console.log('Last irreversible block:', props.last_irreversible_block_num);
```

#### `getWitnessSchedule(): Promise<WitnessSchedule>`

Get active witness schedule.

#### `getHardforkProperties(): Promise<HardforkProperties>`

Get hardfork properties and version information.

#### `getRewardFunds(): Promise<RewardFund[]>`

Get reward fund details.

#### `getCurrentPriceFeed(): Promise<PriceFeed>`

Get current median price feed.

#### `getFeedHistory(): Promise<FeedHistory>`

Get price feed history.

### Accounts

#### `listAccounts(params: ListAccountsParams): Promise<Account[]>`

List accounts by specified order.

**Example:**
```typescript
import { ListOrder } from 'zattera-js';

const accounts = await client.listAccounts({
  start: null,
  limit: 100,
  order: ListOrder.BY_NAME
});
```

#### `findAccounts(params: FindAccountsParams): Promise<Account[]>`

Find specific accounts by names.

**Example:**
```typescript
const accounts = await client.findAccounts({
  accounts: ['alice', 'bob', 'charlie']
});
```

#### `listOwnerHistories(start, limit): Promise<OwnerHistory[]>`

List account owner authority change history.

#### `findOwnerHistories(owner): Promise<OwnerHistory[]>`

Find owner history for specific account.

#### `listAccountRecoveryRequests(start, limit, order): Promise<AccountRecoveryRequest[]>`

List account recovery requests.

#### `findAccountRecoveryRequests(accounts): Promise<AccountRecoveryRequest[]>`

Find account recovery requests.

#### `listEscrows(start, limit, order): Promise<Escrow[]>`

List escrows.

#### `findEscrows(from): Promise<Escrow[]>`

Find escrows for an account.

#### `listVestingDelegations(start, limit, order): Promise<VestingDelegation[]>`

List vesting delegations.

#### `findVestingDelegations(account): Promise<VestingDelegation[]>`

Find vesting delegations for an account.

#### `listDollarConversionRequests(start, limit, order): Promise<ConversionRequest[]>`

List SBD conversion requests.

#### `findDollarConversionRequests(account): Promise<ConversionRequest[]>`

Find SBD conversion requests for an account.

### Witnesses

#### `listWitnesses(params: ListWitnessesParams): Promise<Witness[]>`

List witnesses by specified order.

#### `findWitnesses(owners: AccountName[]): Promise<Witness[]>`

Find specific witnesses by account names.

#### `listWitnessVotes(start, limit, order): Promise<WitnessVote[]>`

List witness votes.

#### `getActiveWitnesses(): Promise<AccountName[]>`

Get currently active witnesses.

**Example:**
```typescript
const witnesses = await client.getActiveWitnesses();
console.log('Active witnesses:', witnesses);
```

### Comments & Discussions

#### `listComments(start, limit, order): Promise<Comment[]>`

List comments by specified order.

#### `findComments(comments): Promise<Comment[]>`

Find specific comments.

#### `listVotes(start, limit, order): Promise<Vote[]>`

List votes.

#### `findVotes(author, permlink): Promise<Vote[]>`

Find specific votes on a post.

### Market

#### `listLimitOrders(start, limit, order): Promise<LimitOrder[]>`

List limit orders.

#### `findLimitOrders(account): Promise<LimitOrder[]>`

Find limit orders for an account.

#### `getOrderBook(limit?): Promise<OrderBook>`

Get current order book.

### Authority & Validation

#### `getTransactionHex(trx): Promise<string>`

Get transaction as hex string.

#### `getRequiredSignatures(trx, availableKeys): Promise<PublicKey[]>`

Get required signatures for transaction.

#### `getPotentialSignatures(trx): Promise<PublicKey[]>`

Get all potential signatures for transaction.

#### `verifyAuthority(trx): Promise<VerifyAuthorityResult>`

Verify transaction has required authority.

#### `verifyAccountAuthority(account, signers): Promise<VerifyAuthorityResult>`

Verify account has authority from signers.

#### `verifySignatures(hash, signatures, ...): Promise<VerifyAuthorityResult>`

Verify arbitrary signatures.

## Network Broadcast API

#### `broadcastTransaction(trx, maxBlockAge?): Promise<BroadcastTransactionResult>`

Broadcast transaction to the network.

**Example:**
```typescript
const result = await client.broadcastTransaction(signedTx);
console.log('Transaction ID:', result.id);
console.log('Block number:', result.block_num);
```

#### `broadcastBlock(block): Promise<void>`

Broadcast block to the network.

## Block API

#### `getBlockHeader(blockNum): Promise<SignedBlock>`

Get block header by block number.

#### `getBlock(blockNum): Promise<SignedBlock>`

Get full block by block number.

**Example:**
```typescript
const block = await client.getBlock(12345);
console.log('Witness:', block.witness);
console.log('Transactions:', block.transactions.length);
```

## Account History API

#### `getOpsInBlock(params): Promise<unknown[]>`

Get operations in a specific block.

**Example:**
```typescript
const ops = await client.getOpsInBlock({
  block_num: 12345,
  only_virtual: false
});
```

#### `getTransaction(id): Promise<GetTransactionResult>`

Get transaction by ID.

#### `getAccountHistory(params): Promise<Record<number, AccountHistoryEntry>>`

Get account operation history.

**Example:**
```typescript
const history = await client.getAccountHistory({
  account: 'alice',
  start: -1,
  limit: 100
});
```

#### `enumVirtualOps(blockRangeBegin, blockRangeEnd): Promise<unknown[]>`

Enumerate virtual operations in block range.

## Tags/Discussion API

#### `getTrendingTags(startTag?, limit?): Promise<unknown[]>`

Get trending tags.

#### `getTagsUsedByAuthor(author): Promise<unknown[]>`

Get tags used by author.

#### `getDiscussion(author, permlink): Promise<Comment>`

Get single discussion/post.

**Example:**
```typescript
const post = await client.getDiscussion('alice', 'my-first-post');
console.log('Title:', post.title);
console.log('Body:', post.body);
```

#### `getContentReplies(author, permlink): Promise<Comment[]>`

Get replies to a post.

#### Discussion Queries

All discussion query methods accept a `DiscussionQuery` parameter:

```typescript
interface DiscussionQuery {
  tag?: string;
  limit?: number;
  filter_tags?: string[];
  select_authors?: AccountName[];
  select_tags?: string[];
  truncate_body?: number;
  start_author?: AccountName;
  start_permlink?: string;
}
```

**Methods:**
- `getDiscussionsByTrending(query): Promise<Comment[]>`
- `getDiscussionsByCreated(query): Promise<Comment[]>`
- `getDiscussionsByActive(query): Promise<Comment[]>`
- `getDiscussionsByCashout(query): Promise<Comment[]>`
- `getDiscussionsByVotes(query): Promise<Comment[]>`
- `getDiscussionsByChildren(query): Promise<Comment[]>`
- `getDiscussionsByHot(query): Promise<Comment[]>`
- `getDiscussionsByFeed(query): Promise<Comment[]>`
- `getDiscussionsByBlog(query): Promise<Comment[]>`
- `getDiscussionsByComments(query): Promise<Comment[]>`
- `getDiscussionsByPromoted(query): Promise<Comment[]>`

**Example:**
```typescript
const trending = await client.getDiscussionsByTrending({
  tag: 'technology',
  limit: 10
});
```

#### `getActiveVotes(author, permlink): Promise<ActiveVote[]>`

Get active votes on a post.

## Follow API

#### `getFollowers(params): Promise<unknown[]>`

Get followers of an account.

**Example:**
```typescript
const followers = await client.getFollowers({
  account: 'alice',
  start: null,
  type: 'blog',
  limit: 100
});
```

#### `getFollowing(params): Promise<unknown[]>`

Get accounts that an account is following.

#### `getFollowCount(account): Promise<{account, follower_count, following_count}>`

Get follower and following counts.

#### `getFeedEntries(account, startEntryId?, limit?): Promise<unknown[]>`

Get feed entries.

#### `getFeed(account, startEntryId?, limit?): Promise<Comment[]>`

Get feed with full comments.

#### `getBlogEntries(account, startEntryId?, limit?): Promise<unknown[]>`

Get blog entries.

#### `getBlog(account, startEntryId?, limit?): Promise<Comment[]>`

Get blog with full comments.

#### `getAccountReputations(accountLowerBound?, limit?): Promise<unknown[]>`

Get account reputation scores.

#### `getRebloggedBy(author, permlink): Promise<AccountName[]>`

Get accounts that reblogged a post.

#### `getBlogAuthors(blogAccount): Promise<unknown[]>`

Get blog author statistics.

## Market History API

#### `getTicker(): Promise<Ticker>`

Get market ticker.

#### `getVolume(): Promise<Volume>`

Get market volume.

#### `getMarketOrderBook(limit?): Promise<OrderBook>`

Get market order book.

#### `getTradeHistory(start, end, limit?): Promise<TradeHistory[]>`

Get trade history.

#### `getRecentTrades(limit?): Promise<TradeHistory[]>`

Get recent trades.

#### `getMarketHistory(bucketSeconds, start, end): Promise<MarketHistory[]>`

Get market history buckets.

#### `getMarketHistoryBuckets(): Promise<Bucket[]>`

Get available bucket sizes.

## Account By Key API

#### `getKeyReferences(keys): Promise<AccountName[][]>`

Get accounts that can sign with given public keys.

## JSON-RPC Meta API

#### `getMethods(): Promise<string[]>`

Get list of all available RPC methods.

#### `getSignature(method): Promise<unknown>`

Get signature (parameters and return type) for an RPC method.

## Types

The library exports comprehensive TypeScript types for all API methods:

```typescript
import {
  ZatteraClient,
  Account,
  Witness,
  Comment,
  SignedBlock,
  SignedTransaction,
  DynamicGlobalProperties,
  ListOrder,
  // ... and many more
} from 'zattera-js';
```

## Error Handling

The client automatically handles:
- Network errors with retry logic (exponential backoff)
- Timeout errors (configurable timeout)
- JSON-RPC errors (with error codes and messages)

```typescript
try {
  const result = await client.getBlock(12345);
} catch (error) {
  console.error('RPC call failed:', error.message);
}
```

## Development

### Setup

```bash
npm install
```

### Build

```bash
# Build all targets (Node.js + browser + types)
npm run build

# Build Node.js version only
npm run build:node

# Build browser version only
npm run build:browser

# Generate TypeScript declarations
npm run build:types

# Development mode with watch
npm run dev
```

### Testing

```bash
# Run tests once
npm test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui
```

### Type Checking

```bash
npm run type-check
```

## Project Structure

```
zattera-js/
├── src/
│   ├── client/         # RPC client implementation
│   │   ├── index.ts    # Client class with all API methods
│   │   └── index.test.ts  # Comprehensive tests
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts    # All type exports
│   └── index.ts        # Main entry point
├── dist/
│   ├── browser/        # Browser build (bundled & minified)
│   ├── node/           # Node.js build (preserveModules)
│   └── types/          # TypeScript declarations
├── vite.config.browser.ts  # Browser build config
├── vite.config.node.ts     # Node.js build config
├── vitest.config.ts        # Test config
└── tsconfig.json           # TypeScript config
```

## Requirements

- Node.js 18 or higher (for native Fetch API support)
- Modern browser with Fetch API support

## License

MIT - See LICENSE file for details

## Contributing

Contributions are welcome! Please ensure:
1. All tests pass (`npm test`)
2. Code follows TypeScript strict mode
3. ESM compatibility is maintained
4. Both browser and Node.js builds work
5. Update documentation for new features

## Links

- [Project Documentation](./CLAUDE.md)
- [Zattera Protocol](https://github.com/zattera-protocol/zattera)
