/**
 * Memo encryption/decryption for Zattera blockchain
 * Based on ECIES (Elliptic Curve Integrated Encryption Scheme)
 */

import { sha256, sha512 } from '@noble/hashes/sha2';
import * as aes from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import bs58 from 'bs58';
import { PrivateKey, PublicKey } from './keys.js';

/**
 * Generate a random nonce
 * @param size Size of nonce in bytes (default: 8)
 * @returns Random nonce
 */
function generateNonce(size: number = 8): Uint8Array {
  return randomBytes(size);
}

/**
 * Encode a memo for encryption
 * @param privateKey Sender's private key
 * @param publicKey Recipient's public key
 * @param memo Memo text (will be prefixed with # if not already)
 * @param nonce Optional nonce for testing (default: random)
 * @returns Encrypted memo string with # prefix
 *
 * @example
 * ```typescript
 * const senderKey = PrivateKey.fromSeed('sender seed');
 * const recipientPubKey = PrivateKey.fromSeed('recipient seed').toPublic();
 * const encrypted = await encodeMemo(senderKey, recipientPubKey, 'Hello!');
 * // Returns: "#<base58_encoded_encrypted_data>"
 * ```
 */
export function encodeMemo(
  privateKey: PrivateKey,
  publicKey: PublicKey,
  memo: string,
  nonce?: Uint8Array
): string {
  // If memo doesn't start with #, it's not encrypted
  if (!memo.startsWith('#')) {
    memo = '#' + memo;
  }

  // Remove the # prefix for encryption
  const message = memo.slice(1);
  const messageBytes = new TextEncoder().encode(message);

  // Generate or use provided nonce
  const nonceBytes = nonce ?? generateNonce(8);

  // Get shared secret using ECDH
  const sharedSecret = privateKey.getSharedSecret(publicKey);

  // Derive encryption key and IV from shared secret and nonce
  // Key derivation: SHA512(nonce || shared_secret)
  const combined = new Uint8Array(nonceBytes.length + sharedSecret.length);
  combined.set(nonceBytes);
  combined.set(sharedSecret, nonceBytes.length);

  const hash = sha512(combined);

  // Split hash into IV (first 16 bytes) and key (next 32 bytes)
  const iv = hash.slice(0, 16);
  const encryptionKey = hash.slice(16, 48);

  // Encrypt the message
  const cipher = aes.cbc(encryptionKey, iv);
  const encrypted = cipher.encrypt(messageBytes);

  // Calculate checksum (first 4 bytes of SHA256 of encryption key)
  const checksumHash = sha256(encryptionKey);
  const checksum = checksumHash.slice(0, 4);

  // Serialize: nonce (8 bytes) + checksum (4 bytes) + encrypted data
  const serialized = new Uint8Array(nonceBytes.length + checksum.length + encrypted.length);
  serialized.set(nonceBytes, 0);
  serialized.set(checksum, nonceBytes.length);
  serialized.set(encrypted, nonceBytes.length + checksum.length);

  // Encode to base58 and add # prefix
  return '#' + bs58.encode(serialized);
}

/**
 * Decode an encrypted memo
 *
 * Note: This function is deprecated. Use decodeMemoWithKey instead, as it requires
 * the sender's public key to properly decrypt the memo.
 *
 * @param _privateKey Recipient's private key (unused)
 * @param memo Encrypted memo string (must start with #)
 * @returns Never - throws error directing to use decodeMemoWithKey
 * @deprecated Use decodeMemoWithKey instead
 */
export function decodeMemo(_privateKey: PrivateKey, memo: string): string {
  // If memo doesn't start with #, it's not encrypted
  if (!memo.startsWith('#')) {
    return memo;
  }

  throw new Error('decodeMemo requires sender public key - use decodeMemoWithKey instead');
}

/**
 * Decode an encrypted memo with explicit public key
 * @param privateKey Recipient's private key
 * @param publicKey Sender's public key
 * @param memo Encrypted memo string (must start with #)
 * @returns Decrypted memo text (with # prefix)
 *
 * @example
 * ```typescript
 * const recipientKey = PrivateKey.fromSeed('recipient seed');
 * const senderPubKey = PrivateKey.fromSeed('sender seed').toPublic();
 * const decrypted = await decodeMemoWithKey(recipientKey, senderPubKey, encryptedMemo);
 * // Returns: "#Hello!"
 * ```
 */
export function decodeMemoWithKey(
  privateKey: PrivateKey,
  publicKey: PublicKey,
  memo: string
): string {
  // If memo doesn't start with #, it's not encrypted
  if (!memo.startsWith('#')) {
    return memo;
  }

  try {
    // Remove # prefix and decode from base58
    const decoded = bs58.decode(memo.slice(1));

    // Extract components
    const nonce = decoded.slice(0, 8);
    const checksum = decoded.slice(8, 12);
    const encrypted = decoded.slice(12);

    // Get shared secret using ECDH
    const sharedSecret = privateKey.getSharedSecret(publicKey);

    // Derive encryption key and IV
    const combined = new Uint8Array(nonce.length + sharedSecret.length);
    combined.set(nonce);
    combined.set(sharedSecret, nonce.length);

    const hash = sha512(combined);
    const iv = hash.slice(0, 16);
    const encryptionKey = hash.slice(16, 48);

    // Verify checksum
    const checksumHash = sha256(encryptionKey);
    const expectedChecksum = checksumHash.slice(0, 4);

    let checksumValid = true;
    for (let i = 0; i < 4; i++) {
      if (checksum[i] !== expectedChecksum[i]) {
        checksumValid = false;
        break;
      }
    }

    if (!checksumValid) {
      throw new Error('Invalid memo checksum');
    }

    // Decrypt the message
    const decipher = aes.cbc(encryptionKey, iv);
    const decrypted = decipher.decrypt(encrypted);

    // Convert to string and add # prefix
    const message = new TextDecoder().decode(decrypted);
    return '#' + message;
  } catch (error) {
    throw new Error(`Failed to decode memo: ${error instanceof Error ? error.message : String(error)}`);
  }
}
