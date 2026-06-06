export class InvalidMoneyAmountError extends Error {
  constructor(amountMinor: bigint) {
    super(`Wallet operations require a positive integer amount, received ${amountMinor.toString()}.`)
    this.name = "InvalidMoneyAmountError"
  }
}

export class InsufficientFundsError extends Error {
  constructor(
    readonly balanceMinor: bigint,
    readonly attemptedDebitMinor: bigint,
  ) {
    super(
      `Debit of ${attemptedDebitMinor.toString()} would exceed available balance ${balanceMinor.toString()}.`,
    )
    this.name = "InsufficientFundsError"
  }
}

export class CorrelationConflictError extends Error {
  constructor(readonly correlationId: string) {
    super(
      `Correlation ${correlationId} was already processed with a different wallet operation payload.`,
    )
    this.name = "CorrelationConflictError"
  }
}
