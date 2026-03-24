import crypto from 'crypto';

/**
 * 4D Hyperchaotic System for secure medical image encryption.
 * Based on the logic described in the paper:
 * dx/dt = a(y - x) + w
 * dy/dt = cx - xz + y
 * dz/dt = xy - bz
 * dw/dt = -kw + yz
 */
export class HyperchaoticSystem {
  private a = 35.0;
  private b = 3.0;
  private c = 35.0;
  private k = 5.0;
  private dt = 0.001;

  /**
   * Generates initial conditions from a biometric vector using HMAC-SHA512.
   */
  static generateSeeds(biometricVector: Float32Array, systemKey: string): number[] {
    const hmac = crypto.createHmac('sha512', systemKey);
    hmac.update(Buffer.from(biometricVector.buffer));
    const hash = hmac.digest();

    const seeds: number[] = [];
    for (let i = 0; i < 4; i++) {
      const uint64 = hash.readBigUInt64BE(i * 8);
      // Map to [-1, 1]
      seeds.push(Number(uint64) / Number(BigInt('18446744073709551615')) * 2 - 1);
    }
    return seeds;
  }

  /**
   * Runs the 4D Hyperchaotic system to generate a keystream.
   */
  generateKeystream(seeds: number[], length: number): { seqX: Float64Array; seqKey: Uint8Array } {
    let [x, y, z, w] = seeds;
    const seqX = new Float64Array(length);
    const seqKey = new Uint8Array(length);

    // Discard transient phase (first 2048 iterations)
    for (let i = 0; i < 2048 + length; i++) {
      const dx = this.a * (y - x) + w;
      const dy = this.c * x - x * z + y;
      const dz = x * y - this.b * z;
      const dw = -this.k * w + y * z;

      x += dx * this.dt;
      y += dy * this.dt;
      z += dz * this.dt;
      w += dw * this.dt;

      if (i >= 2048) {
        const idx = i - 2048;
        seqX[idx] = x;
        seqKey[idx] = Math.floor(Math.abs(y) * 10 ** 5) % 256;
      }
    }

    return { seqX, seqKey };
  }

  /**
   * DNA-inspired Confusion and Diffusion.
   */
  encrypt(data: Buffer, seqX: Float64Array, seqKey: Uint8Array): Buffer {
    const length = data.length;
    
    // 1. Confusion: Fisher-Yates shuffle based on chaotic sequence
    const confused = Buffer.from(data);
    for (let i = length - 1; i > 0; i--) {
      const rand = Math.floor(Math.abs(seqX[i]) * 1000000);
      const j = rand % (i + 1);
      
      const temp = confused[i];
      confused[i] = confused[j];
      confused[j] = temp;
    }

    // 2. Diffusion: XOR with keystream and previous encrypted byte
    const encrypted = Buffer.alloc(length);
    encrypted[0] = confused[0] ^ seqKey[0];
    for (let i = 1; i < length; i++) {
      encrypted[i] = confused[i] ^ seqKey[i] ^ encrypted[i - 1];
    }

    return encrypted;
  }

  decrypt(encrypted: Buffer, seqX: Float64Array, seqKey: Uint8Array): Buffer {
    const length = encrypted.length;
    
    // 1. Reverse Diffusion
    const confused = Buffer.alloc(length);
    confused[0] = encrypted[0] ^ seqKey[0];
    for (let i = 1; i < length; i++) {
      confused[i] = encrypted[i] ^ seqKey[i] ^ encrypted[i - 1];
    }

    // 2. Reverse Confusion: Reverse Fisher-Yates shuffle
    const original = Buffer.from(confused);
    for (let i = 1; i < length; i++) {
      const rand = Math.floor(Math.abs(seqX[i]) * 1000000);
      const j = rand % (i + 1);
      
      const temp = original[i];
      original[i] = original[j];
      original[j] = temp;
    }

    return original;
  }
}
