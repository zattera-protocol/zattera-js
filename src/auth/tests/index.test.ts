import { describe, it, expect } from 'vitest';
import {
  PrivateKey,
  PublicKey,
  generateKeys,
  isWif,
  isPublicKey,
  signTransaction,
  verifyTransactionSignatures,
  createTransaction,
  Auth,
  encodeMemo,
  decodeMemoWithKey,
} from '../index.js';

describe('PrivateKey', () => {
  it('should create private key from seed', () => {
    const key = PrivateKey.fromSeed('test seed');
    expect(key).toBeInstanceOf(PrivateKey);
  });

  it('should create private key from login credentials', () => {
    const key = PrivateKey.fromLogin('alice', 'password123', 'active');
    expect(key).toBeInstanceOf(PrivateKey);
  });

  it('should convert to and from WIF', () => {
    const key = PrivateKey.fromSeed('test seed');
    const wif = key.toWif();
    expect(typeof wif).toBe('string');
    expect(wif).toMatch(/^5[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/);

    const restored = PrivateKey.fromWif(wif);
    expect(restored.toWif()).toBe(wif);
  });

  it('should derive public key', () => {
    const privateKey = PrivateKey.fromSeed('test seed');
    const publicKey = privateKey.toPublic();
    expect(publicKey).toBeInstanceOf(PublicKey);
  });

  it('should sign messages', async () => {
    const privateKey = PrivateKey.fromSeed('test seed');
    const message = new Uint8Array(32).fill(1);
    const signature = await privateKey.sign(message);
    expect(signature).toBeDefined();
    expect(signature.toBuffer()).toHaveLength(65);
  });
});

describe('PublicKey', () => {
  it('should convert to and from string', () => {
    const privateKey = PrivateKey.fromSeed('test seed');
    const publicKey = privateKey.toPublic();

    const publicKeyString = publicKey.toString('ZTR');
    expect(typeof publicKeyString).toBe('string');
    expect(publicKeyString).toMatch(/^ZTR[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/);

    const restored = PublicKey.fromString(publicKeyString, 'ZTR');
    expect(restored.toString('ZTR')).toBe(publicKeyString);
  });

  it('should verify signatures', async () => {
    const privateKey = PrivateKey.fromSeed('test seed');
    const publicKey = privateKey.toPublic();
    const message = new Uint8Array(32).fill(1);

    const signature = await privateKey.sign(message);
    const isValid = await publicKey.verify(message, signature);

    expect(isValid).toBe(true);
  });

  it('should reject invalid signatures', async () => {
    const privateKey1 = PrivateKey.fromSeed('test seed 1');
    const privateKey2 = PrivateKey.fromSeed('test seed 2');
    const publicKey1 = privateKey1.toPublic();
    const message = new Uint8Array(32).fill(1);

    const signature = await privateKey2.sign(message);
    const isValid = await publicKey1.verify(message, signature);

    expect(isValid).toBe(false);
  });
});

describe('generateKeys', () => {
  it('should generate all role keys from account and password', () => {
    const keys = generateKeys('alice', 'password123');

    expect(keys).toHaveProperty('owner');
    expect(keys).toHaveProperty('active');
    expect(keys).toHaveProperty('posting');
    expect(keys).toHaveProperty('memo');

    expect(keys.owner).toHaveProperty('private');
    expect(keys.owner).toHaveProperty('public');
    expect(typeof keys.owner.private).toBe('string');
    expect(typeof keys.owner.public).toBe('string');
  });

  it('should generate different keys for different roles', () => {
    const keys = generateKeys('alice', 'password123');

    expect(keys.owner.private).not.toBe(keys.active.private);
    expect(keys.active.private).not.toBe(keys.posting.private);
    expect(keys.posting.private).not.toBe(keys.memo.private);
  });

  it('should generate same keys for same inputs', () => {
    const keys1 = generateKeys('alice', 'password123');
    const keys2 = generateKeys('alice', 'password123');

    expect(keys1.owner.private).toBe(keys2.owner.private);
    expect(keys1.active.private).toBe(keys2.active.private);
  });

  it('should generate different keys for different accounts', () => {
    const keysAlice = generateKeys('alice', 'password123');
    const keysBob = generateKeys('bob', 'password123');

    expect(keysAlice.active.private).not.toBe(keysBob.active.private);
  });
});

describe('isWif', () => {
  it('should validate WIF keys', () => {
    const key = PrivateKey.fromSeed('test seed');
    const wif = key.toWif();

    expect(isWif(wif)).toBe(true);
  });

  it('should reject invalid WIF keys', () => {
    expect(isWif('invalid')).toBe(false);
    expect(isWif('5InvalidWifKey')).toBe(false);
    expect(isWif('')).toBe(false);
  });
});

describe('isPublicKey', () => {
  it('should validate public keys', () => {
    const privateKey = PrivateKey.fromSeed('test seed');
    const publicKey = privateKey.toPublic();
    const publicKeyString = publicKey.toString('ZTR');

    expect(isPublicKey(publicKeyString, 'ZTR')).toBe(true);
  });

  it('should reject invalid public keys', () => {
    expect(isPublicKey('invalid', 'ZTR')).toBe(false);
    expect(isPublicKey('ZTRInvalidKey', 'ZTR')).toBe(false);
    expect(isPublicKey('', 'ZTR')).toBe(false);
  });
});

describe('createTransaction', () => {
  it('should create a transaction', () => {
    const tx = createTransaction(
      12345,
      4567890,
      new Date('2024-01-01T12:00:00Z'),
      [
        ['vote', { voter: 'alice', author: 'bob', permlink: 'test', weight: 10000 }]
      ]
    );

    expect(tx.ref_block_num).toBe(12345);
    expect(tx.ref_block_prefix).toBe(4567890);
    expect(tx.expiration).toMatch(/2024-01-01T12:00:00/);
    expect(tx.operations).toHaveLength(1);
    expect(tx.extensions).toHaveLength(0);
  });

  it('should handle ISO string expiration', () => {
    const tx = createTransaction(
      123,
      456,
      '2024-01-01T12:00:00',
      []
    );

    expect(tx.expiration).toBe('2024-01-01T12:00:00');
  });
});

describe('signTransaction', () => {
  it('should sign a transaction with a private key', async () => {
    const tx = createTransaction(
      12345,
      4567890,
      new Date('2024-01-01T12:00:00Z'),
      [
        ['vote', { voter: 'alice', author: 'bob', permlink: 'test', weight: 10000 }]
      ]
    );

    const privateKey = PrivateKey.fromSeed('test seed');
    const chainId = '0000000000000000000000000000000000000000000000000000000000000000';

    const signedTx = await signTransaction(tx, [privateKey], chainId);

    expect(signedTx).toHaveProperty('signatures');
    expect(signedTx.signatures).toHaveLength(1);
    expect(typeof signedTx.signatures[0]).toBe('string');
  });

  it('should sign with multiple keys', async () => {
    const tx = createTransaction(
      12345,
      4567890,
      new Date('2024-01-01T12:00:00Z'),
      []
    );

    const key1 = PrivateKey.fromSeed('test seed 1');
    const key2 = PrivateKey.fromSeed('test seed 2');
    const chainId = '0000000000000000000000000000000000000000000000000000000000000000';

    const signedTx = await signTransaction(tx, [key1, key2], chainId);

    expect(signedTx.signatures).toHaveLength(2);
  });

  it('should accept WIF format keys', async () => {
    const tx = createTransaction(
      12345,
      4567890,
      new Date('2024-01-01T12:00:00Z'),
      []
    );

    const privateKey = PrivateKey.fromSeed('test seed');
    const wif = privateKey.toWif();
    const chainId = '0000000000000000000000000000000000000000000000000000000000000000';

    const signedTx = await signTransaction(tx, [wif], chainId);

    expect(signedTx.signatures).toHaveLength(1);
  });
});

describe('verifyTransactionSignatures', () => {
  it('should recover public keys from signed transaction', async () => {
    const tx = createTransaction(
      12345,
      4567890,
      new Date('2024-01-01T12:00:00Z'),
      []
    );

    const privateKey = PrivateKey.fromSeed('test seed');
    const expectedPublicKey = privateKey.toPublic();
    const chainId = '0000000000000000000000000000000000000000000000000000000000000000';

    const signedTx = await signTransaction(tx, [privateKey], chainId);
    const recoveredKeys = await verifyTransactionSignatures(signedTx, chainId);

    expect(recoveredKeys).toHaveLength(1);
    expect(recoveredKeys[0].toString()).toBe(expectedPublicKey.toString());
  });

  it('should recover multiple public keys', async () => {
    const tx = createTransaction(
      12345,
      4567890,
      new Date('2024-01-01T12:00:00Z'),
      []
    );

    const key1 = PrivateKey.fromSeed('test seed 1');
    const key2 = PrivateKey.fromSeed('test seed 2');
    const pubKey1 = key1.toPublic();
    const pubKey2 = key2.toPublic();
    const chainId = '0000000000000000000000000000000000000000000000000000000000000000';

    const signedTx = await signTransaction(tx, [key1, key2], chainId);
    const recoveredKeys = await verifyTransactionSignatures(signedTx, chainId);

    expect(recoveredKeys).toHaveLength(2);
    expect(recoveredKeys[0].toString()).toBe(pubKey1.toString());
    expect(recoveredKeys[1].toString()).toBe(pubKey2.toString());
  });
});

describe('Auth API', () => {
  it('should generate private keys for all roles', () => {
    const keys = Auth.getPrivateKeys('alice', 'password123');

    expect(keys).toHaveProperty('owner');
    expect(keys).toHaveProperty('ownerPubkey');
    expect(keys).toHaveProperty('active');
    expect(keys).toHaveProperty('activePubkey');
    expect(keys).toHaveProperty('posting');
    expect(keys).toHaveProperty('postingPubkey');
    expect(keys).toHaveProperty('memo');
    expect(keys).toHaveProperty('memoPubkey');

    expect(typeof keys.owner).toBe('string');
    expect(typeof keys.ownerPubkey).toBe('string');
    expect(keys.owner).toMatch(/^5[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/);
    expect(keys.ownerPubkey).toMatch(/^ZTR[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/);
  });

  it('should generate public keys only', () => {
    const keys = Auth.generateKeys('alice', 'password123');

    expect(keys).toHaveProperty('owner');
    expect(keys).toHaveProperty('active');
    expect(keys).toHaveProperty('posting');
    expect(keys).toHaveProperty('memo');

    expect(keys).not.toHaveProperty('ownerPubkey');
    expect(typeof keys.owner).toBe('string');
    expect(keys.owner).toMatch(/^ZTR[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/);
  });

  it('should convert credentials to WIF', () => {
    const wif = Auth.toWif('alice', 'password123', 'active');

    expect(typeof wif).toBe('string');
    expect(wif).toMatch(/^5[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/);
    expect(Auth.isWif(wif)).toBe(true);
  });

  it('should convert WIF to public key', () => {
    const wif = Auth.toWif('alice', 'password123', 'active');
    const pubKey = Auth.wifToPublic(wif);

    expect(typeof pubKey).toBe('string');
    expect(pubKey).toMatch(/^ZTR[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/);
  });

  it('should verify valid credentials', () => {
    const keys = Auth.getPrivateKeys('alice', 'password123');

    const auths = {
      active: [keys.activePubkey],
    };

    const isValid = Auth.verify('alice', 'password123', auths, 'active');
    expect(isValid).toBe(true);
  });

  it('should reject invalid credentials', () => {
    const keys = Auth.getPrivateKeys('alice', 'password123');

    const auths = {
      active: [keys.activePubkey],
    };

    const isValid = Auth.verify('alice', 'wrongpassword', auths, 'active');
    expect(isValid).toBe(false);
  });

  it('should generate consistent keys', () => {
    const keys1 = Auth.getPrivateKeys('alice', 'password123');
    const keys2 = Auth.getPrivateKeys('alice', 'password123');

    expect(keys1.active).toBe(keys2.active);
    expect(keys1.activePubkey).toBe(keys2.activePubkey);
  });
});

describe('Memo Encryption', () => {
  it('should encrypt and decrypt memos', async () => {
    const senderKey = PrivateKey.fromSeed('sender seed');
    const recipientKey = PrivateKey.fromSeed('recipient seed');
    const recipientPubKey = recipientKey.toPublic();

    const originalMemo = 'Hello, this is a secret message!';
    const encrypted = await encodeMemo(senderKey, recipientPubKey, originalMemo);

    expect(encrypted).toMatch(/^#[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/);
    expect(encrypted).not.toContain(originalMemo);

    const senderPubKey = senderKey.toPublic();
    const decrypted = await decodeMemoWithKey(recipientKey, senderPubKey, encrypted);

    expect(decrypted).toBe('#' + originalMemo);
  });

  it('should handle memos with # prefix', async () => {
    const senderKey = PrivateKey.fromSeed('sender seed');
    const recipientKey = PrivateKey.fromSeed('recipient seed');
    const recipientPubKey = recipientKey.toPublic();

    const originalMemo = '#Already has prefix';
    const encrypted = await encodeMemo(senderKey, recipientPubKey, originalMemo);

    const senderPubKey = senderKey.toPublic();
    const decrypted = await decodeMemoWithKey(recipientKey, senderPubKey, encrypted);

    expect(decrypted).toBe(originalMemo);
  });

  it('should return unencrypted memos as-is', async () => {
    const recipientKey = PrivateKey.fromSeed('recipient seed');
    const senderPubKey = PrivateKey.fromSeed('sender seed').toPublic();

    const unencryptedMemo = 'This is not encrypted';
    const result = await decodeMemoWithKey(recipientKey, senderPubKey, unencryptedMemo);

    expect(result).toBe(unencryptedMemo);
  });

  it('should produce consistent encryption with same nonce', async () => {
    const senderKey = PrivateKey.fromSeed('sender seed');
    const recipientKey = PrivateKey.fromSeed('recipient seed');
    const recipientPubKey = recipientKey.toPublic();

    const nonce = new Uint8Array(8).fill(42);
    const memo = 'Test message';

    const encrypted1 = await encodeMemo(senderKey, recipientPubKey, memo, nonce);
    const encrypted2 = await encodeMemo(senderKey, recipientPubKey, memo, nonce);

    expect(encrypted1).toBe(encrypted2);
  });
});

describe('PrivateKey Advanced Features', () => {
  it('should generate shared secret', () => {
    const key1 = PrivateKey.fromSeed('key1 seed');
    const key2 = PrivateKey.fromSeed('key2 seed');

    const pubKey1 = key1.toPublic();
    const pubKey2 = key2.toPublic();

    const secret1 = key1.getSharedSecret(pubKey2);
    const secret2 = key2.getSharedSecret(pubKey1);

    expect(secret1).toBeInstanceOf(Uint8Array);
    expect(secret2).toBeInstanceOf(Uint8Array);
    expect(secret1).toEqual(secret2); // Shared secrets should match
    expect(secret1.length).toBe(32); // Should be 32 bytes
  });

  it('should derive child keys', () => {
    const parentKey = PrivateKey.fromSeed('parent seed');
    const childKey1 = parentKey.child('offset1');
    const childKey2 = parentKey.child('offset2');

    expect(childKey1).toBeInstanceOf(PrivateKey);
    expect(childKey2).toBeInstanceOf(PrivateKey);
    expect(childKey1.toWif()).not.toBe(childKey2.toWif());
    expect(childKey1.toWif()).not.toBe(parentKey.toWif());
  });

  it('should derive same child key with same offset', () => {
    const parentKey = PrivateKey.fromSeed('parent seed');
    const childKey1 = parentKey.child('offset1');
    const childKey2 = parentKey.child('offset1');

    expect(childKey1.toWif()).toBe(childKey2.toWif());
  });
});
