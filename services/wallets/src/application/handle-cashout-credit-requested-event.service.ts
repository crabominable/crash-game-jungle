import type {
  CashoutCreditConfirmedEvent,
  CashoutCreditRejectedEvent,
  CashoutCreditRequestedEvent,
} from "@crash/contracts"
import { Inject, Injectable } from "@nestjs/common"
import {
  WALLET_REPOSITORY,
  type WalletRepository,
} from "./wallet.repository"

@Injectable()
export class HandleCashoutCreditRequestedEventService {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
  ) {}

  async execute(
    event: CashoutCreditRequestedEvent,
  ): Promise<CashoutCreditConfirmedEvent | CashoutCreditRejectedEvent> {
    const wallet = await this.walletRepository.findByPlayerId(event.payload.playerId)

    if (!wallet) {
      return {
        correlationId: event.correlationId,
        emittedAt: event.emittedAt,
        name: "bet.cashout.credit.rejected",
        payload: {
          betId: event.payload.betId,
          playerId: event.payload.playerId,
          reason: "wallet_not_found",
          roundId: event.payload.roundId,
        },
        source: "wallets",
      }
    }

    try {
      const entry = wallet.credit({
        amountMinor: BigInt(event.payload.payoutMinor),
        correlationId: event.correlationId,
        referenceId: event.payload.betId,
        source: "games",
      })

      await this.walletRepository.save(wallet)

      return {
        correlationId: event.correlationId,
        emittedAt: entry.occurredAt,
        name: "bet.cashout.credit.confirmed",
        payload: {
          betId: event.payload.betId,
          playerId: event.payload.playerId,
          roundId: event.payload.roundId,
        },
        source: "wallets",
      }
    } catch {
      return {
        correlationId: event.correlationId,
        emittedAt: event.emittedAt,
        name: "bet.cashout.credit.rejected",
        payload: {
          betId: event.payload.betId,
          playerId: event.payload.playerId,
          reason: "processing_error",
          roundId: event.payload.roundId,
        },
        source: "wallets",
      }
    }
  }
}
