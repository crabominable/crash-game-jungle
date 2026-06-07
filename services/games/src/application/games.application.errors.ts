export class CurrentRoundAlreadyExistsError extends Error {
  constructor(readonly roundId: string) {
    super(`Current round already exists; cannot create round ${roundId}.`)
    this.name = "CurrentRoundAlreadyExistsError"
  }
}

export class CurrentRoundNotFoundError extends Error {
  constructor() {
    super("No current round is available.")
    this.name = "CurrentRoundNotFoundError"
  }
}

export class RoundNotFoundError extends Error {
  constructor(readonly roundId: string) {
    super(`Round ${roundId} not found`)
    this.name = "RoundNotFoundError"
  }
}
