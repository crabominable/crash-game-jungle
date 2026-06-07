import {
  BetAlreadyExistsForPlayerError,
  BetNotEligibleForCashoutError,
  BetNotFoundError,
  CashoutMultiplierOutOfRangeError,
  RoundAlreadyStartedError,
  RoundNotAcceptingBetsError,
  RoundNotInProgressError,
} from "./round.errors"

export type RoundStatus =
  | "betting_open"
  | "in_progress"
  | "crashed"
  | "settled"
export type BetStatus =
  | "bet_pending_wallet"
  | "bet_active"
  | "bet_rejected_by_wallet"
  | "cashout_pending_wallet"
  | "cashout_settlement_pending_or_failed"
  | "won_settled"
  | "lost"

export interface Bet {
  acceptedMultiplierBasisPoints?: number
  amountMinor: bigint
  betId: string
  cashoutCorrelationId?: string
  cashoutRequestedAt?: string
  payoutMinor?: bigint
  placedAt: string
  playerId: string
  status: BetStatus
  walletCorrelationId: string
  walletSettledAt?: string
}

export interface RoundCreateInput {
  algorithmVersion: string
  crashMultiplierBasisPoints: number
  roundId: string
  serverSeed: string
  serverSeedHash: string
  startedAt: string
}

export interface PlaceBetInput {
  amountMinor: bigint
  correlationId: string
  occurredAt: string
  playerId: string
}

export interface ConfirmBetDebitInput {
  betId: string
  occurredAt: string
}

export interface RejectBetDebitInput {
  betId: string
  occurredAt: string
}

export interface AcceptCashoutInput {
  cashoutCorrelationId: string
  occurredAt: string
  payoutMultiplierBasisPoints: number
  playerId: string
}

export class Round {
  static create({
    algorithmVersion,
    crashMultiplierBasisPoints,
    roundId,
    serverSeed,
    serverSeedHash,
    startedAt,
  }: RoundCreateInput): Round {
    return new Round(
      roundId,
      startedAt,
      crashMultiplierBasisPoints,
      algorithmVersion,
      serverSeed,
      serverSeedHash,
    )
  }

  private readonly betEntries: Bet[] = []

  private constructor(
    readonly roundId: string,
    readonly openedAt: string,
    readonly crashMultiplierBasisPoints: number,
    readonly algorithmVersion: string,
    readonly serverSeed: string,
    readonly serverSeedHash: string,
    private currentStatus: RoundStatus = "betting_open",
    private startedAt?: string,
    private crashedAt?: string,
  ) {}

  get bets(): Bet[] {
    return this.betEntries.map((bet) => ({ ...bet }))
  }

  get status(): RoundStatus {
    return this.currentStatus
  }

  get startedAtTimestamp(): string | undefined {
    return this.startedAt
  }

  get crashedAtTimestamp(): string | undefined {
    return this.crashedAt
  }

  placeBet({
    amountMinor,
    correlationId,
    occurredAt,
    playerId,
  }: PlaceBetInput): Bet {
    if (this.currentStatus !== "betting_open") {
      throw new RoundNotAcceptingBetsError(this.roundId)
    }

    if (this.findBetByPlayerId(playerId)) {
      throw new BetAlreadyExistsForPlayerError(this.roundId, playerId)
    }

    const bet: Bet = {
      amountMinor,
      betId: `${this.roundId}:${playerId}`,
      placedAt: occurredAt,
      playerId,
      status: "bet_pending_wallet",
      walletCorrelationId: correlationId,
    }

    this.betEntries.push(bet)

    return { ...bet }
  }

  confirmBetDebit({ betId, occurredAt }: ConfirmBetDebitInput): Bet {
    const bet = this.findBetByIdOrThrow(betId)

    if (bet.status === "bet_pending_wallet") {
      bet.walletSettledAt = occurredAt
      bet.status = this.currentStatus === "crashed" ? "lost" : "bet_active"
    }

    this.reconcileSettledStatus()

    return { ...bet }
  }

  rejectBetDebit({ betId, occurredAt }: RejectBetDebitInput): Bet {
    const bet = this.findBetByIdOrThrow(betId)

    if (bet.status === "bet_pending_wallet") {
      bet.status = "bet_rejected_by_wallet"
      bet.walletSettledAt = occurredAt
    }

    this.reconcileSettledStatus()

    return { ...bet }
  }

  start(occurredAt: string): void {
    if (this.currentStatus !== "betting_open") {
      throw new RoundAlreadyStartedError(this.roundId)
    }

    this.currentStatus = "in_progress"
    this.startedAt = occurredAt
  }

  acceptCashout({
    cashoutCorrelationId,
    occurredAt,
    payoutMultiplierBasisPoints,
    playerId,
  }: AcceptCashoutInput): Bet {
    if (this.currentStatus !== "in_progress") {
      throw new RoundNotInProgressError(this.roundId)
    }

    const bet = this.findBetByPlayerIdOrThrow(playerId)

    if (bet.status !== "bet_active") {
      throw new BetNotEligibleForCashoutError(this.roundId, playerId)
    }

    if (
      !Number.isFinite(payoutMultiplierBasisPoints) ||
      !Number.isInteger(payoutMultiplierBasisPoints) ||
      payoutMultiplierBasisPoints < 10_000 ||
      payoutMultiplierBasisPoints >= this.crashMultiplierBasisPoints
    ) {
      throw new CashoutMultiplierOutOfRangeError(
        this.roundId,
        payoutMultiplierBasisPoints,
      )
    }

    bet.acceptedMultiplierBasisPoints = payoutMultiplierBasisPoints
    bet.cashoutCorrelationId = cashoutCorrelationId
    bet.cashoutRequestedAt = occurredAt
    bet.payoutMinor = calculatePayoutMinor(
      bet.amountMinor,
      payoutMultiplierBasisPoints,
    )
    bet.status = "cashout_pending_wallet"

    return { ...bet }
  }

  confirmCashoutCredit(betId: string, occurredAt: string): Bet {
    const bet = this.findBetByIdOrThrow(betId)

    if (
      bet.status === "cashout_pending_wallet" ||
      bet.status === "cashout_settlement_pending_or_failed"
    ) {
      bet.status = "won_settled"
      bet.walletSettledAt = occurredAt
    }

    this.reconcileSettledStatus()

    return { ...bet }
  }

  rejectCashoutCredit(betId: string, occurredAt: string): Bet {
    const bet = this.findBetByIdOrThrow(betId)

    if (bet.status === "cashout_pending_wallet") {
      bet.status = "cashout_settlement_pending_or_failed"
      bet.walletSettledAt = occurredAt
    }

    this.reconcileSettledStatus()

    return { ...bet }
  }

  crash(occurredAt: string): void {
    if (this.currentStatus !== "in_progress") {
      throw new RoundNotInProgressError(this.roundId)
    }

    this.currentStatus = "crashed"
    this.crashedAt = occurredAt

    for (const bet of this.betEntries) {
      if (bet.status === "bet_active") {
        bet.status = "lost"
      }
    }

    this.reconcileSettledStatus()
  }

  private reconcileSettledStatus(): void {
    if (this.currentStatus !== "crashed") {
      return
    }

    const allBetsTerminal = this.betEntries.every((bet) =>
      ["bet_rejected_by_wallet", "won_settled", "lost"].includes(bet.status),
    )

    if (allBetsTerminal) {
      this.currentStatus = "settled"
    }
  }

  private findBetByIdOrThrow(betId: string): Bet {
    const bet = this.betEntries.find((entry) => entry.betId === betId)

    if (!bet) {
      throw new BetNotFoundError(this.roundId, betId)
    }

    return bet
  }

  private findBetByPlayerId(playerId: string): Bet | undefined {
    return this.betEntries.find((entry) => entry.playerId === playerId)
  }

  private findBetByPlayerIdOrThrow(playerId: string): Bet {
    const bet = this.findBetByPlayerId(playerId)

    if (!bet) {
      throw new BetNotFoundError(this.roundId, playerId)
    }

    return bet
  }
}

export function calculatePayoutMinor(
  amountMinor: bigint,
  multiplierBasisPoints: number,
): bigint {
  return (amountMinor * BigInt(multiplierBasisPoints)) / 10_000n
}
