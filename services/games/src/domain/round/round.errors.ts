export class RoundAlreadyStartedError extends Error {
  constructor(readonly roundId: string) {
    super(`Round ${roundId} already left the betting phase.`)
    this.name = "RoundAlreadyStartedError"
  }
}

export class RoundNotAcceptingBetsError extends Error {
  constructor(readonly roundId: string) {
    super(`Round ${roundId} is not accepting bets anymore.`)
    this.name = "RoundNotAcceptingBetsError"
  }
}

export class RoundNotInProgressError extends Error {
  constructor(readonly roundId: string) {
    super(`Round ${roundId} is not currently in progress.`)
    this.name = "RoundNotInProgressError"
  }
}

export class BetAlreadyExistsForPlayerError extends Error {
  constructor(
    readonly roundId: string,
    readonly playerId: string,
  ) {
    super(`Player ${playerId} already has a bet for round ${roundId}.`)
    this.name = "BetAlreadyExistsForPlayerError"
  }
}

export class BetNotFoundError extends Error {
  constructor(
    readonly roundId: string,
    readonly playerId: string,
  ) {
    super(`No bet found for player ${playerId} in round ${roundId}.`)
    this.name = "BetNotFoundError"
  }
}

export class BetNotEligibleForCashoutError extends Error {
  constructor(
    readonly roundId: string,
    readonly playerId: string,
  ) {
    super(`Bet for player ${playerId} in round ${roundId} is not eligible for cashout.`)
    this.name = "BetNotEligibleForCashoutError"
  }
}

export class CashoutMultiplierOutOfRangeError extends Error {
  constructor(
    readonly roundId: string,
    readonly multiplierBasisPoints: number,
  ) {
    super(
      `Cashout multiplier ${multiplierBasisPoints} is outside the valid range for round ${roundId}.`,
    )
    this.name = "CashoutMultiplierOutOfRangeError"
  }
}
