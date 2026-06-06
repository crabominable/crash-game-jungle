import { describe, expect, test } from "bun:test"
import { CreateWalletService } from "../../../src/application/create-wallet.service"
import { CreditWalletService } from "../../../src/application/credit-wallet.service"
import { DebitWalletService } from "../../../src/application/debit-wallet.service"
import { GetWalletByPlayerService } from "../../../src/application/get-wallet-by-player.service"
import { WalletAlreadyExistsError } from "../../../src/application/wallet.application.errors"
import { InMemoryWalletRepository } from "../../../src/infrastructure/persistence/in-memory-wallet.repository"

describe("Wallet application services", () => {
  test("creates and fetches a wallet by player id", async () => {
    const repository = new InMemoryWalletRepository()
    const createWallet = new CreateWalletService(repository)
    const getWalletByPlayer = new GetWalletByPlayerService(repository)

    await createWallet.execute({
      initialBalanceMinor: 50_000n,
      playerId: "player-1",
      walletId: "wallet-1",
    })

    const snapshot = await getWalletByPlayer.execute({ playerId: "player-1" })

    expect(snapshot).toMatchObject({
      balanceMinor: "50000",
      currency: "BRL",
      playerId: "player-1",
      walletId: "wallet-1",
    })
    expect(snapshot.ledger).toHaveLength(0)
  })

  test("returns the same result when a credit retry reuses the same correlation id", async () => {
    const repository = new InMemoryWalletRepository()
    const createWallet = new CreateWalletService(repository)
    const creditWallet = new CreditWalletService(repository)
    const getWalletByPlayer = new GetWalletByPlayerService(repository)

    await createWallet.execute({
      initialBalanceMinor: 20_000n,
      playerId: "player-1",
      walletId: "wallet-1",
    })

    const firstCredit = await creditWallet.execute({
      amountMinor: 5_500n,
      correlationId: "corr-credit-1",
      playerId: "player-1",
      referenceId: "cashout-1",
      source: "games",
    })
    const retriedCredit = await creditWallet.execute({
      amountMinor: 5_500n,
      correlationId: "corr-credit-1",
      playerId: "player-1",
      referenceId: "cashout-1",
      source: "games",
    })
    const snapshot = await getWalletByPlayer.execute({ playerId: "player-1" })

    expect(firstCredit.entryId).toBe(retriedCredit.entryId)
    expect(snapshot.balanceMinor).toBe("25500")
    expect(snapshot.ledger).toHaveLength(1)
  })

  test("rejects duplicate wallet creation for the same player", async () => {
    const repository = new InMemoryWalletRepository()
    const createWallet = new CreateWalletService(repository)

    await createWallet.execute({
      initialBalanceMinor: 20_000n,
      playerId: "player-1",
      walletId: "wallet-1",
    })

    await expect(() =>
      createWallet.execute({
        initialBalanceMinor: 5_000n,
        playerId: "player-1",
        walletId: "wallet-2",
      }),
    ).toThrow(WalletAlreadyExistsError)
  })

  test("debits authoritatively and preserves the ledger for audit", async () => {
    const repository = new InMemoryWalletRepository()
    const createWallet = new CreateWalletService(repository)
    const debitWallet = new DebitWalletService(repository)
    const getWalletByPlayer = new GetWalletByPlayerService(repository)

    await createWallet.execute({
      initialBalanceMinor: 10_000n,
      playerId: "player-1",
      walletId: "wallet-1",
    })

    await debitWallet.execute({
      amountMinor: 2_000n,
      correlationId: "corr-debit-1",
      playerId: "player-1",
      referenceId: "bet-1",
      source: "games",
    })

    const snapshot = await getWalletByPlayer.execute({ playerId: "player-1" })

    expect(snapshot.balanceMinor).toBe("8000")
    expect(snapshot.ledger).toMatchObject([
      {
        amountMinor: "2000",
        correlationId: "corr-debit-1",
        direction: "debit",
        referenceId: "bet-1",
        source: "games",
      },
    ])
  })
})
