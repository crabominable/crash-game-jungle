import { describe, expect, test } from "bun:test"
import { Round } from "../../../src/domain/round/round"
import {
  BetAlreadyExistsForPlayerError,
  BetNotEligibleForCashoutError,
  CashoutMultiplierOutOfRangeError,
  RoundNotAcceptingBetsError,
} from "../../../src/domain/round/round.errors"

describe("Round", () => {
  test("creates a round in betting state and starts it", () => {
    const round = Round.create({
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    expect(round.status).toBe("betting_open")

    round.start("2026-06-06T00:00:10.000Z")

    expect(round.status).toBe("in_progress")
  })

  test("creates bets as pending wallet settlement during the betting window", () => {
    const round = Round.create({
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const bet = round.placeBet({
      amountMinor: 1_500n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })

    expect(bet.status).toBe("bet_pending_wallet")
    expect(round.bets[0]).toMatchObject({
      amountMinor: 1_500n,
      playerId: "player-1",
      status: "bet_pending_wallet",
      walletCorrelationId: "corr-bet-1",
    })
  })

  test("allows only one bet per player per round", () => {
    const round = Round.create({
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    round.placeBet({
      amountMinor: 1_500n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })

    expect(() =>
      round.placeBet({
        amountMinor: 2_000n,
        correlationId: "corr-bet-2",
        occurredAt: "2026-06-06T00:00:02.000Z",
        playerId: "player-1",
      }),
    ).toThrow(BetAlreadyExistsForPlayerError)
  })

  test("rejects bets after the round leaves the betting window", () => {
    const round = Round.create({
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    round.start("2026-06-06T00:00:10.000Z")

    expect(() =>
      round.placeBet({
        amountMinor: 1_500n,
        correlationId: "corr-bet-1",
        occurredAt: "2026-06-06T00:00:11.000Z",
        playerId: "player-1",
      }),
    ).toThrow(RoundNotAcceptingBetsError)
  })

  test("accepts cashout only for an active bet and marks it pending wallet credit", () => {
    const round = Round.create({
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const bet = round.placeBet({
      amountMinor: 2_000n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })

    round.confirmBetDebit({
      betId: bet.betId,
      occurredAt: "2026-06-06T00:00:02.000Z",
    })
    round.start("2026-06-06T00:00:10.000Z")

    const cashout = round.acceptCashout({
      cashoutCorrelationId: "corr-cashout-1",
      occurredAt: "2026-06-06T00:00:11.000Z",
      playerId: "player-1",
      payoutMultiplierBasisPoints: 21_500,
    })

    expect(cashout.status).toBe("cashout_pending_wallet")
    expect(cashout.cashoutCorrelationId).toBe("corr-cashout-1")
    expect(cashout.payoutMinor).toBe(4_300n)
  })

  test("rejects cashout with an invalid multiplier for the round", () => {
    const round = Round.create({
      crashMultiplierBasisPoints: 18_500,
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const bet = round.placeBet({
      amountMinor: 2_000n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })

    round.confirmBetDebit({
      betId: bet.betId,
      occurredAt: "2026-06-06T00:00:02.000Z",
    })
    round.start("2026-06-06T00:00:10.000Z")

    expect(() =>
      round.acceptCashout({
        cashoutCorrelationId: "corr-cashout-1",
        occurredAt: "2026-06-06T00:00:11.000Z",
        playerId: "player-1",
        payoutMultiplierBasisPoints: 18_500,
      }),
    ).toThrow(CashoutMultiplierOutOfRangeError)

    expect(() =>
      round.acceptCashout({
        cashoutCorrelationId: "corr-cashout-2",
        occurredAt: "2026-06-06T00:00:11.500Z",
        playerId: "player-1",
        payoutMultiplierBasisPoints: Number.NaN,
      }),
    ).toThrow(CashoutMultiplierOutOfRangeError)

    expect(() =>
      round.acceptCashout({
        cashoutCorrelationId: "corr-cashout-3",
        occurredAt: "2026-06-06T00:00:11.750Z",
        playerId: "player-1",
        payoutMultiplierBasisPoints: 15_400.5,
      }),
    ).toThrow(CashoutMultiplierOutOfRangeError)
  })

  test("keeps a late-confirmed debit as lost if the round already crashed", () => {
    const round = Round.create({
      crashMultiplierBasisPoints: 15_500,
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const pendingBet = round.placeBet({
      amountMinor: 2_000n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })

    round.start("2026-06-06T00:00:10.000Z")
    round.crash("2026-06-06T00:00:12.000Z")
    const reconciledBet = round.confirmBetDebit({
      betId: pendingBet.betId,
      occurredAt: "2026-06-06T00:00:13.000Z",
    })

    expect(round.status).toBe("settled")
    expect(reconciledBet.status).toBe("lost")
  })

  test("rejects cashout for a bet that is still waiting on wallet debit", () => {
    const round = Round.create({
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    round.placeBet({
      amountMinor: 2_000n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })
    round.start("2026-06-06T00:00:10.000Z")

    expect(() =>
      round.acceptCashout({
        cashoutCorrelationId: "corr-cashout-1",
        occurredAt: "2026-06-06T00:00:11.000Z",
        playerId: "player-1",
        payoutMultiplierBasisPoints: 20_000,
      }),
    ).toThrow(BetNotEligibleForCashoutError)
  })

  test("settles the round after crash when the last pending cashout is financially confirmed", () => {
    const round = Round.create({
      crashMultiplierBasisPoints: 15_500,
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const bet = round.placeBet({
      amountMinor: 2_000n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })

    round.confirmBetDebit({
      betId: bet.betId,
      occurredAt: "2026-06-06T00:00:02.000Z",
    })
    round.start("2026-06-06T00:00:10.000Z")
    const cashout = round.acceptCashout({
      cashoutCorrelationId: "corr-cashout-1",
      occurredAt: "2026-06-06T00:00:11.000Z",
      playerId: "player-1",
      payoutMultiplierBasisPoints: 15_400,
    })

    round.crash("2026-06-06T00:00:12.000Z")
    round.confirmCashoutCredit(cashout.betId, "2026-06-06T00:00:13.000Z")

    expect(round.status).toBe("settled")
  })

  test("reconciles a late cashout credit confirmation after an earlier failure state", () => {
    const round = Round.create({
      crashMultiplierBasisPoints: 15_500,
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const bet = round.placeBet({
      amountMinor: 2_000n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })

    round.confirmBetDebit({
      betId: bet.betId,
      occurredAt: "2026-06-06T00:00:02.000Z",
    })
    round.start("2026-06-06T00:00:10.000Z")
    const cashout = round.acceptCashout({
      cashoutCorrelationId: "corr-cashout-1",
      occurredAt: "2026-06-06T00:00:11.000Z",
      playerId: "player-1",
      payoutMultiplierBasisPoints: 15_400,
    })

    round.crash("2026-06-06T00:00:12.000Z")
    round.rejectCashoutCredit(cashout.betId, "2026-06-06T00:00:13.000Z")
    const reconciledBet = round.confirmCashoutCredit(
      cashout.betId,
      "2026-06-06T00:00:14.000Z",
    )

    expect(reconciledBet.status).toBe("won_settled")
    expect(round.status).toBe("settled")
  })

  test("settles the round after crash when the last pending wallet debit is rejected", () => {
    const round = Round.create({
      crashMultiplierBasisPoints: 15_500,
      roundId: "round-1",
      startedAt: "2026-06-06T00:00:00.000Z",
    })

    const pendingBet = round.placeBet({
      amountMinor: 2_000n,
      correlationId: "corr-bet-1",
      occurredAt: "2026-06-06T00:00:01.000Z",
      playerId: "player-1",
    })

    round.start("2026-06-06T00:00:10.000Z")
    round.crash("2026-06-06T00:00:12.000Z")
    const rejectedBet = round.rejectBetDebit({
      betId: pendingBet.betId,
      occurredAt: "2026-06-06T00:00:13.000Z",
    })

    expect(rejectedBet.status).toBe("bet_rejected_by_wallet")
    expect(round.status).toBe("settled")
  })
})
