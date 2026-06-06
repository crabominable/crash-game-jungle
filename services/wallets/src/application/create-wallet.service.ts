import { Inject, Injectable } from "@nestjs/common"
import { Wallet } from "../domain/wallet/wallet"
import { WalletAlreadyExistsError } from "./wallet.application.errors"
import {
  WALLET_REPOSITORY,
  type WalletRepository,
} from "./wallet.repository"
import { toWalletSnapshot, type WalletSnapshot } from "./wallet.snapshot"

export interface CreateWalletCommand {
  initialBalanceMinor?: bigint
  playerId: string
  walletId: string
}

@Injectable()
export class CreateWalletService {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
  ) {}

  async execute(command: CreateWalletCommand): Promise<WalletSnapshot> {
    const wallet = Wallet.create(command)

    try {
      await this.walletRepository.create(wallet)
    } catch (error) {
      if (error instanceof WalletAlreadyExistsError) {
        throw error
      }

      throw error
    }

    return toWalletSnapshot(wallet)
  }
}
