/**
 * Cryptographic key utilities for Zattera blockchain
 */

import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import bs58 from 'bs58';

export class PrivateKey {
  private key: Uint8Array;

  constructor(key: Uint8Array) {
    if (key.length !== 32) {
      throw new Error('Private key must be 32 bytes');
    }
    this.key = key;
  }

  /**
   * Create PrivateKey from WIF (Wallet Import Format) string
   */
  static fromWif(wif: string): PrivateKey {
    const decoded = bs58.decode(wif);

    // Check version byte (0x80)
    if (decoded[0] !== 0x80) {
      throw new Error('Invalid WIF version byte');
    }

    // Extract private key (remove version byte and checksum)
    const privateKey = decoded.slice(1, 33);
    const checksum = decoded.slice(33, 37);

    // Verify checksum
    const hash1 = sha256(decoded.slice(0, 33));
    const hash2 = sha256(hash1);
    const expectedChecksum = hash2.slice(0, 4);

    if (!arraysEqual(checksum, expectedChecksum)) {
      throw new Error('Invalid WIF checksum');
    }

    return new PrivateKey(privateKey);
  }

  /**
   * Create PrivateKey from seed string
   */
  static fromSeed(seed: string): PrivateKey {
    const hash = sha256(new TextEncoder().encode(seed));
    return new PrivateKey(hash);
  }

  /**
   * Generate PrivateKey from account name, password and role
   */
  static fromLogin(
    accountName: string,
    password: string,
    role: string = 'active'
  ): PrivateKey {
    const seed = accountName + role + password;
    const normalized = seed.trim().replace(/\s+/g, ' ');
    return PrivateKey.fromSeed(normalized);
  }

  /**
   * Convert to WIF format
   */
  toWif(): string {
    // Add version byte (0x80)
    const versioned = new Uint8Array(33);
    versioned[0] = 0x80;
    versioned.set(this.key, 1);

    // Calculate checksum
    const hash1 = sha256(versioned);
    const hash2 = sha256(hash1);
    const checksum = hash2.slice(0, 4);

    // Concatenate and encode
    const result = new Uint8Array(37);
    result.set(versioned);
    result.set(checksum, 33);

    return bs58.encode(result);
  }

  /**
   * Get the public key
   */
  toPublic(): PublicKey {
    const publicKeyBytes = secp256k1.getPublicKey(this.key, true);
    return new PublicKey(publicKeyBytes);
  }

  /**
   * Get raw bytes
   */
  toBytes(): Uint8Array {
    return this.key;
  }

  /**
   * Sign a message hash
   */
  async sign(messageHash: Uint8Array): Promise<Signature> {
    const signature = await secp256k1.signAsync(messageHash, this.key, {
      der: false,
      recovered: true,
    });

    return new Signature(signature);
  }
}

export class PublicKey {
  private key: Uint8Array;

  constructor(key: Uint8Array) {
    if (key.length !== 33) {
      throw new Error('Compressed public key must be 33 bytes');
    }
    this.key = key;
  }

  /**
   * Create PublicKey from string (e.g., "ZTR...")
   */
  static fromString(publicKeyString: string, prefix: string = 'ZTR'): PublicKey {
    if (!publicKeyString.startsWith(prefix)) {
      throw new Error(`Public key must start with ${prefix}`);
    }

    const keyString = publicKeyString.substring(prefix.length);
    const decoded = bs58.decode(keyString);

    // Extract public key (remove checksum)
    const publicKey = decoded.slice(0, 33);
    const checksum = decoded.slice(33);

    // Verify checksum
    const hash = ripemd160(publicKey);
    const expectedChecksum = hash.slice(0, 4);

    if (!arraysEqual(checksum, expectedChecksum)) {
      throw new Error('Invalid public key checksum');
    }

    return new PublicKey(publicKey);
  }

  /**
   * Convert to string format (e.g., "ZTR...")
   */
  toString(prefix: string = 'ZTR'): string {
    const checksum = ripemd160(this.key).slice(0, 4);
    const result = new Uint8Array(37);
    result.set(this.key);
    result.set(checksum, 33);

    return prefix + bs58.encode(result);
  }

  /**
   * Get raw bytes
   */
  toBytes(): Uint8Array {
    return this.key;
  }

  /**
   * Verify a signature
   */
  async verify(messageHash: Uint8Array, signature: Signature): Promise<boolean> {
    try {
      return secp256k1.verify(signature.toCompact(), messageHash, this.key);
    } catch {
      return false;
    }
  }
}

export class Signature {
  private sig: Uint8Array;
  private recovery: number;

  constructor(sig: Uint8Array | { signature: Uint8Array; recovery: number }) {
    if (sig instanceof Uint8Array) {
      // Compact format: 65 bytes (recovery + r + s)
      if (sig.length !== 65) {
        throw new Error('Signature must be 65 bytes');
      }
      this.recovery = sig[0] - 27;
      this.sig = sig.slice(1);
    } else {
      // From secp256k1.signAsync result
      this.sig = sig.signature;
      this.recovery = sig.recovery;
    }
  }

  /**
   * Get compact signature (65 bytes: recovery + r + s)
   */
  toCompact(): Uint8Array {
    return this.sig;
  }

  /**
   * Get full signature with recovery parameter (65 bytes)
   */
  toBuffer(): Uint8Array {
    const result = new Uint8Array(65);
    result[0] = this.recovery + 27;
    result.set(this.sig, 1);
    return result;
  }

  /**
   * Recover public key from signature and message hash
   */
  async recoverPublicKey(messageHash: Uint8Array): Promise<PublicKey> {
    const publicKeyBytes = secp256k1.recoverPublicKey(
      messageHash,
      this.sig,
      this.recovery,
      true
    );
    return new PublicKey(publicKeyBytes);
  }
}

/**
 * Helper function to compare two Uint8Arrays
 */
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Generate all account keys from account name and password
 */
export function generateKeys(
  accountName: string,
  password: string,
  roles: string[] = ['owner', 'active', 'posting', 'memo']
): Record<string, { private: string; public: string }> {
  const keys: Record<string, { private: string; public: string }> = {};

  for (const role of roles) {
    const privateKey = PrivateKey.fromLogin(accountName, password, role);
    const publicKey = privateKey.toPublic();

    keys[role] = {
      private: privateKey.toWif(),
      public: publicKey.toString(),
    };
  }

  return keys;
}

/**
 * Check if a string is a valid WIF private key
 */
export function isWif(wif: string): boolean {
  try {
    PrivateKey.fromWif(wif);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a string is a valid public key
 */
export function isPublicKey(publicKey: string, prefix: string = 'ZTR'): boolean {
  try {
    PublicKey.fromString(publicKey, prefix);
    return true;
  } catch {
    return false;
  }
}
