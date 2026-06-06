import { describe, expect, test } from "bun:test"
import { Wallet } from "../../../src/domain/wallet/wallet"
import {
  CorrelationConflictError,
  InsufficientFundsError,
} from "../../../src/domain/wallet/wallet.errors"

describe("Wallet", () => {
  test("creates a wallet with integer balance in minor units", () => {
    const wallet = Wallet.create({
      walletId: "wallet-1",
      playerId: "player-1",
      initialBalanceMinor: 10_000n,
    })

    expect(wallet.walletId).toBe("wallet-1")
    expect(wallet.playerId).toBe("player-1")
    expect(wallet.balanceMinor).toBe(10_000n)
    expect(wallet.ledger).toHaveLength(0)
  })

  test("debits once per correlation id and does not double-charge on retry", () => {
    const wallet = Wallet.create({
      walletId: "wallet-1",
      playerId: "player-1",
      initialBalanceMinor: 10_000n,
    })

    const firstDebit = wallet.debit({
      amountMinor: 2_500n,
      correlationId: "corr-1",
      referenceId: "bet-1",
      source: "games",
    })
    const retriedDebit = wallet.debit({
      amountMinor: 2_500n,
      correlationId: "corr-1",
      referenceId: "bet-1",
      source: "games",
    })

    expect(firstDebit.entryId).toBe(retriedDebit.entryId)
    expect(wallet.balanceMinor).toBe(7_500n)
    expect(wallet.ledger).toHaveLength(1)
    expect(wallet.ledger[0]).toMatchObject({
      amountMinor: 2_500n,
      correlationId: "corr-1",
      direction: "debit",
      referenceId: "bet-1",
      source: "games",
    })
  })

  test("returns the original debit entry when the same correlation is retried after later debits", () => {
    const wallet = Wallet.create({
      walletId: "wallet-1",
      playerId: "player-1",
      initialBalanceMinor: 10_000n,
    })

    const originalDebit = wallet.debit({
      amountMinor: 7_000n,
      correlationId: "corr-late-retry",
      referenceId: "bet-1",
      source: "games",
    })

    wallet.debit({
      amountMinor: 2_000n,
      correlationId: "corr-other",
      referenceId: "bet-2",
      source: "games",
    })

    const retriedDebit = wallet.debit({
      amountMinor: 7_000n,
      correlationId: "corr-late-retry",
      referenceId: "bet-1",
      source: "games",
    })

    expect(retriedDebit.entryId).toBe(originalDebit.entryId)
    expect(wallet.balanceMinor).toBe(1_000n)
    expect(wallet.ledger).toHaveLength(2)
  })

  test("rejects a debit that would make the balance negative", () => {
    const wallet = Wallet.create({
      walletId: "wallet-1",
      playerId: "player-1",
      initialBalanceMinor: 1_000n,
    })

    expect(() =>
      wallet.debit({
        amountMinor: 1_001n,
        correlationId: "corr-2",
        referenceId: "bet-2",
        source: "games",
      }),
    ).toThrow(InsufficientFundsError)

    expect(wallet.balanceMinor).toBe(1_000n)
    expect(wallet.ledger).toHaveLength(0)
  })

  test("rejects correlation reuse with a different payload", () => {
    const wallet = Wallet.create({
      walletId: "wallet-1",
      playerId: "player-1",
      initialBalanceMinor: 10_000n,
    })

    wallet.credit({
      amountMinor: 3_000n,
      correlationId: "corr-3",
      referenceId: "cashout-1",
      source: "games",
    })

    expect(() =>
      wallet.credit({
        amountMinor: 4_000n,
        correlationId: "corr-3",
        referenceId: "cashout-1",
        source: "games",
      }),
    ).toThrow(CorrelationConflictError)
  })
})
