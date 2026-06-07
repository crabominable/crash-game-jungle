import { describe, expect, test } from "bun:test"
import { AcceptCashoutService } from "../../../src/application/accept-cashout.service"
import { ConfirmBetDebitService } from "../../../src/application/confirm-bet-debit.service"
import { CreateRoundService } from "../../../src/application/create-round.service"
import { CrashRoundService } from "../../../src/application/crash-round.service"
import { GetCurrentRoundService } from "../../../src/application/get-current-round.service"
import { PlaceBetService } from "../../../src/application/place-bet.service"
import { StartRoundService } from "../../../src/application/start-round.service"
import { InMemoryRoundRepository } from "../../../src/infrastructure/persistence/in-memory-round.repository"

describe("Games application services", () => {
  test("creates a current round and exposes it as a snapshot", async () => {
    const repository = new InMemoryRoundRepository()
    const mockPublisher = { publishRoundUpdated: () => {} }
    const createRound = new CreateRoundService(repository, mockPublisher)
    const getCurrentRound = new GetCurrentRoundService(repository, mockPublisher)

    await createRound.execute({
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const snapshot = await getCurrentRound.execute()

    expect(snapshot).toMatchObject({
      bets: [],
      roundId: "round-1",
      status: "betting_open",
    })
  })

  test("drives a bet from pending wallet to active and then to cashout pending wallet", async () => {
    const repository = new InMemoryRoundRepository()
    const mockPublisher = { publishRoundUpdated: () => {} }
    const createRound = new CreateRoundService(repository, mockPublisher)
    const placeBet = new PlaceBetService(repository, mockPublisher)
    const confirmBetDebit = new ConfirmBetDebitService(repository, mockPublisher)
    const startRound = new StartRoundService(repository, mockPublisher)
    const acceptCashout = new AcceptCashoutService(repository, mockPublisher)
    const getCurrentRound = new GetCurrentRoundService(repository, mockPublisher)

    await createRound.execute({
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const pendingBet = await placeBet.execute({
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
    await acceptCashout.execute({
      cashoutCorrelationId: "corr-cashout-1",
      occurredAt: "2026-06-06T00:00:11.000Z",
      payoutMultiplierBasisPoints: 17_500,
      playerId: "player-1",
    })

    const snapshot = await getCurrentRound.execute()

    expect(snapshot.status).toBe("in_progress")
    expect(snapshot.bets).toMatchObject([
      {
        playerId: "player-1",
        status: "cashout_pending_wallet",
      },
    ])
  })

  test("marks active bets as lost when the round crashes and no pending settlement remains", async () => {
    const repository = new InMemoryRoundRepository()
    const mockPublisher = { publishRoundUpdated: () => {} }
    const createRound = new CreateRoundService(repository, mockPublisher)
    const placeBet = new PlaceBetService(repository, mockPublisher)
    const confirmBetDebit = new ConfirmBetDebitService(repository, mockPublisher)
    const startRound = new StartRoundService(repository, mockPublisher)
    const crashRound = new CrashRoundService(repository, mockPublisher)
    const getCurrentRound = new GetCurrentRoundService(repository, mockPublisher)

    await createRound.execute({
      crashMultiplierBasisPoints: 12_500,
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const pendingBet = await placeBet.execute({
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
    await crashRound.execute({
      occurredAt: "2026-06-06T00:00:11.000Z",
    })

    const snapshot = await getCurrentRound.execute()

    expect(snapshot.status).toBe("settled")
    expect(snapshot.bets).toMatchObject([
      {
        playerId: "player-1",
        status: "lost",
      },
    ])
  })
})
