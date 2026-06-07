import type {
  BetDebitConfirmedEvent,
  BetDebitRejectedEvent,
  BetDebitRequestedEvent,
} from "@crash/contracts"
import { Inject, Injectable } from "@nestjs/common"
import { WalletNotFoundError } from "./wallet.application.errors"
import {
  WALLET_REPOSITORY,
  type WalletRepository,
} from "./wallet.repository"
import { InsufficientFundsError } from "../domain/wallet/wallet.errors"

@Injectable()
export class HandleBetDebitRequestedEventService {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
  ) {}

  async execute(
    event: BetDebitRequestedEvent,
  ): Promise<BetDebitConfirmedEvent | BetDebitRejectedEvent> {
    const wallet = await this.walletRepository.findByPlayerId(event.payload.playerId)

    if (!wallet) {
      return {
        correlationId: event.correlationId,
        emittedAt: event.emittedAt,
        name: "bet.debit.rejected",
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
      const entry = wallet.debit({
        amountMinor: BigInt(event.payload.amountMinor),
        correlationId: event.correlationId,
        referenceId: event.payload.betId,
        source: "games",
      })

      await this.walletRepository.save(wallet)

      return {
        correlationId: event.correlationId,
        emittedAt: entry.occurredAt,
        name: "bet.debit.confirmed",
        payload: {
          betId: event.payload.betId,
          playerId: event.payload.playerId,
          roundId: event.payload.roundId,
        },
        source: "wallets",
      }
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        return {
          correlationId: event.correlationId,
          emittedAt: event.emittedAt,
          name: "bet.debit.rejected",
          payload: {
            betId: event.payload.betId,
            playerId: event.payload.playerId,
            reason: "insufficient_funds",
            roundId: event.payload.roundId,
          },
          source: "wallets",
        }
      }

      if (error instanceof WalletNotFoundError) {
        return {
          correlationId: event.correlationId,
          emittedAt: event.emittedAt,
          name: "bet.debit.rejected",
          payload: {
            betId: event.payload.betId,
            playerId: event.payload.playerId,
            reason: "wallet_not_found",
            roundId: event.payload.roundId,
          },
          source: "wallets",
        }
      }

      return {
        correlationId: event.correlationId,
        emittedAt: event.emittedAt,
        name: "bet.debit.rejected",
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
