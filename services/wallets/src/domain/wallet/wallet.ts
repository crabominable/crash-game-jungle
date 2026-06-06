import {
  CorrelationConflictError,
  InsufficientFundsError,
  InvalidMoneyAmountError,
} from "./wallet.errors"

export type WalletEntryDirection = "credit" | "debit"
export type WalletOperationSource = "games" | "wallets"

export interface WalletOperationInput {
  amountMinor: bigint
  correlationId: string
  referenceId: string
  source: WalletOperationSource
}

export interface WalletLedgerEntry {
  amountMinor: bigint
  balanceAfterMinor: bigint
  correlationId: string
  direction: WalletEntryDirection
  entryId: string
  occurredAt: string
  referenceId: string
  source: WalletOperationSource
}

interface WalletCreateInput {
  initialBalanceMinor?: bigint
  playerId: string
  walletId: string
}

export class Wallet {
  static create({
    initialBalanceMinor = 0n,
    playerId,
    walletId,
  }: WalletCreateInput): Wallet {
    if (initialBalanceMinor < 0n) {
      throw new InvalidMoneyAmountError(initialBalanceMinor)
    }

    return new Wallet(walletId, playerId, initialBalanceMinor)
  }

  private readonly currencyCode = "BRL"
  private readonly ledgerEntries: WalletLedgerEntry[] = []

  private constructor(
    readonly walletId: string,
    readonly playerId: string,
    private availableBalanceMinor: bigint,
  ) {}

  get balanceMinor(): bigint {
    return this.availableBalanceMinor
  }

  get currency(): string {
    return this.currencyCode
  }

  get ledger(): WalletLedgerEntry[] {
    return [...this.ledgerEntries]
  }

  credit(operation: WalletOperationInput): WalletLedgerEntry {
    return this.applyOperation("credit", operation)
  }

  debit(operation: WalletOperationInput): WalletLedgerEntry {
    return this.applyOperation("debit", operation)
  }

  private applyOperation(
    direction: WalletEntryDirection,
    operation: WalletOperationInput,
  ): WalletLedgerEntry {
    this.assertPositiveAmount(operation.amountMinor)

    const existing = this.findEntryByCorrelationId(operation.correlationId)

    if (existing) {
      if (!this.matchesOperation(existing, direction, operation)) {
        throw new CorrelationConflictError(operation.correlationId)
      }

      return existing
    }

    if (
      direction === "debit" &&
      operation.amountMinor > this.availableBalanceMinor
    ) {
      throw new InsufficientFundsError(
        this.availableBalanceMinor,
        operation.amountMinor,
      )
    }

    this.availableBalanceMinor =
      direction === "credit"
        ? this.availableBalanceMinor + operation.amountMinor
        : this.availableBalanceMinor - operation.amountMinor

    const entry: WalletLedgerEntry = {
      amountMinor: operation.amountMinor,
      balanceAfterMinor: this.availableBalanceMinor,
      correlationId: operation.correlationId,
      direction,
      entryId: `${this.walletId}:${operation.correlationId}`,
      occurredAt: new Date().toISOString(),
      referenceId: operation.referenceId,
      source: operation.source,
    }

    this.ledgerEntries.push(entry)

    return entry
  }

  private assertPositiveAmount(amountMinor: bigint): void {
    if (amountMinor <= 0n) {
      throw new InvalidMoneyAmountError(amountMinor)
    }
  }

  private findEntryByCorrelationId(
    correlationId: string,
  ): WalletLedgerEntry | undefined {
    return this.ledgerEntries.find((entry) => entry.correlationId === correlationId)
  }

  private matchesOperation(
    entry: WalletLedgerEntry,
    direction: WalletEntryDirection,
    operation: WalletOperationInput,
  ): boolean {
    return (
      entry.direction === direction &&
      entry.amountMinor === operation.amountMinor &&
      entry.referenceId === operation.referenceId &&
      entry.source === operation.source
    )
  }
}
