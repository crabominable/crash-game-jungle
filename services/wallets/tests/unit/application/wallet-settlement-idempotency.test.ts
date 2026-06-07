import { describe, expect, test } from "bun:test"
import { CreateWalletService } from "../../../src/application/create-wallet.service"
import { CreditWalletService } from "../../../src/application/credit-wallet.service"
import { DebitWalletService } from "../../../src/application/debit-wallet.service"
import { GetWalletByPlayerService } from "../../../src/application/get-wallet-by-player.service"
import { InMemoryWalletRepository } from "../../../src/infrastructure/persistence/in-memory-wallet.repository"

describe("Wallet settlement idempotency", () => {
  test("keeps a retried debit settlement idempotent even after other operations", async () => {
    const repository = new InMemoryWalletRepository()
    const createWallet = new CreateWalletService(repository)
    const debitWallet = new DebitWalletService(repository)
    const creditWallet = new CreditWalletService(repository)
    const getWalletByPlayer = new GetWalletByPlayerService(repository)

    await createWallet.execute({
      initialBalanceMinor: 20_000n,
      playerId: "player-1",
      walletId: "wallet-1",
    })

    const firstDebit = await debitWallet.execute({
      amountMinor: 5_000n,
      correlationId: "corr-debit-1",
      playerId: "player-1",
      referenceId: "bet-1",
      source: "games",
    })

    await creditWallet.execute({
      amountMinor: 1_000n,
      correlationId: "corr-credit-1",
      playerId: "player-1",
      referenceId: "cashout-1",
      source: "games",
    })

    const retriedDebit = await debitWallet.execute({
      amountMinor: 5_000n,
      correlationId: "corr-debit-1",
      playerId: "player-1",
      referenceId: "bet-1",
      source: "games",
    })

    const snapshot = await getWalletByPlayer.execute({ playerId: "player-1" })

    expect(retriedDebit.entryId).toBe(firstDebit.entryId)
    expect(snapshot.balanceMinor).toBe("16000")
    expect(snapshot.ledger).toHaveLength(2)
  })

  test("keeps a retried credit settlement idempotent even after other operations", async () => {
    const repository = new InMemoryWalletRepository()
    const createWallet = new CreateWalletService(repository)
    const debitWallet = new DebitWalletService(repository)
    const creditWallet = new CreditWalletService(repository)
    const getWalletByPlayer = new GetWalletByPlayerService(repository)

    await createWallet.execute({
      initialBalanceMinor: 20_000n,
      playerId: "player-1",
      walletId: "wallet-1",
    })

    const firstCredit = await creditWallet.execute({
      amountMinor: 3_333n,
      correlationId: "corr-credit-1",
      playerId: "player-1",
      referenceId: "cashout-1",
      source: "games",
    })

    await debitWallet.execute({
      amountMinor: 2_000n,
      correlationId: "corr-debit-1",
      playerId: "player-1",
      referenceId: "bet-1",
      source: "games",
    })

    const retriedCredit = await creditWallet.execute({
      amountMinor: 3_333n,
      correlationId: "corr-credit-1",
      playerId: "player-1",
      referenceId: "cashout-1",
      source: "games",
    })

    const snapshot = await getWalletByPlayer.execute({ playerId: "player-1" })

    expect(retriedCredit.entryId).toBe(firstCredit.entryId)
    expect(snapshot.balanceMinor).toBe("21333")
    expect(snapshot.ledger).toHaveLength(2)
  })
})
