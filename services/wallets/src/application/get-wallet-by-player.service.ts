import { Inject, Injectable } from "@nestjs/common"
import { WalletNotFoundError } from "./wallet.application.errors"
import {
  WALLET_REPOSITORY,
  type WalletRepository,
} from "./wallet.repository"
import { toWalletSnapshot, type WalletSnapshot } from "./wallet.snapshot"

export interface GetWalletByPlayerQuery {
  playerId: string
}

@Injectable()
export class GetWalletByPlayerService {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
  ) {}

  async execute(query: GetWalletByPlayerQuery): Promise<WalletSnapshot> {
    const wallet = await this.walletRepository.findByPlayerId(query.playerId)

    if (!wallet) {
      throw new WalletNotFoundError(query.playerId)
    }

    return toWalletSnapshot(wallet)
  }
}
