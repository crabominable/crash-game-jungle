import { Inject, Injectable } from "@nestjs/common"
import { WalletNotFoundError } from "./wallet.application.errors"
import {
  WALLET_REPOSITORY,
  type WalletRepository,
} from "./wallet.repository"
import {
  toWalletLedgerEntrySnapshot,
  type WalletLedgerEntrySnapshot,
} from "./wallet.snapshot"

export interface CreditWalletCommand {
  amountMinor: bigint
  correlationId: string
  playerId: string
  referenceId: string
  source: "games" | "wallets"
}

@Injectable()
export class CreditWalletService {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
  ) {}

  async execute(command: CreditWalletCommand): Promise<WalletLedgerEntrySnapshot> {
    const wallet = await this.walletRepository.findByPlayerId(command.playerId)

    if (!wallet) {
      throw new WalletNotFoundError(command.playerId)
    }

    const entry = wallet.credit(command)

    await this.walletRepository.save(wallet)

    return toWalletLedgerEntrySnapshot(entry)
  }
}
