/**
 * Transaction serialization for Zattera blockchain
 */

import type { Transaction, Operation } from '../types/index.js';

/**
 * Simple binary serializer for transactions
 */
export class TransactionSerializer {
  private buffer: number[] = [];

  /**
   * Write a uint8 (1 byte)
   */
  writeUInt8(value: number): void {
    this.buffer.push(value & 0xff);
  }

  /**
   * Write a uint16 (2 bytes, little-endian)
   */
  writeUInt16(value: number): void {
    this.buffer.push(value & 0xff);
    this.buffer.push((value >> 8) & 0xff);
  }

  /**
   * Write a uint32 (4 bytes, little-endian)
   */
  writeUInt32(value: number): void {
    this.buffer.push(value & 0xff);
    this.buffer.push((value >> 8) & 0xff);
    this.buffer.push((value >> 16) & 0xff);
    this.buffer.push((value >> 24) & 0xff);
  }

  /**
   * Write a uint64 (8 bytes, little-endian)
   */
  writeUInt64(value: number | bigint): void {
    const bigValue = typeof value === 'number' ? BigInt(value) : value;
    for (let i = 0; i < 8; i++) {
      this.buffer.push(Number((bigValue >> BigInt(i * 8)) & BigInt(0xff)));
    }
  }

  /**
   * Write variable-length integer
   */
  writeVarint32(value: number): void {
    while (value >= 0x80) {
      this.buffer.push((value & 0x7f) | 0x80);
      value >>= 7;
    }
    this.buffer.push(value & 0x7f);
  }

  /**
   * Write a string
   */
  writeString(value: string): void {
    const bytes = new TextEncoder().encode(value);
    this.writeVarint32(bytes.length);
    for (const byte of bytes) {
      this.buffer.push(byte);
    }
  }

  /**
   * Write bytes
   */
  writeBytes(bytes: Uint8Array): void {
    for (const byte of bytes) {
      this.buffer.push(byte);
    }
  }

  /**
   * Write array with length prefix
   */
  writeArray<T>(arr: T[], writeItem: (item: T) => void): void {
    this.writeVarint32(arr.length);
    for (const item of arr) {
      writeItem(item);
    }
  }

  /**
   * Get the serialized buffer
   */
  toBuffer(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Serialize a transaction (without signatures)
 */
export function serializeTransaction(tx: Transaction): Uint8Array {
  const serializer = new TransactionSerializer();

  // ref_block_num (uint16)
  serializer.writeUInt16(tx.ref_block_num);

  // ref_block_prefix (uint32)
  serializer.writeUInt32(tx.ref_block_prefix);

  // expiration (uint32 - seconds since epoch)
  const expirationDate = new Date(tx.expiration);
  const expirationSeconds = Math.floor(expirationDate.getTime() / 1000);
  serializer.writeUInt32(expirationSeconds);

  // operations array
  serializer.writeArray(tx.operations, (op: Operation) => {
    serializeOperation(serializer, op);
  });

  // extensions array (usually empty)
  serializer.writeArray(tx.extensions, (ext: unknown) => {
    // For now, we'll serialize extensions as opaque data
    // In practice, this is usually an empty array
    if (typeof ext === 'object' && ext !== null) {
      serializer.writeString(JSON.stringify(ext));
    }
  });

  return serializer.toBuffer();
}

/**
 * Serialize an operation
 * Operations are in format: [operation_type_id, operation_data]
 */
function serializeOperation(serializer: TransactionSerializer, operation: Operation): void {
  if (!Array.isArray(operation) || operation.length !== 2) {
    throw new Error('Invalid operation format');
  }

  const [opType, opData] = operation;

  // Write operation type (assuming it's a string or number)
  if (typeof opType === 'number') {
    serializer.writeVarint32(opType);
  } else if (typeof opType === 'string') {
    // Map operation names to IDs (this would need to be complete)
    const opId = getOperationId(opType);
    serializer.writeVarint32(opId);
  }

  // Serialize operation data
  // This is a simplified version - full implementation would need
  // specific serialization logic for each operation type
  serializeOperationData(serializer, opData);
}

/**
 * Get operation ID from operation name
 * This is a simplified mapping - would need to be complete
 */
function getOperationId(opName: string): number {
  const operationIds: Record<string, number> = {
    vote: 0,
    comment: 1,
    transfer: 2,
    transfer_to_vesting: 3,
    withdraw_vesting: 4,
    limit_order_create: 5,
    limit_order_cancel: 6,
    feed_publish: 7,
    convert: 8,
    account_create: 9,
    account_update: 10,
    witness_update: 11,
    account_witness_vote: 12,
    account_witness_proxy: 13,
    // ... more operations
  };

  return operationIds[opName] ?? -1;
}

/**
 * Serialize operation data
 * This is a simplified version that handles basic types
 */
function serializeOperationData(serializer: TransactionSerializer, data: unknown): void {
  if (data === null || data === undefined) {
    return;
  }

  if (typeof data === 'string') {
    serializer.writeString(data);
  } else if (typeof data === 'number') {
    serializer.writeUInt32(data);
  } else if (typeof data === 'boolean') {
    serializer.writeUInt8(data ? 1 : 0);
  } else if (typeof data === 'object') {
    // For objects, serialize each field
    // This would need proper field ordering based on operation type
    for (const value of Object.values(data)) {
      serializeOperationData(serializer, value);
    }
  }
}

/**
 * Serialize a signed transaction (with signatures)
 */
export function serializeSignedTransaction(tx: Transaction & { signatures?: Uint8Array[] }): Uint8Array {
  const serializer = new TransactionSerializer();

  // Serialize the transaction part
  const txBytes = serializeTransaction(tx);
  serializer.writeBytes(txBytes);

  // Serialize signatures
  if (tx.signatures) {
    serializer.writeArray(tx.signatures, (sig: Uint8Array) => {
      serializer.writeBytes(sig);
    });
  } else {
    serializer.writeVarint32(0); // Empty signatures array
  }

  return serializer.toBuffer();
}
