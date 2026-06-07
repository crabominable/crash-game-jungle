import { randomBytes, createHash } from "crypto"

export interface ProvablyFairResult {
  algorithmVersion: string
  crashMultiplierBasisPoints: number
  serverSeed: string
  serverSeedHash: string
}

export class ProvablyFair {
  static readonly ALGORITHM_VERSION = "1.0"

  static generateServerSeed(): string {
    return randomBytes(32).toString("hex")
  }

  static hashServerSeed(seed: string): string {
    return createHash("sha256").update(seed).digest("hex")
  }

  static calculateCrashMultiplier(serverSeed: string): number {
    const hash = createHash("sha256").update(serverSeed).digest("hex")

    // Extract first 13 characters of the hex string (52 bits)
    const seedExtract = hash.slice(0, 13)
    const h = Number.parseInt(seedExtract, 16)

    // E = 2^52
    const e = 2 ** 52

    // 3% house edge (multiplier 1.00x if condition is met)
    if (h % 33 === 0) {
      return 10000 // 1.00x
    }

    // Formula: (100 * E - h) / (E - h)
    // To get Basis Points (where 10000 = 1.00x), multiply by 100 again
    // But standard crash games use (100 * e - h) / (e - h) / 100 as the final multiplier.
    // So if the formula gives 153 for 1.53x, basis points should be 15300.
    
    // We want multiplier = 100 * e / (e - h)
    const result = (100 * e - h) / (e - h)

    // Basis points = result * 100
    // Math.floor to ensure we always truncate in favor of the house slightly
    const basisPoints = Math.floor(result * 100)

    // Ensure minimum is 10000 (1.00x)
    return Math.max(10000, basisPoints)
  }

  static generateRoundArtifacts(): ProvablyFairResult {
    const serverSeed = this.generateServerSeed()
    const serverSeedHash = this.hashServerSeed(serverSeed)
    const crashMultiplierBasisPoints = this.calculateCrashMultiplier(serverSeed)

    return {
      algorithmVersion: this.ALGORITHM_VERSION,
      crashMultiplierBasisPoints,
      serverSeed,
      serverSeedHash,
    }
  }
}
