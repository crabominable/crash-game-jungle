export class WalletAlreadyExistsError extends Error {
  constructor(readonly playerId: string) {
    super(`Wallet already exists for player ${playerId}.`)
    this.name = "WalletAlreadyExistsError"
  }
}

export class WalletNotFoundError extends Error {
  constructor(readonly playerId: string) {
    super(`Wallet not found for player ${playerId}.`)
    this.name = "WalletNotFoundError"
  }
}
