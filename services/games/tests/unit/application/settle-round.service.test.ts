import { describe, expect, test } from "bun:test"
import { AcceptCashoutService } from "../../../src/application/accept-cashout.service"
import { ConfirmBetDebitService } from "../../../src/application/confirm-bet-debit.service"
import { ConfirmCashoutCreditService } from "../../../src/application/confirm-cashout-credit.service"
import { CreateRoundService } from "../../../src/application/create-round.service"
import { CrashRoundService } from "../../../src/application/crash-round.service"
import { GetCurrentRoundService } from "../../../src/application/get-current-round.service"
import { PlaceBetService } from "../../../src/application/place-bet.service"
import { RejectBetDebitService } from "../../../src/application/reject-bet-debit.service"
import { RejectCashoutCreditService } from "../../../src/application/reject-cashout-credit.service"
import { StartRoundService } from "../../../src/application/start-round.service"
import { InMemoryRoundRepository } from "../../../src/infrastructure/persistence/in-memory-round.repository"

describe("Round settlement application services", () => {
  test("marks the round as settled after crash once the last pending cashout is confirmed", async () => {
    const repository = new InMemoryRoundRepository()
    const createRound = new CreateRoundService(repository)
    const placeBet = new PlaceBetService(repository)
    const confirmBetDebit = new ConfirmBetDebitService(repository)
    const startRound = new StartRoundService(repository)
    const acceptCashout = new AcceptCashoutService(repository)
    const crashRound = new CrashRoundService(repository)
    const confirmCashoutCredit = new ConfirmCashoutCreditService(repository)
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
      payoutMultiplierBasisPoints: 15_400,
      playerId: "player-1",
    })
    await crashRound.execute({
      occurredAt: "2026-06-06T00:00:12.000Z",
    })
    await confirmCashoutCredit.execute({
      betId: bet.betId,
      occurredAt: "2026-06-06T00:00:13.000Z",
    })

    const snapshot = await getCurrentRound.execute()

    expect(snapshot.status).toBe("settled")
    expect(snapshot.bets).toMatchObject([
      {
        status: "won_settled",
      },
    ])
  })

  test("settles the round after crash when the final pending wallet debit is rejected", async () => {
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

    const snapshot = await getCurrentRound.execute()

    expect(snapshot.status).toBe("settled")
    expect(snapshot.bets).toMatchObject([
      {
        status: "bet_rejected_by_wallet",
      },
    ])
  })

  test("reconciles a late cashout credit confirmation after a prior failure state", async () => {
    const repository = new InMemoryRoundRepository()
    const createRound = new CreateRoundService(repository)
    const placeBet = new PlaceBetService(repository)
    const confirmBetDebit = new ConfirmBetDebitService(repository)
    const startRound = new StartRoundService(repository)
    const acceptCashout = new AcceptCashoutService(repository)
    const crashRound = new CrashRoundService(repository)
    const rejectCashoutCredit = new RejectCashoutCreditService(repository)
    const confirmCashoutCredit = new ConfirmCashoutCreditService(repository)
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
      payoutMultiplierBasisPoints: 15_400,
      playerId: "player-1",
    })
    await crashRound.execute({
      occurredAt: "2026-06-06T00:00:12.000Z",
    })
    await rejectCashoutCredit.execute({
      betId: bet.betId,
      occurredAt: "2026-06-06T00:00:13.000Z",
    })
    await confirmCashoutCredit.execute({
      betId: bet.betId,
      occurredAt: "2026-06-06T00:00:14.000Z",
    })

    const snapshot = await getCurrentRound.execute()

    expect(snapshot.status).toBe("settled")
    expect(snapshot.bets).toMatchObject([
      {
        status: "won_settled",
      },
    ])
  })
})
