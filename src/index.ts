/**
 * Zattera JS - TypeScript library for Zattera blockchain RPC calls
 * @packageDocumentation
 */

export { ZatteraClient } from './client/index.js';

// Auth & Cryptography
export {
  PrivateKey,
  PublicKey,
  Signature,
  generateKeys,
  isWif,
  isPublicKey,
  signTransaction,
  verifyTransactionSignatures,
  createTransaction,
  serializeTransaction,
  serializeSignedTransaction,
  TransactionSerializer,
} from './auth/index.js';

export type { SignConfig } from './auth/index.js';

// Core Types
export type {
  ZatteraClientConfig,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  RpcMethod,
  RpcParams,
  AccountName,
  BlockId,
  TransactionId,
  Signature,
  PublicKey,
  PrivateKey,
  ShareType,
  AssetSymbol,
  Asset,
  Price,
  Operation,
} from './types/index.js';

// JSON-RPC Error Codes
export { JsonRpcErrorCode } from './types/index.js';

// Transaction & Block Types
export type {
  Transaction,
  SignedTransaction,
  BlockHeader,
  SignedBlockHeader,
  SignedBlock,
} from './types/index.js';

// Database API Types
export type {
  DynamicGlobalProperties,
  ChainConfig,
  WitnessSchedule,
  HardforkProperties,
  RewardFund,
  PriceFeed,
  FeedHistory,
  Account,
  Authority,
  OwnerHistory,
  AccountRecoveryRequest,
  Escrow,
  VestingDelegation,
  ConversionRequest,
  Comment,
  Beneficiary,
  ActiveVote,
  Vote,
  Witness,
  WitnessVote,
  LimitOrder,
  OrderBook,
  Order,
} from './types/index.js';

// Query Parameter Types
export type {
  ListAccountsParams,
  FindAccountsParams,
  ListWitnessesParams,
  GetAccountHistoryParams,
  GetOpsInBlockParams,
  DiscussionQuery,
  GetFollowersParams,
  GetFollowingParams,
} from './types/index.js';

// API Response Types
export type {
  BroadcastTransactionResult,
  VerifyAuthorityResult,
  GetTransactionResult,
  AccountHistoryEntry,
  Ticker,
  Volume,
  TradeHistory,
  MarketHistory,
  Bucket,
} from './types/index.js';

// Enums
export { ListOrder } from './types/index.js';
