import { describe, expect, test } from "bun:test"
import { CreateRoundService } from "../../../src/application/create-round.service"
import { ConfirmBetDebitService } from "../../../src/application/confirm-bet-debit.service"
import { GetCurrentRoundService } from "../../../src/application/get-current-round.service"
import {
  type SettlementEventPublisher,
  RequestBetDebitSettlementService,
  RequestCashoutCreditSettlementService,
} from "../../../src/application/settlement-events.publisher"
import { StartRoundService } from "../../../src/application/start-round.service"
import { HandleBetDebitConfirmedEventService } from "../../../src/application/handle-bet-debit-confirmed-event.service"
import { HandleCashoutCreditConfirmedEventService } from "../../../src/application/handle-cashout-credit-confirmed-event.service"
import { InMemoryRoundRepository } from "../../../src/infrastructure/persistence/in-memory-round.repository"
import { ProvablyFair } from "../../../src/domain/provably-fair"

ProvablyFair.generateRoundArtifacts = () => ({
  algorithmVersion: "1.0",
  crashMultiplierBasisPoints: 50_000,
  serverSeed: "mock-seed",
  serverSeedHash: "mock-hash",
})

class InMemorySettlementEventPublisher implements SettlementEventPublisher {
  readonly publishedEvents: unknown[] = []

  async publish(event: unknown): Promise<void> {
    this.publishedEvents.push(event)
  }
}

describe("Games settlement integration services", () => {
  test("places a bet and publishes a debit request event for wallets", async () => {
    const repository = new InMemoryRoundRepository()
    const mockPublisher = { publishRoundUpdated: () => {} }
    const publisher = new InMemorySettlementEventPublisher()
    const createRound = new CreateRoundService(repository, mockPublisher)
    const requestBetDebitSettlement = new RequestBetDebitSettlementService(
      repository,
      mockPublisher,
      publisher,
    )

    await createRound.execute({
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const bet = await requestBetDebitSettlement.execute({
      amountMinor: 2_000n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })

    expect(bet.status).toBe("bet_pending_wallet")
    expect(publisher.publishedEvents).toMatchObject([
      {
        correlationId: "corr-bet-1",
        name: "bet.debit.requested",
        payload: {
          amountMinor: "2000",
          betId: "round-1:player-1",
          playerId: "player-1",
          roundId: "round-1",
        },
        source: "games",
      },
    ])
  })

  test("accepts a cashout and publishes a credit request event for wallets", async () => {
    const repository = new InMemoryRoundRepository()
    const mockPublisher = { publishRoundUpdated: () => {} }
    const publisher = new InMemorySettlementEventPublisher()
    const createRound = new CreateRoundService(repository, mockPublisher)
    const confirmBetDebit = new ConfirmBetDebitService(repository, mockPublisher)
    const startRound = new StartRoundService(repository, mockPublisher)
    const requestBetDebitSettlement = new RequestBetDebitSettlementService(
      repository,
      mockPublisher,
      publisher,
    )
    const requestCashoutCreditSettlement =
      new RequestCashoutCreditSettlementService(repository, mockPublisher, publisher)

    await createRound.execute({
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const pendingBet = await requestBetDebitSettlement.execute({
      amountMinor: 2_000n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })

    await confirmBetDebit.execute({
      betId: pendingBet.betId,
      occurredAt: "2026-06-06T00:00:02.000Z",
    })
    await startRound.execute({
      occurredAt: "2026-06-06T00:00:10.000Z",
    })

    const bet = await requestCashoutCreditSettlement.execute({
      cashoutCorrelationId: "corr-cashout-1",
      occurredAt: "2026-06-06T00:00:11.000Z",
      payoutMultiplierBasisPoints: 17_500,
      playerId: "player-1",
    })

    expect(bet.status).toBe("cashout_pending_wallet")
    expect(publisher.publishedEvents).toMatchObject([
      {
        name: "bet.debit.requested",
      },
      {
        correlationId: "corr-cashout-1",
        name: "bet.cashout.credit.requested",
        payload: {
          betId: "round-1:player-1",
          payoutMinor: "3500",
          playerId: "player-1",
          roundId: "round-1",
        },
        source: "games",
      },
    ])
  })

  test("turns a pending bet active after a confirmed debit event arrives from wallets", async () => {
    const repository = new InMemoryRoundRepository()
    const mockPublisher = { publishRoundUpdated: () => {} }
    const publisher = new InMemorySettlementEventPublisher()
    const createRound = new CreateRoundService(repository, mockPublisher)
    const getCurrentRound = new GetCurrentRoundService(repository, mockPublisher)
    const requestBetDebitSettlement = new RequestBetDebitSettlementService(
      repository,
      mockPublisher,
      publisher,
    )
    const handleBetDebitConfirmed = new HandleBetDebitConfirmedEventService(
      repository,
      mockPublisher,
    )

    await createRound.execute({
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    await requestBetDebitSettlement.execute({
      amountMinor: 2_000n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })

    await handleBetDebitConfirmed.execute({
      correlationId: "corr-bet-1",
      emittedAt: "2026-06-06T00:00:02.000Z",
      name: "bet.debit.confirmed",
      payload: {
        betId: "round-1:player-1",
        playerId: "player-1",
        roundId: "round-1",
      },
      source: "wallets",
    })

    const snapshot = await getCurrentRound.execute()

    expect(snapshot.bets).toMatchObject([
      {
        betId: "round-1:player-1",
        status: "bet_active",
      },
    ])
  })

  test("settles a cashout after a confirmed credit event arrives from wallets", async () => {
    const repository = new InMemoryRoundRepository()
    const mockPublisher = { publishRoundUpdated: () => {} }
    const publisher = new InMemorySettlementEventPublisher()
    const createRound = new CreateRoundService(repository, mockPublisher)
    const confirmBetDebit = new ConfirmBetDebitService(repository, mockPublisher)
    const startRound = new StartRoundService(repository, mockPublisher)
    const getCurrentRound = new GetCurrentRoundService(repository, mockPublisher)
    const requestBetDebitSettlement = new RequestBetDebitSettlementService(
      repository,
      mockPublisher,
      publisher,
    )
    const requestCashoutCreditSettlement =
      new RequestCashoutCreditSettlementService(repository, mockPublisher, publisher)
    const handleCashoutCreditConfirmed =
      new HandleCashoutCreditConfirmedEventService(repository, mockPublisher)

    await createRound.execute({
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const pendingBet = await requestBetDebitSettlement.execute({
      amountMinor: 2_000n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })

    await confirmBetDebit.execute({
      betId: pendingBet.betId,
      occurredAt: "2026-06-06T00:00:02.000Z",
    })
    await startRound.execute({
      occurredAt: "2026-06-06T00:00:10.000Z",
    })
    await requestCashoutCreditSettlement.execute({
      cashoutCorrelationId: "corr-cashout-1",
      occurredAt: "2026-06-06T00:00:11.000Z",
      payoutMultiplierBasisPoints: 17_500,
      playerId: "player-1",
    })

    await handleCashoutCreditConfirmed.execute({
      correlationId: "corr-cashout-1",
      emittedAt: "2026-06-06T00:00:12.000Z",
      name: "bet.cashout.credit.confirmed",
      payload: {
        betId: "round-1:player-1",
        playerId: "player-1",
        roundId: "round-1",
      },
      source: "wallets",
    })

    const snapshot = await getCurrentRound.execute()

    expect(snapshot.bets).toMatchObject([
      {
        betId: "round-1:player-1",
        status: "won_settled",
      },
    ])
  })
})
