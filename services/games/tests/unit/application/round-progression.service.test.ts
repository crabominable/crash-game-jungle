import { describe, expect, test } from "bun:test"
import { CreateRoundService } from "../../../src/application/create-round.service"
import { RejectBetDebitService } from "../../../src/application/reject-bet-debit.service"
import { CrashRoundService } from "../../../src/application/crash-round.service"
import { PlaceBetService } from "../../../src/application/place-bet.service"
import { StartRoundService } from "../../../src/application/start-round.service"
import { GetCurrentRoundService } from "../../../src/application/get-current-round.service"
import { InMemoryRoundRepository } from "../../../src/infrastructure/persistence/in-memory-round.repository"

describe("Round progression services", () => {
  test("allows creating the next current round after the previous one is settled", async () => {
    const repository = new InMemoryRoundRepository()
    const createRound = new CreateRoundService(repository)
    const placeBet = new PlaceBetService(repository)
    const startRound = new StartRoundService(repository)
    const crashRound = new CrashRoundService(repository)
    const rejectBetDebit = new RejectBetDebitService(repository)
    const getCurrentRound = new GetCurrentRoundService(repository)

    await createRound.execute({
      crashMultiplierBasisPoints: 15_500,
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const bet = await placeBet.execute({
      amountMinor: 2_000n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })

    await startRound.execute({
      occurredAt: "2026-06-06T00:00:10.000Z",
    })
    await crashRound.execute({
      occurredAt: "2026-06-06T00:00:12.000Z",
    })
    await rejectBetDebit.execute({
      betId: bet.betId,
      occurredAt: "2026-06-06T00:00:13.000Z",
    })

    await createRound.execute({
      crashMultiplierBasisPoints: 16_500,
      roundId: "round-2",
      startedAt: "2026-06-06T00:01:00.000Z",
    })

    const snapshot = await getCurrentRound.execute()

    expect(snapshot.roundId).toBe("round-2")
    expect(snapshot.status).toBe("betting_open")
    expect(snapshot.bets).toHaveLength(0)
  })
})
