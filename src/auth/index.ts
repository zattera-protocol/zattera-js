/**
 * Authentication and transaction signing for Zattera blockchain
 */

import { sha256 } from '@noble/hashes/sha256';
import { PrivateKey, PublicKey, Signature } from './keys.js';
import { serializeTransaction } from './serializer.js';
import type { Transaction, SignedTransaction } from '../types/index.js';

export * from './keys.js';
export * from './serializer.js';

/**
 * Configuration for signing
 */
export interface SignConfig {
  chainId: string;
  addressPrefix?: string;
}

/**
 * Sign a transaction with one or more private keys
 *
 * @param transaction The transaction to sign
 * @param privateKeys Array of private keys (WIF format) or PrivateKey instances
 * @param chainId Chain ID (hex string without 0x prefix)
 * @returns Signed transaction with signatures
 *
 * @example
 * ```typescript
 * const signedTx = await signTransaction(
 *   transaction,
 *   ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'],
 *   '0000000000000000000000000000000000000000000000000000000000000000'
 * );
 * ```
 */
export async function signTransaction(
  transaction: Transaction,
  privateKeys: (string | PrivateKey)[],
  chainId: string
): Promise<SignedTransaction> {
  // Serialize the transaction (without signatures)
  const txBuffer = serializeTransaction(transaction);

  // Convert chain ID from hex to bytes
  const chainIdBytes = hexToBytes(chainId);

  // Create the digest: chainId + serialized transaction
  const digest = new Uint8Array(chainIdBytes.length + txBuffer.length);
  digest.set(chainIdBytes);
  digest.set(txBuffer, chainIdBytes.length);

  // Hash the digest with SHA-256
  const messageHash = sha256(digest);

  // Sign with each private key
  const signatures: string[] = [];

  for (const key of privateKeys) {
    const privateKey = typeof key === 'string' ? PrivateKey.fromWif(key) : key;
    const signature = await privateKey.sign(messageHash);
    signatures.push(bufferToHex(signature.toBuffer()));
  }

  // Return signed transaction
  return {
    ...transaction,
    signatures,
  };
}

/**
 * Verify a transaction signature
 *
 * @param transaction The signed transaction
 * @param chainId Chain ID (hex string without 0x prefix)
 * @returns Array of public keys that signed the transaction
 */
export async function verifyTransactionSignatures(
  transaction: SignedTransaction,
  chainId: string
): Promise<PublicKey[]> {
  // Serialize the transaction (without signatures)
  const { signatures, ...txWithoutSigs } = transaction;
  const txBuffer = serializeTransaction(txWithoutSigs);

  // Create the digest
  const chainIdBytes = hexToBytes(chainId);
  const digest = new Uint8Array(chainIdBytes.length + txBuffer.length);
  digest.set(chainIdBytes);
  digest.set(txBuffer, chainIdBytes.length);

  // Hash the digest
  const messageHash = sha256(digest);

  // Recover public keys from signatures
  const publicKeys: PublicKey[] = [];

  for (const sigHex of signatures) {
    const sigBytes = hexToBytes(sigHex);
    const signature = new Signature(sigBytes);
    const publicKey = await signature.recoverPublicKey(messageHash);
    publicKeys.push(publicKey);
  }

  return publicKeys;
}

/**
 * Create a transaction ready for signing
 *
 * @param refBlockNum Reference block number (from head_block_number & 0xFFFF)
 * @param refBlockPrefix Reference block prefix (from block header)
 * @param expiration Expiration date (ISO 8601 string or Date)
 * @param operations Array of operations
 * @returns Transaction object ready for signing
 *
 * @example
 * ```typescript
 * const tx = createTransaction(
 *   12345,
 *   4567890,
 *   new Date(Date.now() + 60000),
 *   [
 *     ['vote', { voter: 'alice', author: 'bob', permlink: 'test', weight: 10000 }]
 *   ]
 * );
 * ```
 */
export function createTransaction(
  refBlockNum: number,
  refBlockPrefix: number,
  expiration: string | Date,
  operations: unknown[]
): Transaction {
  const expirationString = typeof expiration === 'string'
    ? expiration
    : expiration.toISOString().split('.')[0]; // Remove milliseconds

  return {
    ref_block_num: refBlockNum & 0xffff, // Ensure it's within uint16 range
    ref_block_prefix: refBlockPrefix >>> 0, // Ensure it's uint32
    expiration: expirationString,
    operations,
    extensions: [],
  };
}

/**
 * Helper: Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  // Remove '0x' prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Helper: Convert Uint8Array to hex string
 */
function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
