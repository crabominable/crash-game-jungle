import type { Wallet, WalletLedgerEntry } from "../domain/wallet/wallet"

export interface WalletLedgerEntrySnapshot {
  amountMinor: string
  balanceAfterMinor: string
  correlationId: string
  direction: WalletLedgerEntry["direction"]
  entryId: string
  occurredAt: string
  referenceId: string
  source: WalletLedgerEntry["source"]
}

export interface WalletSnapshot {
  balanceMinor: string
  currency: string
  ledger: WalletLedgerEntrySnapshot[]
  playerId: string
  walletId: string
}

export function toWalletSnapshot(wallet: Wallet): WalletSnapshot {
  return {
    balanceMinor: wallet.balanceMinor.toString(),
    currency: wallet.currency,
    ledger: wallet.ledger.map(toWalletLedgerEntrySnapshot),
    playerId: wallet.playerId,
    walletId: wallet.walletId,
  }
}

export function toWalletLedgerEntrySnapshot(
  entry: WalletLedgerEntry,
): WalletLedgerEntrySnapshot {
  return {
    amountMinor: entry.amountMinor.toString(),
    balanceAfterMinor: entry.balanceAfterMinor.toString(),
    correlationId: entry.correlationId,
    direction: entry.direction,
    entryId: entry.entryId,
    occurredAt: entry.occurredAt,
    referenceId: entry.referenceId,
    source: entry.source,
  }
}
