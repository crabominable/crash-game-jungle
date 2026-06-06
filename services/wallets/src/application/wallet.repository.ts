import type { Wallet } from "../domain/wallet/wallet"

export const WALLET_REPOSITORY = Symbol("WALLET_REPOSITORY")

export interface WalletRepository {
  create(wallet: Wallet): Promise<void>
  findByPlayerId(playerId: string): Promise<Wallet | null>
  save(wallet: Wallet): Promise<void>
}
