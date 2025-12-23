/**
 * Zattera RPC Types
 */

// ============================================================================
// Client Configuration
// ============================================================================

/**
 * Supported network names for chain ID computation
 */
export type NetworkName = 'zattera' | 'testnet';

export interface ZatteraClientConfig {
  endpoint: string;
  networkName?: NetworkName;
  timeout?: number;
  retries?: number;
}

// ============================================================================
// JSON-RPC 2.0 Protocol Types
// ============================================================================

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown[] | Record<string, unknown>;
  id: string | number;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  result?: T;
  error?: JsonRpcError;
  id: string | number | null;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export type RpcMethod = string;
export type RpcParams = unknown[];

// JSON-RPC Error Codes
export enum JsonRpcErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  SERVER_ERROR = -32000,
  NO_PARAMS = -32001,
  PARSE_PARAMS_ERROR = -32002,
  ERROR_DURING_CALL = -32003,
}

// ============================================================================
// Core Protocol Types
// ============================================================================

export type AccountName = string;
export type BlockId = string;
export type TransactionId = string;
export type Signature = string;
export type PublicKey = string;
export type PrivateKey = string;
export type ShareType = string; // int64 as string to avoid precision loss
export type AssetSymbol = string;

export interface Asset {
  amount: ShareType;
  symbol: AssetSymbol;
  precision: number;
}

export interface Price {
  base: Asset;
  quote: Asset;
}

// ============================================================================
// Transaction Types
// ============================================================================

export interface Transaction {
  ref_block_num: number;
  ref_block_prefix: number;
  expiration: string; // ISO 8601 datetime
  operations: Operation[];
  extensions: unknown[];
}

export interface SignedTransaction extends Transaction {
  signatures: Signature[];
}

export type Operation = unknown[]; // [operation_type, operation_data]

// ============================================================================
// Block Types
// ============================================================================

export interface BlockHeader {
  previous: BlockId;
  timestamp: string;
  witness: AccountName;
  transaction_merkle_root: string;
  extensions: unknown[];
}

export interface SignedBlockHeader extends BlockHeader {
  witness_signature: Signature;
}

export interface SignedBlock extends SignedBlockHeader {
  transactions: SignedTransaction[];
  block_id?: BlockId;
  signing_key?: PublicKey;
  transaction_ids?: TransactionId[];
}

// ============================================================================
// Database API Types
// ============================================================================

export interface DynamicGlobalProperties {
  id: number;
  head_block_number: number;
  head_block_id: BlockId;
  time: string;
  current_witness: AccountName;
  total_pow: number;
  num_pow_witnesses: number;
  virtual_supply: Asset;
  current_supply: Asset;
  init_sbd_supply: Asset;
  current_sbd_supply: Asset;
  total_vesting_fund_steem: Asset;
  total_vesting_shares: Asset;
  total_reward_fund_steem: Asset;
  total_reward_shares2: string;
  pending_rewarded_vesting_shares: Asset;
  pending_rewarded_vesting_steem: Asset;
  sbd_interest_rate: number;
  sbd_print_rate: number;
  maximum_block_size: number;
  required_actions_partition_percent: number;
  current_aslot: number;
  recent_slots_filled: string;
  participation_count: number;
  last_irreversible_block_num: number;
  vote_power_reserve_rate: number;
  delegation_return_period: number;
  reverse_auction_seconds: number;
  available_account_subsidies: number;
  sbd_stop_percent: number;
  sbd_start_percent: number;
  next_maintenance_time: string;
  last_budget_time: string;
  content_reward_percent: number;
  vesting_reward_percent: number;
  sps_fund_percent: number;
  sps_interval_ledger: Asset;
  downvote_pool_percent: number;
}

export interface ChainConfig {
  ZATTERA_CHAIN_ID: string;
  ZATTERA_ADDRESS_PREFIX: string;
  ZATTERA_GENESIS_TIME: string;
  ZATTERA_MINING_TIME: string;
  ZATTERA_MIN_ACCOUNT_NAME_LENGTH: number;
  ZATTERA_MAX_ACCOUNT_NAME_LENGTH: number;
  ZATTERA_MIN_PERMLINK_LENGTH: number;
  ZATTERA_MAX_PERMLINK_LENGTH: number;
  ZATTERA_BLOCK_INTERVAL: number;
  ZATTERA_BLOCKS_PER_YEAR: number;
  ZATTERA_BLOCKS_PER_DAY: number;
  ZATTERA_START_VESTING_BLOCK: number;
  ZATTERA_INIT_MINER_NAME: string;
  ZATTERA_NUM_INIT_MINERS: number;
  ZATTERA_INIT_TIME: string;
  ZATTERA_MAX_WITNESSES: number;
  ZATTERA_MAX_VOTED_WITNESSES_HF0: number;
  ZATTERA_MAX_MINER_WITNESSES_HF0: number;
  ZATTERA_MAX_RUNNER_WITNESSES_HF0: number;
  [key: string]: unknown;
}

export interface WitnessSchedule {
  id: number;
  current_virtual_time: string;
  next_shuffle_block_num: number;
  current_shuffled_witnesses: AccountName[];
  num_scheduled_witnesses: number;
  elected_weight: number;
  timeshare_weight: number;
  miner_weight: number;
  witness_pay_normalization_factor: number;
  median_props: {
    account_creation_fee: Asset;
    maximum_block_size: number;
    sbd_interest_rate: number;
  };
  majority_version: string;
  max_voted_witnesses: number;
  max_miner_witnesses: number;
  max_runner_witnesses: number;
  hardfork_required_witnesses: number;
  account_subsidy_budget: number;
  account_subsidy_decay: number;
}

export interface HardforkProperties {
  id: number;
  processed_hardforks: string[];
  last_hardfork: number;
  current_hardfork_version: string;
  next_hardfork: string;
  next_hardfork_time: string;
}

export interface RewardFund {
  id: number;
  name: string;
  reward_balance: Asset;
  recent_claims: string;
  last_update: string;
  content_constant: string;
  percent_curation_rewards: number;
  percent_content_rewards: number;
  author_reward_curve: string;
  curation_reward_curve: string;
}

export interface PriceFeed {
  base: Asset;
  quote: Asset;
}

export interface FeedHistory {
  id: number;
  current_median_history: Price;
  market_median_history: Price;
  current_min_history: Price;
  current_max_history: Price;
  price_history: Price[];
}

// ============================================================================
// Account Types
// ============================================================================

export interface Account {
  id: number;
  name: AccountName;
  owner: Authority;
  active: Authority;
  posting: Authority;
  memo_key: PublicKey;
  json_metadata: string;
  posting_json_metadata: string;
  proxy: AccountName;
  last_owner_update: string;
  last_account_update: string;
  created: string;
  mined: boolean;
  recovery_account: AccountName;
  reset_account: AccountName;
  last_account_recovery: string;
  comment_count: number;
  lifetime_vote_count: number;
  post_count: number;
  can_vote: boolean;
  voting_manabar: {
    current_mana: string;
    last_update_time: number;
  };
  downvote_manabar: {
    current_mana: string;
    last_update_time: number;
  };
  balance: Asset;
  savings_balance: Asset;
  sbd_balance: Asset;
  sbd_seconds: string;
  sbd_seconds_last_update: string;
  sbd_last_interest_payment: string;
  savings_sbd_balance: Asset;
  savings_sbd_seconds: string;
  savings_sbd_seconds_last_update: string;
  savings_sbd_last_interest_payment: string;
  savings_withdraw_requests: number;
  reward_sbd_balance: Asset;
  reward_steem_balance: Asset;
  reward_vesting_balance: Asset;
  reward_vesting_steem: Asset;
  vesting_shares: Asset;
  delegated_vesting_shares: Asset;
  received_vesting_shares: Asset;
  vesting_withdraw_rate: Asset;
  post_voting_power: Asset;
  next_vesting_withdrawal: string;
  withdrawn: number;
  to_withdraw: number;
  withdraw_routes: number;
  pending_transfers: number;
  curation_rewards: number;
  posting_rewards: number;
  proxied_vsf_votes: number[];
  witnesses_voted_for: number;
  last_post: string;
  last_root_post: string;
  last_vote_time: string;
  post_bandwidth: number;
  pending_claimed_accounts: number;
  delayed_votes: unknown[];
  open_recurrent_transfers: number;
  vesting_balance: Asset;
  reputation: string;
  transfer_history: unknown[];
  market_history: unknown[];
  post_history: unknown[];
  vote_history: unknown[];
  other_history: unknown[];
  witness_votes: AccountName[];
  tags_usage: unknown[];
  guest_bloggers: AccountName[];
}

export interface Authority {
  weight_threshold: number;
  account_auths: [AccountName, number][];
  key_auths: [PublicKey, number][];
}

export interface OwnerHistory {
  id: number;
  account: AccountName;
  previous_owner_authority: Authority;
  last_valid_time: string;
}

export interface AccountRecoveryRequest {
  id: number;
  account_to_recover: AccountName;
  new_owner_authority: Authority;
  expires: string;
}

export interface Escrow {
  id: number;
  escrow_id: number;
  from: AccountName;
  to: AccountName;
  agent: AccountName;
  ratification_deadline: string;
  escrow_expiration: string;
  sbd_balance: Asset;
  steem_balance: Asset;
  pending_fee: Asset;
  to_approved: boolean;
  agent_approved: boolean;
  disputed: boolean;
}

export interface VestingDelegation {
  id: number;
  delegator: AccountName;
  delegatee: AccountName;
  vesting_shares: Asset;
  min_delegation_time: string;
}

export interface ConversionRequest {
  id: number;
  owner: AccountName;
  requestid: number;
  amount: Asset;
  conversion_date: string;
}

// ============================================================================
// Comment/Discussion Types
// ============================================================================

export interface Comment {
  id: number;
  author: AccountName;
  permlink: string;
  category: string;
  parent_author: AccountName;
  parent_permlink: string;
  title: string;
  body: string;
  json_metadata: string;
  last_update: string;
  created: string;
  active: string;
  last_payout: string;
  depth: number;
  children: number;
  net_rshares: string;
  abs_rshares: string;
  vote_rshares: string;
  children_abs_rshares: string;
  cashout_time: string;
  max_cashout_time: string;
  total_vote_weight: number;
  reward_weight: number;
  total_payout_value: Asset;
  curator_payout_value: Asset;
  author_rewards: number;
  net_votes: number;
  root_author: AccountName;
  root_permlink: string;
  max_accepted_payout: Asset;
  percent_steem_dollars: number;
  allow_replies: boolean;
  allow_votes: boolean;
  allow_curation_rewards: boolean;
  beneficiaries: Beneficiary[];
  url: string;
  root_title: string;
  pending_payout_value: Asset;
  total_pending_payout_value: Asset;
  active_votes: ActiveVote[];
  replies: string[];
  author_reputation: string;
  promoted: Asset;
  body_length: number;
  reblogged_by: AccountName[];
}

export interface Beneficiary {
  account: AccountName;
  weight: number;
}

export interface ActiveVote {
  voter: AccountName;
  weight: number;
  rshares: string;
  percent: number;
  reputation: string;
  time: string;
}

export interface Vote {
  id: number;
  voter: AccountName;
  author: AccountName;
  permlink: string;
  weight: number;
  rshares: string;
  vote_percent: number;
  last_update: string;
  num_changes: number;
}

// ============================================================================
// Witness Types
// ============================================================================

export interface Witness {
  id: number;
  owner: AccountName;
  created: string;
  url: string;
  votes: string;
  virtual_last_update: string;
  virtual_position: string;
  virtual_scheduled_time: string;
  total_missed: number;
  last_aslot: number;
  last_confirmed_block_num: number;
  pow_worker: number;
  signing_key: PublicKey;
  props: {
    account_creation_fee: Asset;
    maximum_block_size: number;
    sbd_interest_rate: number;
    account_subsidy_budget: number;
    account_subsidy_decay: number;
  };
  sbd_exchange_rate: Price;
  last_sbd_exchange_update: string;
  last_work: string;
  running_version: string;
  hardfork_version_vote: string;
  hardfork_time_vote: string;
  available_witness_account_subsidies: number;
}

export interface WitnessVote {
  id: number;
  witness: AccountName;
  account: AccountName;
}

// ============================================================================
// Market Types
// ============================================================================

export interface LimitOrder {
  id: number;
  created: string;
  expiration: string;
  seller: AccountName;
  orderid: number;
  for_sale: number;
  sell_price: Price;
}

export interface OrderBook {
  bids: Order[];
  asks: Order[];
}

export interface Order {
  order_price: Price;
  real_price: string;
  steem: number;
  sbd: number;
  created: string;
}

// ============================================================================
// List/Find Query Types
// ============================================================================

export enum ListOrder {
  BY_NAME = 'by_name',
  BY_PROXY = 'by_proxy',
  BY_NEXT_VESTING_WITHDRAWAL = 'by_next_vesting_withdrawal',
  BY_ACCOUNT = 'by_account',
  BY_EXPIRATION = 'by_expiration',
  BY_EFFECTIVE_DATE = 'by_effective_date',
  BY_VOTE = 'by_vote',
  BY_ACCOUNT_WITNESS = 'by_account_witness',
  BY_WITNESS_ACCOUNT = 'by_witness_account',
  BY_FROM_ID = 'by_from_id',
  BY_RATIFICATION_DEADLINE = 'by_ratification_deadline',
  BY_WITHDRAW_ROUTE = 'by_withdraw_route',
  BY_DESTINATION = 'by_destination',
  BY_COMPLETE_FROM_ID = 'by_complete_from_id',
  BY_TO_COMPLETE = 'by_to_complete',
  BY_DELEGATION = 'by_delegation',
  BY_ACCOUNT_EXPIRATION = 'by_account_expiration',
  BY_CONVERSION_DATE = 'by_conversion_date',
  BY_CASHOUT_TIME = 'by_cashout_time',
  BY_PERMLINK = 'by_permlink',
  BY_ROOT = 'by_root',
  BY_PARENT = 'by_parent',
  BY_LAST_UPDATE = 'by_last_update',
  BY_AUTHOR_LAST_UPDATE = 'by_author_last_update',
  BY_COMMENT_VOTER = 'by_comment_voter',
  BY_VOTER_COMMENT = 'by_voter_comment',
  BY_PRICE = 'by_price',
  BY_ACCOUNT_CREATION = 'by_account_creation',
}

// ============================================================================
// API Method Parameters
// ============================================================================

export interface ListAccountsParams {
  start?: AccountName | null;
  limit: number;
  order: ListOrder;
  [key: string]: unknown;
}

export interface FindAccountsParams {
  accounts: AccountName[];
  [key: string]: unknown;
}

export interface ListWitnessesParams {
  start?: AccountName | null;
  limit: number;
  order: ListOrder;
  [key: string]: unknown;
}

export interface GetAccountHistoryParams {
  account: AccountName;
  start: number;
  limit: number;
  [key: string]: unknown;
}

export interface GetOpsInBlockParams {
  block_num: number;
  only_virtual: boolean;
  [key: string]: unknown;
}

export interface DiscussionQuery {
  tag?: string;
  limit?: number;
  filter_tags?: string[];
  select_authors?: AccountName[];
  select_tags?: string[];
  truncate_body?: number;
  start_author?: AccountName;
  start_permlink?: string;
  parent_author?: AccountName;
  parent_permlink?: string;
  [key: string]: unknown;
}

export interface GetFollowersParams {
  account: AccountName;
  start: AccountName | null;
  type: string;
  limit: number;
  [key: string]: unknown;
}

export interface GetFollowingParams {
  account: AccountName;
  start: AccountName | null;
  type: string;
  limit: number;
  [key: string]: unknown;
}

// ============================================================================
// API Method Return Types
// ============================================================================

export interface BroadcastTransactionResult {
  id: TransactionId;
  block_num: number;
  trx_num: number;
  expired: boolean;
}

export interface VerifyAuthorityResult {
  valid: boolean;
}

export interface GetTransactionResult {
  ref_block_num: number;
  ref_block_prefix: number;
  expiration: string;
  operations: Operation[];
  extensions: unknown[];
  signatures: Signature[];
  transaction_id: TransactionId;
  block_num: number;
  transaction_num: number;
}

export interface AccountHistoryEntry {
  trx_id: TransactionId;
  block: number;
  trx_in_block: number;
  op_in_trx: number;
  virtual_op: number;
  timestamp: string;
  op: Operation;
}

export interface Ticker {
  latest: string;
  lowest_ask: string;
  highest_bid: string;
  percent_change: string;
  steem_volume: Asset;
  sbd_volume: Asset;
}

export interface Volume {
  steem_volume: Asset;
  sbd_volume: Asset;
}

export interface TradeHistory {
  date: string;
  current_pays: Asset;
  open_pays: Asset;
}

export interface MarketHistory {
  id: number;
  open: string;
  high: string;
  low: string;
  close: string;
  steem_volume: Asset;
  sbd_volume: Asset;
}

export interface Bucket {
  bucket_size: number;
}
