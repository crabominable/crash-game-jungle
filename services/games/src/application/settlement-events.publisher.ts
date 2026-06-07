import type {
  BetDebitRequestedEvent,
  CashoutCreditRequestedEvent,
  WalletSettlementEvent,
} from "@crash/contracts"
import { Inject, Injectable } from "@nestjs/common"
import { CurrentRoundNotFoundError } from "./games.application.errors"
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "./round.repository"
import { type BetSnapshot, toRoundSnapshot } from "./round.snapshot"

export const SETTLEMENT_EVENT_PUBLISHER = Symbol("SETTLEMENT_EVENT_PUBLISHER")

export interface SettlementEventPublisher {
  publish(event: WalletSettlementEvent): Promise<void>
}

export interface RequestBetDebitSettlementCommand {
  amountMinor: bigint
  correlationId: string
  occurredAt: string
  playerId: string
}

export interface RequestCashoutCreditSettlementCommand {
  cashoutCorrelationId: string
  occurredAt: string
  payoutMultiplierBasisPoints: number
  playerId: string
}

@Injectable()
export class RequestBetDebitSettlementService {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
    @Inject(SETTLEMENT_EVENT_PUBLISHER)
    private readonly settlementEventPublisher: SettlementEventPublisher,
  ) {}

  async execute(
    command: RequestBetDebitSettlementCommand,
  ): Promise<BetSnapshot> {
    const round = await this.roundRepository.getCurrent()

    if (!round) {
      throw new CurrentRoundNotFoundError()
    }

    const bet = round.placeBet(command)
    await this.roundRepository.save(round)

    const event: BetDebitRequestedEvent = {
      correlationId: command.correlationId,
      emittedAt: command.occurredAt,
      name: "bet.debit.requested",
      payload: {
        amountMinor: bet.amountMinor.toString(),
        betId: bet.betId,
        playerId: bet.playerId,
        roundId: round.roundId,
      },
      source: "games",
    }

    await this.settlementEventPublisher.publish(event)

    return toRoundSnapshot(round).bets.find(
      (candidate) => candidate.betId === bet.betId,
    ) as BetSnapshot
  }
}

@Injectable()
export class RequestCashoutCreditSettlementService {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
    @Inject(SETTLEMENT_EVENT_PUBLISHER)
    private readonly settlementEventPublisher: SettlementEventPublisher,
  ) {}

  async execute(
    command: RequestCashoutCreditSettlementCommand,
  ): Promise<BetSnapshot> {
    const round = await this.roundRepository.getCurrent()

    if (!round) {
      throw new CurrentRoundNotFoundError()
    }

    const bet = round.acceptCashout(command)
    await this.roundRepository.save(round)

    const event: CashoutCreditRequestedEvent = {
      correlationId: command.cashoutCorrelationId,
      emittedAt: command.occurredAt,
      name: "bet.cashout.credit.requested",
      payload: {
        betId: bet.betId,
        payoutMinor: (bet.payoutMinor as bigint).toString(),
        playerId: bet.playerId,
        roundId: round.roundId,
      },
      source: "games",
    }

    await this.settlementEventPublisher.publish(event)

    return toRoundSnapshot(round).bets.find(
      (candidate) => candidate.betId === bet.betId,
    ) as BetSnapshot
  }
}
