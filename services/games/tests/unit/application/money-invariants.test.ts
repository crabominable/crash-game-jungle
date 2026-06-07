import { describe, expect, test } from "bun:test"
import { AcceptCashoutService } from "../../../src/application/accept-cashout.service"
import { ConfirmBetDebitService } from "../../../src/application/confirm-bet-debit.service"
import { CreateRoundService } from "../../../src/application/create-round.service"
import { GetCurrentRoundService } from "../../../src/application/get-current-round.service"
import { PlaceBetService } from "../../../src/application/place-bet.service"
import { StartRoundService } from "../../../src/application/start-round.service"
import { InMemoryRoundRepository } from "../../../src/infrastructure/persistence/in-memory-round.repository"

describe("Games money invariants", () => {
  test("exposes payout already truncated down before wallet credit is requested", async () => {
    const repository = new InMemoryRoundRepository()
    const createRound = new CreateRoundService(repository)
    const placeBet = new PlaceBetService(repository)
    const confirmBetDebit = new ConfirmBetDebitService(repository)
    const startRound = new StartRoundService(repository)
    const acceptCashout = new AcceptCashoutService(repository)
    const getCurrentRound = new GetCurrentRoundService(repository)

    await createRound.execute({
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const bet = await placeBet.execute({
      amountMinor: 999n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })

    await confirmBetDebit.execute({
      betId: bet.betId,
      occurredAt: "2026-06-06T00:00:02.000Z",
    })
    await startRound.execute({
      occurredAt: "2026-06-06T00:00:10.000Z",
    })
    await acceptCashout.execute({
      cashoutCorrelationId: "corr-cashout-1",
      occurredAt: "2026-06-06T00:00:11.000Z",
      payoutMultiplierBasisPoints: 15_433,
      playerId: "player-1",
    })

    const snapshot = await getCurrentRound.execute()

    expect(snapshot.bets).toMatchObject([
      {
        acceptedMultiplierBasisPoints: 15_433,
        payoutMinor: "1541",
        status: "cashout_pending_wallet",
      },
    ])
  })
})
