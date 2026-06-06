import { Injectable } from "@nestjs/common"
import { WalletAlreadyExistsError } from "../../application/wallet.application.errors"
import type { WalletRepository } from "../../application/wallet.repository"
import type { Wallet } from "../../domain/wallet/wallet"

@Injectable()
export class InMemoryWalletRepository implements WalletRepository {
  private readonly walletsByPlayerId = new Map<string, Wallet>()

  async create(wallet: Wallet): Promise<void> {
    if (this.walletsByPlayerId.has(wallet.playerId)) {
      throw new WalletAlreadyExistsError(wallet.playerId)
    }

    this.walletsByPlayerId.set(wallet.playerId, wallet)
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    return this.walletsByPlayerId.get(playerId) ?? null
  }

  async save(wallet: Wallet): Promise<void> {
    this.walletsByPlayerId.set(wallet.playerId, wallet)
  }
}
