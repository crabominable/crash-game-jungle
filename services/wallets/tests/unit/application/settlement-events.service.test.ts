import { describe, expect, test } from "bun:test"
import { CreateWalletService } from "../../../src/application/create-wallet.service"
import { GetWalletByPlayerService } from "../../../src/application/get-wallet-by-player.service"
import { HandleBetDebitRequestedEventService } from "../../../src/application/handle-bet-debit-requested-event.service"
import { HandleCashoutCreditRequestedEventService } from "../../../src/application/handle-cashout-credit-requested-event.service"
import { InMemoryWalletRepository } from "../../../src/infrastructure/persistence/in-memory-wallet.repository"

describe("Wallet settlement integration services", () => {
  test("turns a bet debit request into a confirmed event and debits the wallet", async () => {
    const repository = new InMemoryWalletRepository()
    const createWallet = new CreateWalletService(repository)
    const getWalletByPlayer = new GetWalletByPlayerService(repository)
    const handleBetDebitRequested = new HandleBetDebitRequestedEventService(
      repository,
    )

    await createWallet.execute({
      initialBalanceMinor: 20_000n,
      playerId: "player-1",
      walletId: "wallet-1",
    })

    const event = await handleBetDebitRequested.execute({
      correlationId: "corr-bet-1",
      emittedAt: "2026-06-06T00:00:01.000Z",
      name: "bet.debit.requested",
      payload: {
        amountMinor: "2000",
        betId: "round-1:player-1",
        playerId: "player-1",
        roundId: "round-1",
      },
      source: "games",
    })

    const wallet = await getWalletByPlayer.execute({ playerId: "player-1" })

    expect(event).toMatchObject({
      correlationId: "corr-bet-1",
      name: "bet.debit.confirmed",
      payload: {
        betId: "round-1:player-1",
        playerId: "player-1",
        roundId: "round-1",
      },
      source: "wallets",
    })
    expect(wallet.balanceMinor).toBe("18000")
  })

  test("turns an insufficient-funds debit request into a rejected event", async () => {
    const repository = new InMemoryWalletRepository()
    const createWallet = new CreateWalletService(repository)
    const handleBetDebitRequested = new HandleBetDebitRequestedEventService(
      repository,
    )

    await createWallet.execute({
      initialBalanceMinor: 1_000n,
      playerId: "player-1",
      walletId: "wallet-1",
    })

    const event = await handleBetDebitRequested.execute({
      correlationId: "corr-bet-1",
      emittedAt: "2026-06-06T00:00:01.000Z",
      name: "bet.debit.requested",
      payload: {
        amountMinor: "2000",
        betId: "round-1:player-1",
        playerId: "player-1",
        roundId: "round-1",
      },
      source: "games",
    })

    expect(event).toMatchObject({
      correlationId: "corr-bet-1",
      name: "bet.debit.rejected",
      payload: {
        betId: "round-1:player-1",
        playerId: "player-1",
        roundId: "round-1",
        reason: "insufficient_funds",
      },
      source: "wallets",
    })
  })

  test("turns a cashout credit request into a confirmed event and credits the wallet", async () => {
    const repository = new InMemoryWalletRepository()
    const createWallet = new CreateWalletService(repository)
    const getWalletByPlayer = new GetWalletByPlayerService(repository)
    const handleCashoutCreditRequested =
      new HandleCashoutCreditRequestedEventService(repository)

    await createWallet.execute({
      initialBalanceMinor: 20_000n,
      playerId: "player-1",
      walletId: "wallet-1",
    })

    const event = await handleCashoutCreditRequested.execute({
      correlationId: "corr-cashout-1",
      emittedAt: "2026-06-06T00:00:11.000Z",
      name: "bet.cashout.credit.requested",
      payload: {
        betId: "round-1:player-1",
        payoutMinor: "3500",
        playerId: "player-1",
        roundId: "round-1",
      },
      source: "games",
    })

    const wallet = await getWalletByPlayer.execute({ playerId: "player-1" })

    expect(event).toMatchObject({
      correlationId: "corr-cashout-1",
      name: "bet.cashout.credit.confirmed",
      payload: {
        betId: "round-1:player-1",
        playerId: "player-1",
        roundId: "round-1",
      },
      source: "wallets",
    })
    expect(wallet.balanceMinor).toBe("23500")
  })

  test("keeps duplicate debit requests idempotent at the integration layer", async () => {
    const repository = new InMemoryWalletRepository()
    const createWallet = new CreateWalletService(repository)
    const getWalletByPlayer = new GetWalletByPlayerService(repository)
    const handleBetDebitRequested = new HandleBetDebitRequestedEventService(
      repository,
    )

    await createWallet.execute({
      initialBalanceMinor: 20_000n,
      playerId: "player-1",
      walletId: "wallet-1",
    })

    const firstEvent = await handleBetDebitRequested.execute({
      correlationId: "corr-bet-1",
      emittedAt: "2026-06-06T00:00:01.000Z",
      name: "bet.debit.requested",
      payload: {
        amountMinor: "2000",
        betId: "round-1:player-1",
        playerId: "player-1",
        roundId: "round-1",
      },
      source: "games",
    })

    const repeatedEvent = await handleBetDebitRequested.execute({
      correlationId: "corr-bet-1",
      emittedAt: "2026-06-06T00:00:02.000Z",
      name: "bet.debit.requested",
      payload: {
        amountMinor: "2000",
        betId: "round-1:player-1",
        playerId: "player-1",
        roundId: "round-1",
      },
      source: "games",
    })

    const wallet = await getWalletByPlayer.execute({ playerId: "player-1" })

    expect(repeatedEvent).toEqual(firstEvent)
    expect(wallet.balanceMinor).toBe("18000")
    expect(wallet.ledger).toHaveLength(1)
  })
})
